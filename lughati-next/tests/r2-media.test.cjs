const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(path, mocks) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name), URL, Date, Promise, Error });
  return module.exports;
}
function fixture() {
  const docs = new Map([['students/student', { active: true }], ['students/other', { active: true }]]);
  let heads = 0, signed = 0, open = true;
  const snap = path => ({ exists: docs.has(path), data: () => docs.get(path) });
  const ref = path => ({ path, id: path.split('/').at(-1), get: async () => snap(path) });
  let lock = Promise.resolve();
  const db = {
    collection: name => ({ doc: id => ref(name + '/' + id), where: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }) }),
    runTransaction: fn => {
      const pending = lock.then(async () => {
        const writes = []; let writing = false;
        const tx = { get: async r => { assert(!writing); return snap(r.path); }, set: (r,d) => { writing = true; writes.push(() => docs.set(r.path,d)); }, create: (r,d) => { assert(!docs.has(r.path)); writing = true; writes.push(() => docs.set(r.path,d)); }, update: (r,d) => { writing = true; writes.push(() => docs.set(r.path,{...docs.get(r.path),...d})); } };
        const result = await fn(tx); writes.forEach(f => f()); return result;
      }); lock = pending.catch(() => {}); return pending;
    }
  };
  const admin = { getFirebaseAdmin: () => ({ adminDb: db, adminAuth: { verifyIdToken: async uid => ({ uid, role: uid === 'teacher' ? 'teacher' : 'student', studentDocId: uid }) } }) };
  const video = { MAX_VIDEO_BYTES: 20 * 1024 ** 2, VIDEO_TYPES: { 'video/mp4': 'mp4' }, videoUploadUrl: async () => 'https://r2/upload', verifyVideoObject: async () => { heads++; }, videoPlaybackUrl: async () => { signed++; return 'https://r2/play'; } };
  const helpers = load('app/lib/r2Media.ts', { 'server-only': {}, 'firebase-admin/firestore': { Timestamp: { now: () => ({}) } }, '../../firebase-admin': admin, './r2Video': video, './studentSubmissionWindow': { getStudentSubmissionWindow: () => ({ isOpen: open }) } });
  const route = load('app/api/media/video/route.ts', { 'next/server': { NextResponse: { json: (data,options) => ({ data, status: options?.status || 200 }) } }, '../../../../firebase-admin': admin, '../../../lib/r2Media': helpers, '../../../lib/r2Video': video });
  const request = (uid, purpose = 'works', id = '') => ({ url: `https://test/api?purpose=${purpose}&id=${id}`, headers: { get: () => uid ? `Bearer ${uid}` : null } });
  const body = { purpose: 'works', requestId: '12345678-1234-1234-1234-123456789abc', size: 1024, contentType: 'video/mp4' };
  return { docs, helpers, route, request, body, close: () => { open = false; }, metrics: () => ({ heads, signed }) };
}
test('authentication, submission hours, MIME and size are checked before reservation', async () => {
  const f = fixture();
  await assert.rejects(f.helpers.reserveMediaVideo(f.request(''), f.body), /UNAUTHORIZED/);
  await assert.rejects(f.helpers.reserveMediaVideo(f.request('student'), {...f.body, size: 21 * 1024 ** 2}), /INVALID_VIDEO/);
  await assert.rejects(f.helpers.reserveMediaVideo(f.request('student'), {...f.body, contentType: 'audio/webm'}), /INVALID_VIDEO/);
  f.close(); await assert.rejects(f.helpers.reserveMediaVideo(f.request('student'), f.body), /SUBMISSION_CLOSED/);
  assert.equal(f.docs.has('r2VideoUsage/storage'), false);
});
test('retry uses one object and charges bytes once; daily attempts are bounded', async () => {
  const f = fixture(), req = f.request('student');
  const a = await f.helpers.reserveMediaVideo(req,f.body), b = await f.helpers.reserveMediaVideo(req,f.body);
  assert.equal(a.reservationId,b.reservationId); assert.equal(f.docs.get('r2VideoUsage/storage').bytes,1024);
  await f.helpers.reserveMediaVideo(req,f.body);
  await assert.rejects(f.helpers.reserveMediaVideo(req,f.body), /DAILY_LIMIT/);
});
test('shared storage ceiling includes existing club bytes and blocks concurrent reservations', async () => {
  const f = fixture(); f.docs.set('r2VideoUsage/storage',{bytes:8 * 1024 ** 3 - 1024});
  const results = await Promise.allSettled(['student','other'].map(id => f.helpers.reserveMediaVideo(f.request(id), f.body)));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1); assert.equal(f.docs.get('r2VideoUsage/storage').bytes,8 * 1024 ** 3);
});
test('verification rejects another owner or purpose without contacting R2', async () => {
  const f = fixture(), a = await f.helpers.reserveMediaVideo(f.request('student'),f.body);
  await assert.rejects(f.helpers.verifyMediaVideo(f.request('other'),a.reservationId,'works'), /INVALID_VIDEO/);
  await assert.rejects(f.helpers.verifyMediaVideo(f.request('student'),a.reservationId,'stories'), /INVALID_VIDEO/);
  assert.equal(f.metrics().heads,0);
  await f.helpers.verifyMediaVideo(f.request('student'),a.reservationId,'works'); assert.equal(f.metrics().heads,1);
});
test('pending videos are owner/teacher only; public playback requires approval, publication and matching reservation', async () => {
  const f=fixture(), a=await f.helpers.reserveMediaVideo(f.request('student'),f.body);
  const reserve=f.docs.get('r2MediaReservations/'+a.reservationId);
  const work={studentId:'student',r2Key:reserve.key,status:'pending',published:false};
  f.docs.set('studentWorks/'+a.reservationId,work);
  assert.equal((await f.route.GET(f.request('', 'works',a.reservationId))).status,401);
  assert.equal((await f.route.GET(f.request('other','works',a.reservationId))).status,403);
  assert.equal((await f.route.GET(f.request('teacher','works',a.reservationId))).status,200);
  assert.equal((await f.route.GET(f.request('student','works',a.reservationId))).status,200);
  work.status='approved'; work.published=true;
  assert.equal((await f.route.GET(f.request('','works',a.reservationId))).status,200);
  work.r2Key='media/another-object.mp4';
  assert.equal((await f.route.GET(f.request('teacher','works',a.reservationId))).status,403);
});
test('expired or unapproved stories are not public; approved unexpired stories are public', async () => {
  const f=fixture(), a=await f.helpers.reserveMediaVideo(f.request('teacher'),{...f.body,purpose:'stories'});
  const reserve=f.docs.get('r2MediaReservations/'+a.reservationId);
  const story={studentId:'',r2Key:reserve.key,status:'approved',expiresAt:{toMillis:()=>Date.now()+60000}};
  f.docs.set('academyStories/'+a.reservationId,story);
  assert.equal((await f.route.GET(f.request('','stories',a.reservationId))).status,200);
  story.expiresAt={toMillis:()=>Date.now()-1};
  assert.equal((await f.route.GET(f.request('','stories',a.reservationId))).status,401);
  assert.equal((await f.route.GET(f.request('teacher','stories',a.reservationId))).status,200);
});
