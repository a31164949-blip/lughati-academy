const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(path, mocks) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name), process, URL, Date, Promise, Set, Error });
  return module.exports;
}
function fixture() {
  const docs = new Map(); let signatures = 0, heads = 0;
  class Stamp { constructor(ms) { this.ms = ms } toMillis() { return this.ms } toDate() { return new Date(this.ms) } static now() { return new Stamp(Date.now()) } }
  const snap = path => ({ exists: docs.has(path), data: () => docs.get(path) });
  const ref = path => ({ path, id: path.split('/').at(-1), get: async () => snap(path) });
  let lock = Promise.resolve();
  const db = { collection: name => ({ doc: id => ref(name + '/' + id) }), runTransaction: fn => {
    const pending = lock.then(async () => {
      const writes = []; let writing = false;
      const tx = { get: async r => { assert(!writing); return snap(r.path) }, set: (r, d) => { writing = true; writes.push(() => docs.set(r.path, d)) }, create: (r, d) => { assert(!docs.has(r.path)); writing = true; writes.push(() => docs.set(r.path, d)) }, update: (r, d) => { writing = true; writes.push(() => docs.set(r.path, { ...docs.get(r.path), ...d })) } };
      const result = await fn(tx); writes.forEach(fn => fn()); return result;
    }); lock = pending.catch(() => {}); return pending;
  } };
  const admin = { getFirebaseAdmin: () => ({ adminDb: db, adminAuth: { verifyIdToken: async id => { if (id === 'bad') throw Error('invalid'); return { uid: id, role: id === 'teacher' ? 'teacher' : 'student', studentDocId: id } } } }) };
  const member = load('app/lib/clubMember.ts', { 'server-only': {}, 'firebase-admin/firestore': { Timestamp: Stamp }, '../../firebase-admin': admin });
  const video = { MAX_VIDEO_BYTES: 20 * 1024 * 1024, VIDEO_TYPES: { 'video/mp4': 'mp4' }, videoUploadUrl: async () => { signatures++; return 'https://r2.test/signed' }, videoPlaybackUrl: async () => 'https://r2.test/play', verifyVideoObject: async () => { heads++ } };
  const common = { 'next/server': { NextResponse: { json: (data, options) => ({ data, status: options?.status || 200 }) } }, 'firebase-admin/firestore': { Timestamp: Stamp, FieldValue: { serverTimestamp: () => Stamp.now() } }, '../../../../firebase-admin': admin, '../../../lib/clubMember': member, '../../../lib/r2Video': video };
  const upload = load('app/api/academy-club/video/route.ts', common);
  const submit = load('app/api/academy-club/challenge/route.ts', common);
  docs.set('academyClubChallenges/current', { active: true, challengeId: 'c1', allowedTypes: ['video', 'image', 'audio'], closesAt: new Stamp(Date.now() + 100000) });
  const student = id => docs.set('students/' + id, { academyClubMembership: { active: true } });
  const request = (id, data) => ({ headers: { get: () => id ? 'Bearer ' + id : null }, json: async () => data });
  const post = (id, extra = {}) => upload.POST(request(id, { challengeId: 'c1', size: 1024, contentType: 'video/mp4', ...extra }));
  return { docs, student, post, submit: (id, data) => submit.POST(request(id, data)), metrics: () => ({ signatures, heads }) };
}
test('unauthorized, nonmembers, invalid types and oversized files never reserve storage', async () => {
  const f = fixture();
  assert.equal((await f.post('')).status, 401);
  assert.equal((await f.post('missing')).status, 400);
  f.student('s1');
  assert.equal((await f.post('s1', { size: 21 * 1024 * 1024 })).status, 400);
  assert.equal((await f.post('s1', { contentType: 'audio/webm' })).status, 400);
  f.docs.get('students/s1').academyClubMembership.active = false;
  assert.equal((await f.post('s1')).status, 403);
  assert.equal(f.docs.has('r2VideoUsage/storage'), false);
});
test('retries reuse one object and reserve bytes once; daily attempts are bounded', async () => {
  const f = fixture(); f.student('s1');
  const first = await f.post('s1'); assert.equal(first.status, 200);
  assert.equal((await f.post('s1')).data.key, first.data.key);
  assert.equal((await f.post('s1')).data.key, first.data.key);
  assert.equal(f.docs.get('r2VideoUsage/storage').bytes, 1024);
  assert.equal((await f.post('s1')).status, 429);
});
test('concurrent requests cannot exceed the lifetime storage ceiling', async () => {
  const f = fixture(); f.student('s1'); f.student('s2');
  f.docs.set('r2VideoUsage/storage', { bytes: 8 * 1024 ** 3 - 1024 });
  const results = await Promise.all([f.post('s1'), f.post('s2')]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 429]);
  assert.equal(f.docs.get('r2VideoUsage/storage').bytes, 8 * 1024 ** 3);
});
test('submission requires its own reservation; playback permits owner and teacher only', async () => {
  const f = fixture(); f.student('s1'); f.student('s2');
  const key = (await f.post('s1')).data.key;
  assert.equal((await f.submit('s2', { challengeId: 'c1', workType: 'video', r2Key: key })).status, 400);
  assert.equal(f.metrics().heads, 0);
  assert.equal((await f.submit('s1', { challengeId: 'c1', workType: 'video', r2Key: key })).status, 200);
  assert.equal(f.docs.get('academyClubChallengeSubmissions/c1_s1').fileUrl, '');
  assert.equal((await f.post('s1')).status, 400);
  assert.equal((await f.post('s2', { action: 'play', submissionId: 'c1_s1' })).status, 403);
  assert.equal((await f.post('teacher', { action: 'play', submissionId: 'c1_s1' })).status, 200);
  assert.equal((await f.post('s1', { action: 'play', submissionId: 'c1_s1' })).status, 200);
});
test('images and audio remain accepted without an R2 reservation', async () => {
  for (const workType of ['image', 'audio']) {
    const f = fixture(); f.student('s1');
    assert.equal((await f.submit('s1', { challengeId: 'c1', workType, fileUrl: 'https://res.cloudinary.com/old' })).status, 200);
    assert.equal(f.metrics().heads, 0);
  }
});
test('SDK signs both size and content type, uses private endpoint and short expiry', async () => {
  const previous = { ...process.env };
  Object.assign(process.env, { R2_ACCOUNT_ID: 'testaccount', R2_BUCKET_NAME: 'testbucket', R2_ACCESS_KEY_ID: 'testkey', R2_SECRET_ACCESS_KEY: 'testsecret' });
  try {
    const r2 = load('app/lib/r2Video.ts', { 'server-only': {} });
    const url = new URL(await r2.videoUploadUrl('club/test.mp4', 1024, 'video/mp4'));
    assert.equal(url.hostname, 'testaccount.r2.cloudflarestorage.com');
    assert.equal(url.pathname, '/testbucket/club/test.mp4');
    assert.equal(url.searchParams.get('X-Amz-Expires'), '300');
    assert.match(url.searchParams.get('X-Amz-SignedHeaders'), /content-length/);
    assert.match(url.searchParams.get('X-Amz-SignedHeaders'), /content-type/);
    assert(!url.href.includes('testsecret'));
  } finally { process.env = previous; }
});
