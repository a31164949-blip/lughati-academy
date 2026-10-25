const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let admitted = false, role = 'student', reads = 0;
const query = { where() { return this; }, orderBy() { return this; }, limit() { return this; }, get: async () => ({ docs: [], size: 0 }), doc: () => ({ get: async () => { reads++; return { data: () => ({ name: 'طالب', active: true }) }; } }) };
const mocks = {
  'node:crypto': require('node:crypto'),
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init.status }) } },
  'firebase-admin/firestore': { FieldPath: { documentId: () => 'id' }, FieldValue: {} },
  '../../../firebase-admin': { getFirebaseAdmin: (options) => ({ adminDb: { collection: () => query }, adminAuth: { verifyIdToken: async () => {
    if (role === 'student' && !admitted && !options?.allowSuspended) throw Error('FORBIDDEN');
    return { role, uid: 'uid', studentDocId: 'student-001' };
  } } }) },
  '../../lib/academyCouncilPolicy': { validCouncilId: () => true },
};
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/academy-council/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
  exports: exportsObject, require: name => { if (!(name in mocks)) throw Error(name); return mocks[name]; }, URL, Date, Error,
});
(async () => {
  for (const method of ['GET', 'POST', 'PATCH']) {
    const response = await exportsObject[method](new Request('https://academy.test/api/academy-council', { method, headers: { Authorization: 'Bearer token' }, ...(method === 'GET' ? {} : { body: '{}' }) }));
    assert.equal(response.status, 403, method + ' must reject non-admitted students');
  }
  assert.equal(reads, 0, 'denied requests must not read student or council data');
  admitted = true;
  assert.equal((await exportsObject.GET(new Request('https://academy.test/api/academy-council', { headers: { Authorization: 'Bearer token' } }))).status, 200);
  role = 'teacher'; admitted = false;
  assert.equal((await exportsObject.GET(new Request('https://academy.test/api/academy-council', { headers: { Authorization: 'Bearer token' } }))).status, 200);
  console.log('Council admission regression checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
