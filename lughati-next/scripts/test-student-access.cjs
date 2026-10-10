const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, { exports, require: name => { if (!(name in mocks)) throw new Error('Unexpected dependency ' + name); return mocks[name]; }, Date, process, console, Request }, { filename: path });
  return exports;
}
const { evaluateAccess } = load('app/lib/studentAccessPolicy.ts');
const day = 86400000, now = Date.now();
const input = { now, enrolledAt: now - 30 * day, latestActivity: null };
assert.equal(evaluateAccess(input).automatic, true);
assert.equal(evaluateAccess({ ...input, latestActivity: now - 14 * day + 1 }).automatic, false);
assert.equal(evaluateAccess({ ...input, latestActivity: now - 14 * day }).automatic, true);
assert.equal(evaluateAccess({ ...input, enrolledAt: now - day }).extrasSuspended, false);
assert.equal(evaluateAccess({ ...input, enrolledAt: null }).extrasSuspended, false);
assert.equal(evaluateAccess({ ...input, mode: 'extras', until: now + day }).accountSuspended, false);
assert.equal(evaluateAccess({ ...input, mode: 'account', until: now + day }).accountSuspended, true);
assert.equal(evaluateAccess({ ...input, mode: 'account', until: now, latestActivity: now }).accountSuspended, false);
assert.equal(evaluateAccess({ ...input, mode: 'resume', resumedAt: now }).extrasSuspended, false);
assert.equal(evaluateAccess({ ...input, mode: 'resume', resumedAt: now - 14 * day }).automatic, true);
assert.equal(evaluateAccess({ ...input, mode: 'extras', until: now + day, latestActivity: now }).extrasSuspended, true);
let token = { uid: 'student-uid', role: 'student', studentDocId: 'student-doc' };
let control = { mode: 'account', until: { toMillis: () => now + day } };
const rawAuth = { verifyIdToken: async () => token, createCustomToken() { assert.equal(this, rawAuth); return 'custom'; } };
const db = { collection: () => ({ doc: () => ({ get: async () => ({ data: () => ({ accessControl: control }) }) }) }) };
const { getFirebaseAdmin } = load('firebase-admin.ts', {
  'server-only': {},
  'firebase-admin/app': { getApps: () => [{}] },
  'firebase-admin/auth': { getAuth: () => rawAuth },
  'firebase-admin/firestore': { getFirestore: () => db },
});
(async () => {
  await assert.rejects(getFirebaseAdmin().adminAuth.verifyIdToken('token'), /FORBIDDEN/);
  assert.equal((await getFirebaseAdmin({ allowSuspended: true }).adminAuth.verifyIdToken('token')).studentDocId, 'student-doc');
  control.until = { toMillis: () => now - 1 };
  assert.equal((await getFirebaseAdmin().adminAuth.verifyIdToken('token')).uid, token.uid);
  control = { mode: 'extras', until: { toMillis: () => now + day } };
  assert.equal((await getFirebaseAdmin().adminAuth.verifyIdToken('token')).uid, token.uid);
  token = { uid: 'teacher-uid', role: 'teacher' }; control.mode = 'account';
  assert.equal((await getFirebaseAdmin().adminAuth.verifyIdToken('token')).role, 'teacher');
  assert.equal(getFirebaseAdmin().adminAuth.createCustomToken(), 'custom');
  let homework = [{ status: 'completed', completedAt: { toMillis: () => now } }];
  let readings = [];
  const bounds = [];
  let activityFailure = null;
  const activityDb = { collection: name => {
    function makeQuery(filters = []) {
      const query = {
        where(field, op, value) {
          if (op === '>=') bounds.push([name, field, value]);
          return makeQuery([...filters, [field, op, value]]);
        },
        select() { return query; },
        async get() {
          if (activityFailure && filters.some(([,op]) => op === '>=')) throw activityFailure;
          return { docs: (name === 'homeworkCompletions' ? homework : readings)
            .filter(data => filters.every(([field, op, value]) => op !== '>=' || (data[field]?.toMillis?.() ?? 0) >= value.getTime()))
            .map(data => ({ data: () => data })) };
        },
      }; return query;
    } return makeQuery();
  } };
  const server = load('app/lib/studentAccess.ts', {
    'server-only': {},
    'next/cache': { unstable_cache: callback => callback, revalidateTag: () => {} },
    '../../firebase-admin': { getFirebaseAdmin: () => ({ adminDb: activityDb, adminAuth: { verifyIdToken: async () => ({ role: 'student', studentDocId: 'own' }) } }) },
    './studentAccessPolicy': { evaluateAccess, INACTIVITY_DAYS: 14 },
  });
  const student = { createdAt: { toMillis: () => now - 30 * day } };
  assert.equal((await server.studentAccess('own', student)).extrasSuspended, false);
  homework[0].solutionStatus = 'rejected';
  assert.equal((await server.studentAccess('own', student)).extrasSuspended, true);
  readings = [{ status: 'pending', createdAt: { toMillis: () => now } }];
  assert.equal((await server.studentAccess('own', student)).extrasSuspended, false);
  readings[0].status = 'rejected';
  assert.equal((await server.studentAccess('own', student)).extrasSuspended, true);
  await assert.rejects(server.requireStudentExtras('own', student), /FORBIDDEN/);
  assert.ok(bounds.some(([name, field]) => name === 'homeworkCompletions' && field === 'completedAt'));
  assert.ok(bounds.some(([name, field]) => name === 'reading-submissions' && field === 'createdAt'));
  readings = [{ status: 'approved', createdAt: { toMillis: () => now - 20 * day } }];
  assert.equal((await server.studentAccess('own', student)).extrasSuspended, true);
  readings.push({ status: 'approved', createdAt: { toMillis: () => now - day } });
  assert.equal((await server.studentAccess('own', student)).extrasSuspended, false);
  activityFailure = Object.assign(new Error('index building'), { code: 9 });
  assert.equal((await server.studentAccess('own', student)).extrasSuspended, false, 'index rollout preserves active student access');
  activityFailure = Object.assign(new Error('permission denied'), { code: 7 });
  await assert.rejects(server.studentAccess('own', student), /permission denied/);
  const beforeManual = bounds.length;
  assert.equal((await server.studentAccess('own', { ...student, accessControl: { mode: 'account' } })).accountSuspended, true);
  assert.equal(bounds.length, beforeManual, 'manual freezing must not scan activity');
  activityFailure = null;
  await server.requireSubmissionIdentity(new Request('https://example.com', { headers: { Authorization: 'Bearer token' } }), 'own');
  await assert.rejects(server.requireSubmissionIdentity(new Request('https://example.com', { headers: { Authorization: 'Bearer token' } }), 'other'), /FORBIDDEN/);
  await assert.rejects(server.requireSubmissionIdentity(new Request('https://example.com'), 'own'), /UNAUTHORIZED/);
  console.log('Student access policy, bounded activity and authentication checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
