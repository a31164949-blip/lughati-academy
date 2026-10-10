const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const effects = [], updates = [], listeners = {};
let snapshot, denied, index = 0;
const user = { getIdTokenResult: async () => ({ claims: { role: 'student', studentDocId: 'own' }, token: 'token' }) };
const initial = [true, user, null, true, false, 0, false, ''];
const mocks = {
  react: { useState: () => { const slot = index++; return [initial[slot], value => updates.push([slot, value])]; }, useEffect: fn => effects.push(fn) },
  'react/jsx-runtime': { jsx: () => ({}), jsxs: () => ({}), Fragment: 'fragment' },
  'firebase/auth': { onAuthStateChanged: () => () => {}, signOut: async () => {} },
  'firebase/firestore': { doc: () => ({}), onSnapshot: (_, next, error) => { snapshot = next; denied = error; return () => {}; } },
  'next/navigation': { usePathname: () => '/teacher/quizzes' },
  'next/link': { default: () => ({}) },
  '../../firebase': { auth: {}, db: {} },
};
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync('app/components/StudentAccessGate.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
vm.runInNewContext(source, { exports: exportsObject, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, document: { visibilityState: 'visible', addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener() {} }, window: { addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener() {} }, fetch: async () => ({ ok: true, json: async () => ({ accountSuspended: false, extrasSuspended: false }) }), console });
(async () => {
  exportsObject.default({ children: 'form with selected file' });
  const cleanup = effects[1]();
  await Promise.resolve();
  snapshot({ data: () => ({ accessControl: { mode: 'resume' } }) });
  listeners.focus(); listeners.visibilitychange();
  assert.equal(updates.some(([slot, value]) => slot === 3 && value === false), false, 'file-picker return must not unmount forms');
  effects[3]();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(updates.some(([slot, value]) => slot === 3 && value === false), false, 'background check must preserve forms');
  snapshot({ data: () => ({ accessControl: { mode: 'account' } }) });
  assert.ok(updates.some(([slot, value]) => slot === 3 && value === false), 'changed freeze decision must block during verification');
  updates.length = 0;
  denied();
  assert.ok(updates.some(([slot, value]) => slot === 3 && value === false), 'permission revocation must block during verification');
  cleanup();
  console.log('File-picker focus preserves forms; freeze changes and permission revocation still block.');
})().catch(error => { console.error(error); process.exitCode = 1; });
