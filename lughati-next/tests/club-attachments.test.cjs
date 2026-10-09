const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(path, mocks) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name), URL, Date, Promise, Error });
  return module.exports;
}
const id = '12345678-1234-1234-1234-123456789abc';
function fixture() {
  const docs = new Map(); let signs = 0, heads = 0;
  const db = { collection: name => ({ doc: id => ({ path: name + '/' + id, get: async () => ({ data: () => docs.get(name + '/' + id) }) }) }), runTransaction: async fn => fn({ get: async r => ({ data: () => docs.get(r.path) }), update: (r, d) => docs.set(r.path, {...docs.get(r.path), ...d}) }) };
  const admin = { getFirebaseAdmin: () => ({ adminDb: db }) };
  const video = { verifyVideoObject: async () => { heads++; }, videoPlaybackUrl: async () => { signs++; return 'https://private/file'; } };
  const actor = { mediaActor: async req => { if (!req.uid) throw Error('UNAUTHORIZED'); return { uid: req.uid, teacher: req.uid === 'teacher' }; } };
  const helper = load('app/lib/clubAttachmentsServer.ts', { 'server-only': {}, '../../firebase-admin': admin, './r2Media': actor, './r2Video': video, './clubAttachments': { MAX_CLUB_ATTACHMENTS: 6 } });
  const route = load('app/api/academy-club/attachments/route.ts', { 'next/server': { NextResponse: { json: (data, options) => ({ data, status: options?.status || 200 }) } }, '../../../../firebase-admin': admin, '../../../lib/r2Media': actor, '../../../lib/clubMember': { requireClubMember: async req => { if (req.uid !== 'member') throw Error('MEMBERSHIP_REQUIRED'); } }, '../../../lib/r2Video': video });
  const request = uid => ({ uid, url: 'https://test/api?id=' + id });
  return { docs, helper, route, request, metrics: () => ({ signs, heads }) };
}
test('only teacher-owned, bounded, unique uploads can be published', async () => {
  const f = fixture();
  f.docs.set('clubAttachmentUploads/' + id, { uid: 'teacher', key: 'private/key', name: 'work.pdf', size: 100, contentType: 'application/pdf' });
  await assert.rejects(f.helper.verifyClubAttachments('other', [{ id }]), /INVALID_ATTACHMENT/);
  await assert.rejects(f.helper.verifyClubAttachments('teacher', [{ id }, { id }]), /INVALID_ATTACHMENT/);
  assert.equal(f.metrics().heads, 0);
  assert.equal((await f.helper.verifyClubAttachments('teacher', [{ id }]))[0].name, 'work.pdf');
  for (let i = 0; i < 4; i++) await f.helper.verifyClubAttachments('teacher', [{ id }]);
  await assert.rejects(f.helper.verifyClubAttachments('teacher', [{ id }]), /INVALID_ATTACHMENT/);
  assert.equal(f.metrics().heads, 5);
});
test('playback denies anonymous/nonmembers, detached files and mismatched owners before signing', async () => {
  const f = fixture();
  f.docs.set('academyClubChallenges/current', { active: true, createdBy: 'teacher', attachments: [{ id }] });
  f.docs.set('clubAttachmentUploads/' + id, { uid: 'teacher', key: 'private/key' });
  assert.equal((await f.route.GET(f.request(''))).status, 401);
  assert.equal((await f.route.GET(f.request('other'))).status, 403);
  assert.equal(f.metrics().signs, 0);
  assert.equal((await f.route.GET(f.request('member'))).status, 200);
  assert.equal((await f.route.GET(f.request('teacher'))).status, 200);
  f.docs.set('clubAttachmentUploads/' + id, { uid: 'other', key: 'private/key' });
  assert.equal((await f.route.GET(f.request('member'))).status, 404);
  f.docs.set('academyClubChallenges/current', { active: true, attachments: [] });
  assert.equal((await f.route.GET(f.request('member'))).status, 404);
  assert.equal(f.metrics().signs, 2);
});
