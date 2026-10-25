const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
let actor = { teacher: false, uid: 'uid', studentId: 'student-1' }, notice = { noticeId: 'n1', active: true, allowReplies: true, title: 't', message: 'm', href: '', linkLabel: '' };
let saved, ownId, lastTime = 0, fresh = notice;
const chain = { collection: () => chain, doc: id => { ownId = id; return chain; }, get: async () => ({ exists: true, id: ownId, data: () => ({ text: 'own' }) }) };
const snapshots = () => [{ data: () => fresh }, { data: () => ({ studentName: 'Student', classroom: 'A' }) }, { data: () => ({ updatedAt: { toMillis: () => lastTime } }) }];
const db = { collection: () => chain, runTransaction: async fn => { let index = 0; return fn({ get: async () => snapshots()[index++], set: (ref, data) => { saved = data; } }); } };
const mocks = {
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init.status }) } },
  'firebase-admin/firestore': { FieldPath: { documentId: () => 'id' }, FieldValue: { serverTimestamp: () => 'now' } },
  '../../../../firebase-admin': { getFirebaseAdmin: () => ({ adminDb: db }) },
  '../../../lib/studentNoticeIdentity': { noticeIdentity: async () => actor },
  '../../../lib/readStudentNotice': { readStudentNotice: async () => notice },
};
const out = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/student-front-notice/replies/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports: out, require: n => mocks[n], URL, Date, Error });
const request = text => ({ url: 'https://academy.test/api/student-front-notice/replies?noticeId=n1&studentId=someone-else', json: async () => ({ noticeId: 'n1', text, studentId: 'someone-else' }) });
(async () => {
  assert.equal((await out.GET(request())).body.reply.text, 'own'); assert.equal(ownId, 'student-1');
  assert.equal((await out.POST(request('hello'))).status, 200); assert.equal(saved.studentId, 'student-1');
  assert.equal((await out.POST(request('   '))).status, 400);
  assert.equal((await out.POST(request('x'.repeat(801)))).status, 400);
  lastTime = Date.now(); assert.equal((await out.POST(request('hello'))).status, 429); lastTime = 0;
  fresh = { ...notice, allowReplies: false }; assert.equal((await out.POST(request('hello'))).status, 409);
  fresh = { ...notice, message: 'changed' }; assert.equal((await out.POST(request('hello'))).status, 409);
  fresh = notice; notice.allowReplies = false; assert.equal((await out.POST(request('hello'))).status, 409);
  actor.teacher = true; assert.equal((await out.POST(request('hello'))).status, 403);
  console.log('Notice reply privacy, ownership, closure, stale-message and rate-limit checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
