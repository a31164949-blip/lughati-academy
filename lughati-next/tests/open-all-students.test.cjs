const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const opening = require('../app/lib/academyOpening.json');
const { patchOpeningRules } = require('../scripts/deploy-temporary-access-rules.cjs');
function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, Date });
  return exports;
}
const windowPolicy = load('app/lib/resultsViewingWindow.ts', { './academyOpening.json': opening });

test('all-student access stays open without extending the historic results window', () => {
  assert.equal(opening.openToAllStudents, true);
  for (const date of ['2026-11-07T08:00:00+03:00', '2026-11-08T00:00:00+03:00', '2027-01-01T00:00:00+03:00']) {
    assert.equal(windowPolicy.isTemporaryAcademyOpen(Date.parse(date)), true);
    assert.equal(windowPolicy.isResultsViewingOpen(Date.parse(date)), false);
  }
  const availability = load('app/lib/academyAvailability.ts', { './academyOpening.json': opening });
  assert.equal(availability.STUDENT_ACADEMY_PAUSED, false);
});
test('unaccepted and suspended students can use services without activity scans or document writes', async () => {
  const access = load('app/lib/studentAccess.ts', {
    'server-only': {}, './resultsViewingWindow': windowPolicy,
    'next/cache': {}, '../../firebase-admin': { getFirebaseAdmin: () => { throw Error('Unexpected database access'); } },
    './studentAccessPolicy': {}, './academyAvailability': {},
  });
  for (const mode of ['account', 'extras', undefined]) {
    const result = await access.studentAccess('existing-student', { accessControl: { mode }, academyAdmission: { status: 'waiting' } });
    assert.equal(result.accountSuspended, false);
    assert.equal(result.extrasSuspended, false);
  }
});
test('live rules patch is idempotent, reversible, and preserves all ownership and teacher checks', () => {
  const current = fs.readFileSync('firestore.rules', 'utf8');
  const restricted = patchOpeningRules(current, false);
  const opened = patchOpeningRules(restricted, true);
  assert.equal(opened, current);
  assert.equal(patchOpeningRules(opened, true), opened);
  assert.equal(patchOpeningRules(opened, false), restricted);
  const strip = s => s.replace(/^    function temporaryAcademyOpen\(\) \{[^{}]*\}/m, 'OPENING_POLICY');
  assert.equal(strip(restricted), strip(opened));
  assert.match(opened, /request\.auth != null/);
  assert.match(opened, /request\.auth\.token\.role == "student"/);
  assert.match(opened, /allow write: if isTeacher\(\);/);
  assert.throws(() => patchOpeningRules(current.replace('return true;', 'return false;'), true), /refusing overwrite/);
});
