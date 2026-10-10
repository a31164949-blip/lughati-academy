const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, { exports, require: name => name in mocks ? mocks[name] : require(name), Request, Response, URL, Date, console }, { filename: path });
  return exports;
}
const policy = load('app/lib/familyResourcesPolicy.ts');
const legacy = { published: true, classroom: 'جميع طلاب الصف الثاني' };
assert.equal(policy.canViewFamilyResource(legacy, 's1', 'الثاني أ'), true);
assert.equal(policy.canViewFamilyResource({ ...legacy, classroom: 'الصف الثاني أ' }, 's1', 'الثاني أ'), true);
assert.equal(policy.canViewFamilyResource({ ...legacy, classroom: 'الصف الثاني ب' }, 's1', 'الثاني أ'), false);
const targeted = { ...legacy, audience: 'student', targetStudentId: 's1' };
assert.equal(policy.canViewFamilyResource(targeted, 's1', 'الثاني ب'), true);
assert.equal(policy.canViewFamilyResource(targeted, 's2', 'الثاني أ'), false);
assert.equal(policy.canViewFamilyResource({ ...targeted, published: false }, 's1', 'الثاني أ'), false);
assert.equal(policy.canViewFamilyResource({ ...targeted, targetStudentId: '' }, 's1', 'الثاني أ'), false);
assert.equal(policy.canViewFamilyResource({ ...legacy, audience: 'invalid' }, 's1', 'الثاني أ'), false);
let token = { uid: 'teacher', role: 'teacher' };
let sequence = 0;
const records = new Map([
  ['students/s1', { studentName: 'طالب أول', classroom: 'الثاني أ', loginCode: 'PRIVATE' }],
  ['students/s2', { studentName: 'طالب ثان', classroom: 'الثاني أ' }],
  ['students/archived', { studentName: 'مؤرشف', archived: true }],
  ['familyLearningResources/general', { ...legacy, title: 'للجميع' }],
]);
const invalidations = [];
function ref(collection, id = 'new' + (++sequence)) { return { path: collection + '/' + id, id, async get() { return snapshot(this.path); } }; }
function snapshot(path) { return { id: path.split('/')[1], exists: records.has(path), data: () => records.get(path) }; }
const db = {
  collection(name) {
    let filter = null, limit = Infinity, order = false;
    return { doc: id => ref(name, id), where(field, operation, value) { filter = { field, value }; return this; }, orderBy() { order = true; return this; }, limit(value) { limit = value; return this; }, async get() { let paths = [...records.keys()].filter(path => path.startsWith(name + '/') && (!filter || records.get(path)[filter.field] === filter.value)); if (order) paths.sort((a, b) => (records.get(b).createdAt?.toMillis?.() || 0) - (records.get(a).createdAt?.toMillis?.() || 0)); return { docs: paths.slice(0, limit).map(snapshot) }; } };
  },
  async runTransaction(callback) {
    const writes = [];
    const result = await callback({ get: reference => reference.get(), set: (reference, data) => writes.push(() => records.set(reference.path, data)), update: (reference, data) => writes.push(() => records.set(reference.path, { ...records.get(reference.path), ...data })), delete: reference => writes.push(() => records.delete(reference.path)) });
    writes.forEach(write => write()); return result;
  },
};
const route = load('app/api/family-learning-resources/route.ts', {
  'next/server': { NextResponse: { json: (data, options) => Response.json(data, options) } },
  'next/cache': { revalidateTag: tag => invalidations.push(tag) },
  'firebase-admin/firestore': { FieldValue: { serverTimestamp: () => ({ toMillis: () => Date.now() }) } },
  '../../../firebase-admin': { getFirebaseAdmin: () => ({ adminDb: db, adminAuth: { verifyIdToken: async () => token } }) },
  '../../lib/familyResourcesPolicy': policy,
});
const request = (method, body, query = '') => new Request('https://example.com/api/family-learning-resources' + query, { method, headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
const post = { title: 'ورقة خاصة', category: 'test', audience: 'student', targetStudentId: 's1', fileUrl: 'https://res.cloudinary.com/example/worksheet.pdf', fileName: 'worksheet.pdf' };
(async () => {
  let response = await route.POST(request('POST', post));
  assert.equal(response.status, 200);
  const { id } = await response.json();
  const noticePath = 'studentNotifications/' + policy.resourceNotificationId(id, 's1');
  assert.equal(records.get('familyLearningResources/' + id).targetStudentName, 'طالب أول');
  assert.equal(records.get(noticePath).studentId, 's1');
  assert.equal(records.get(noticePath).href, '/quizzes#learning-resource-' + id);
  assert.equal(invalidations.length, 1);
  token = { role: 'student', studentDocId: 's2' };
  let data = await (await route.GET(request('GET', null, '?includeStudents=1'))).json();
  assert.equal(data.students, undefined);
  assert.equal(data.items.some(item => item.id === id), false);
  assert.equal(data.items.some(item => item.id === 'general'), true);
  assert.equal((await route.POST(request('POST', post))).status, 403);
  token = { role: 'student', studentDocId: 's1' };
  data = await (await route.GET(request('GET'))).json();
  assert.equal(data.items.filter(item => item.id === id).length, 1);
  for (let index = 0; index < 110; index++) records.set('familyLearningResources/newer' + index, { published: true, audience: 'student', targetStudentId: 's2', classroom: 'الثاني أ', createdAt: { toMillis: () => Date.now() + 100000 + index } });
  data = await (await route.GET(request('GET'))).json();
  assert.equal(data.items.some(item => item.id === id), true);
  assert.equal(data.items.some(item => item.targetStudentId === 's2'), false);
  for (let index = 0; index < 110; index++) records.delete('familyLearningResources/newer' + index);
  token = { role: 'teacher' };
  data = await (await route.GET(request('GET', null, '?includeStudents=1'))).json();
  assert.equal(data.students.length, 2);
  assert.equal(data.students.some(student => 'loginCode' in student), false);
  const before = records.size;
  assert.equal((await route.POST(request('POST', { ...post, targetStudentId: 'archived' }))).status, 400);
  assert.equal((await route.POST(request('POST', { ...post, targetStudentId: 'missing' }))).status, 400);
  assert.equal((await route.POST(request('POST', { ...post, targetStudentId: '' }))).status, 400);
  assert.equal((await route.POST(request('POST', { ...post, audience: 'classroom' }))).status, 400);
  assert.equal(records.size, before);
  assert.equal((await route.PATCH(request('PATCH', { id, published: false }))).status, 200);
  assert.equal(records.has(noticePath), false);
  token = { role: 'student', studentDocId: 's1' };
  data = await (await route.GET(request('GET'))).json();
  assert.equal(data.items.some(item => item.id === id), false);
  token = { role: 'teacher' };
  await route.PATCH(request('PATCH', { id, published: true }));
  await route.PATCH(request('PATCH', { id, published: true }));
  assert.equal([...records.keys()].filter(path => path.startsWith('studentNotifications/')).length, 1);
  assert.equal((await route.DELETE(request('DELETE', null, '?id=' + id))).status, 200);
  assert.equal(records.has(noticePath), false);
  assert.equal(records.has('familyLearningResources/' + id), false);
  console.log('Family resource targeting, recipient privacy, atomic notifications and lifecycle checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
