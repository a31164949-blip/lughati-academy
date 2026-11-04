const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function fixture(name, initiallyOpen = false) {
  let open = initiallyOpen, index = 0;
  const effects = [], updates = [], listeners = {};
  const academy = name === 'AcademyAvailabilityGate';
  const initial = academy ? ['teacher', initiallyOpen, 0, false, '']
    : [initiallyOpen, true, {}, null, true, false, 0, false, ''];
  const mocks = {
    react: {
      useRef: value => ({ current: value }),
      useState: () => { const slot = index++; return [initial[slot], value => updates.push([slot, value])]; },
      useEffect: effect => effects.push(effect),
    },
    'react/jsx-runtime': { jsx: () => ({}), jsxs: () => ({}), Fragment: 'fragment' },
    'firebase/auth': {}, 'firebase/firestore': {},
    'next/navigation': { usePathname: () => '/teacher/homeworks' },
    'next/link': {}, '../../firebase': {},
    '../lib/resultsViewingWindow': { isTemporaryAcademyOpen: () => open, RESULTS_VIEW_END: 0 },
    '../lib/academyAvailability': { STUDENT_ACADEMY_PAUSED: true },
    '../lib/academyFriends': {},
    './AcademyStudentAccessContext': { AcademyStudentAccessContext: { Provider: {} } },
    './AcademyContinuationCard': {}, './AcademyWelcome': {}, './NationalIdentity': {}, './HeartMessages': {},
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(`app/components/${name}.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports, require: key => { assert.ok(key in mocks, key); return mocks[key]; },
    window: { addEventListener: (key, fn) => { listeners[key] = fn; }, removeEventListener() {}, setTimeout: () => 1, clearTimeout() {} },
    document: { addEventListener: (key, fn) => { listeners[key] = fn; }, removeEventListener() {} },
  });
  exports.default({ children: 'unsaved homework and selected attachment' });
  const cleanup = effects[0]();
  return { updates, listeners, cleanup, expire: () => { open = false; } };
}

for (const name of ['AcademyAvailabilityGate', 'StudentAccessGate']) {
  const retrySlot = name === 'AcademyAvailabilityGate' ? 2 : 6;
  test(`${name}: returning from picker after window ended does not reset form`, () => {
    const f = fixture(name);
    f.listeners.visibilitychange(); f.listeners.focus();
    assert.ok(f.updates.every(([slot]) => slot === (name === 'AcademyAvailabilityGate' ? 1 : 0)),
      'initial check and picker return must only synchronize the temporary-window flag');
    assert.equal(f.updates.some(([slot]) => slot === retrySlot), false);
    f.cleanup();
  });
  test(`${name}: actual window expiry still rechecks access once`, () => {
    const f = fixture(name, true);
    f.expire(); f.listeners.focus(); f.listeners.visibilitychange();
    assert.equal(f.updates.filter(([slot]) => slot === retrySlot).length, 1);
    if (name === 'StudentAccessGate') assert.ok(f.updates.some(([slot, value]) => slot === 4 && value === false));
    f.cleanup();
  });
}
