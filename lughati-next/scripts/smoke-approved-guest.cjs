/**
 * Local-only guest admission smoke test.
 *
 * Requirements:
 * - Explicit RUN_GUEST_SMOKE_TEST=YES
 * - Firebase admin environment already loaded in the calling shell.
 * - Next.js build exists (.next/BUILD_ID).
 *
 * The script creates exactly one short-lived approved invitation document,
 * checks permitted guest reads, revokes the membership, confirms revocation,
 * and deletes the document in finally. It never creates student accounts,
 * uploads media, submits quiz scores, or edits Firestore security rules.
 * The Cloudflare test secret is used ONLY by the localhost Next.js child.
 */
const { randomUUID, randomBytes, createHash } = require('node:crypto');
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { initializeApp, cert, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const BASE = 'http://127.0.0.1:3110';
const TEST_SECRET = '1x0000000000000000000000000000000AA';
const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

async function main() {
  if (process.env.RUN_GUEST_SMOKE_TEST !== 'YES') throw Error('TEST_NOT_ENABLED');
  if (!existsSync('.next/BUILD_ID')) throw Error('TEST_BUILD_MISSING');
  if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) throw Error('FIREBASE_CONFIG_MISSING');
  if (!process.env.COMPETITION_GUEST_SESSION_SECRET || process.env.COMPETITION_GUEST_SESSION_SECRET.length < 32) throw Error('GUEST_SESSION_SECRET_MISSING');

  const account = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
  const app = initializeApp({ credential: cert(account) }, 'lughati-guest-smoke-' + Date.now());
  const db = getFirestore(app);
  const requestId = randomUUID();
  const invitationCode = randomBytes(24).toString('base64url');
  const requestRef = db.collection('externalGradeJoinRequests').doc(requestId);
  let created = false;
  let child;
  const assert = (condition, message) => { if (!condition) throw Error(message); };

  const http = async (path, options = {}) => {
    const result = await fetch(BASE + path, { ...options, signal: AbortSignal.timeout(9000) });
    const body = await result.json().catch(() => ({}));
    return { status: result.status, body };
  };

  try {
    // Never create data while another service occupies the fixed test port.
    const occupied = await fetch(BASE + '/', { signal: AbortSignal.timeout(1000) }).then(() => true).catch(() => false);
    assert(!occupied, 'TEST_PORT_3110_BUSY');

    child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', '3110'], {
      cwd: process.cwd(),
      env: { ...process.env, TURNSTILE_SECRET_KEY: TEST_SECRET, NODE_ENV: 'production' },
      stdio: 'ignore',
      detached: true,
    });

    let ready = false;
    for (let attempt = 0; attempt < 25; attempt++) {
      if (child.exitCode !== null) break;
      ready = await fetch(BASE + '/guest-competitions', { signal: AbortSignal.timeout(1000) })
        .then(res => res.status === 200).catch(() => false);
      if (ready) break;
      await new Promise(r => setTimeout(r, 500));
    }
    assert(ready, 'LOCAL_TEST_SERVER_NOT_READY');

    await requestRef.create({
      studentName: 'ضيف اختبار تقني',
      grade: 'الثالث الابتدائي',
      classroom: 'اختبار آلي',
      status: 'approved',
      membershipScope: 'competitions-only',
      inviteHash: createHash('sha256').update(invitationCode).digest('hex'),
      source: 'automated-local-smoke-test',
      visibility: 'teacher-only',
      createdAt: new Date(),
    });
    created = true;

    const login = await http('/api/competition-guest-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId, code: invitationCode, turnstileToken: DUMMY_TOKEN }),
    });
    assert(login.status === 200 && login.body.success && typeof login.body.token === 'string', 'APPROVED_LOGIN_FAILED_' + login.status);
    console.log('APPROVED_GUEST_LOGIN=PASS');

    const headers = { Authorization: 'Bearer guest.' + login.body.token };
    const worksheets = await http('/api/guest-worksheets', { headers });
    assert(worksheets.status === 200 && worksheets.body.success && Array.isArray(worksheets.body.worksheets), 'WORKSHEETS_ACCESS_FAILED_' + worksheets.status);
    console.log('APPROVED_GUEST_WORKSHEETS=PASS');

    const quiz = await http('/api/guest-competition', { headers });
    assert(quiz.status === 200 && quiz.body.success && Array.isArray(quiz.body.questions), 'QUIZ_ACCESS_FAILED_' + quiz.status);
    console.log('APPROVED_GUEST_QUIZ=PASS');

    const live = await http('/api/academy-club/live-game?code=000000', { headers });
    assert(live.status === 404, 'LIVE_GAME_GUEST_AUTH_OR_ROOM_RESPONSE_UNEXPECTED_' + live.status);
    console.log('APPROVED_GUEST_LIVE_GATE=PASS');

    await requestRef.update({ status: 'declined' });
    const revoked = await http('/api/guest-competition', { headers });
    assert(revoked.status === 403, 'REVOKED_GUEST_ACCESS_NOT_DENIED_' + revoked.status);
    console.log('REVOKED_GUEST_ACCESS=PASS');

    console.log('GUEST_SMOKE_TEST=PASS');
  } finally {
    if (created) {
      await requestRef.delete().then(() => console.log('TEMPORARY_TEST_MEMBERSHIP=DELETED'))
        .catch(() => { console.error('CLEANUP_FAILED: Manually inspect externalGradeJoinRequests/' + requestId); process.exitCode = 1; });
    }
    if (child) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already stopped */ }
    }
    await deleteApp(app);
  }
}

main().catch(error => {
  console.error('GUEST_SMOKE_TEST=FAIL', error instanceof Error ? error.message : 'UNKNOWN');
  process.exitCode = 1;
});
