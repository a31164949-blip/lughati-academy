const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function fixture() {
  const records = { one: { studentName: 'طالب', classroom: 'أ', message: 'رسالة', revision: 'v1', admissionStatus: 'waiting' }, two: { studentName: 'آخر', classroom: 'ب', message: 'خاصة', revision: 'v2', teacherReply: 'رد خاص' } };
  const round = { acceptedStudentIds: [] }, writes = [];
  const ref = (kind, id) => ({ kind, id, get: async () => snapshot(kind, id), collection: () => ({ doc: id => ref('request', id) }) });
  const snapshot = (kind, id) => ({ exists: kind !== 'request' || !!records[id], id, data: () => kind === 'request' ? records[id] : kind === 'round' ? round : { studentName: id, classroom: 'أ' } });
  const db = { collection: name => ({ doc: id => ref(name === 'students' ? 'student' : 'round', id) }), runTransaction: async fn => fn({ get: r => r.get(), update: (r, data) => { writes.push(r.kind); Object.assign(records[r.id], data); }, set: (r, data) => { writes.push(r.kind); Object.assign(r.kind === 'request' ? records[r.id] : round, data); } }) };
  function compile(path, mocks) { const module = { exports: {} }; vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports, require: n => mocks[n], Date, URL }); return module.exports; }
  const policy = compile('app/lib/academyContinuation.ts', {});
  const api = compile('app/api/academy-continuation/route.ts', {
    'node:crypto': require('node:crypto'), 'next/cache': { revalidateTag() {} },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options.status }) } },
    'firebase-admin/firestore': { FieldPath: {}, FieldValue: { serverTimestamp: () => ({ toDate: () => new Date() }) } },
    '../../../firebase-admin': { getFirebaseAdmin: () => ({ adminDb: db, adminAuth: { verifyIdToken: async who => who === 'teacher' ? { uid: who, role: 'teacher' } : { uid: who, role: 'student', studentDocId: who } } }) },
    '../../lib/academyContinuation': policy
  });
  const req = (who, body, scope = '') => ({ headers: { get: () => 'Bearer ' + who }, json: async () => body, url: 'https://test/api/academy-continuation' + scope });
  return { api, req, records, writes };
}
test('teacher saves private reply; owner reads it; admission and other requests remain unchanged', async () => {
  const f = fixture(), r = await f.api.PATCH(f.req('teacher', { studentId: 'one', revision: 'v1', teacherReply: '  مرحبًا  ' }));
  assert.equal(r.status, 200); assert.equal(r.body.teacherReply, 'مرحبًا');
  assert.equal(f.records.one.admissionStatus, 'waiting'); assert.deepEqual(f.writes, ['request']);
  const own = await f.api.GET(f.req('one')); assert.equal(own.body.request.teacherReply, 'مرحبًا'); assert.ok(own.body.request.teacherReplyAt);
  const other = await f.api.GET(f.req('two')); assert.equal(other.body.request.teacherReply, 'رد خاص');
  assert.equal((await f.api.GET(f.req('one', null, '?scope=all'))).status, 403);
});
test('students cannot reply and invalid, mixed or stale changes never write', async () => {
  for (const [who, extra, status] of [
    ['one', { teacherReply: 'رد' }, 403], ['teacher', { teacherReply: '' }, 400],
    ['teacher', { teacherReply: 'x'.repeat(1001) }, 400], ['teacher', { teacherReply: 123 }, 400],
    ['teacher', { teacherReply: 'رد', admissionStatus: 'accepted' }, 400],
    ['teacher', { teacherReply: 'رد', revision: 'old' }, 409]
  ]) { const f = fixture(); const r = await f.api.PATCH(f.req(who, { studentId: 'one', revision: 'v1', ...extra })); assert.equal(r.status, status); assert.equal(f.writes.length, 0); }
});
test('student editing their message preserves teacher reply and cannot overwrite it', async () => {
  const f = fixture(); f.records.one.teacherReply = 'رد المعلم';
  const r = await f.api.POST(f.req('one', { wantsToContinue: true, message: 'تحديث', teacherReply: 'تزوير' }));
  assert.equal(r.status, 200); assert.equal(r.body.request.teacherReply, 'رد المعلم'); assert.equal(f.records.one.teacherReply, 'رد المعلم');
});
