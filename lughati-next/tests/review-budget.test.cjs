const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function review(view, docs) {
  const source = fs.readFileSync('app/teacher/submissions/page.tsx', 'utf8');
  const callback = source.slice(source.indexOf('  useCallback(async (after?'), source.indexOf('const loadSubmissions'));
  let issued;
  const module = { exports: {} };
  const code = ts.transpileModule('module.exports = ' + callback.trim(), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    module, view, db: {}, PENDING_STATUS: 'pending', APPROVED_STATUS: 'approved', REJECTED_STATUS: 'rejected',
    useCallback: fn => fn, collection: (_, name) => name,
    where: (...args) => ({ where: args }), orderBy: (...args) => ({ orderBy: args }),
    limit: value => ({ limit: value }), startAfter: doc => ({ cursor: doc.id }),
    query: (...args) => args,
    getDocs: async q => { issued = q; return { docs, size: docs.length }; }
  });
  return { fetch: module.exports, query: () => JSON.parse(JSON.stringify(issued)) };
}
const documents = n => Array.from({ length: n }, (_, i) => ({ id: String(i), data: () => ({ status: 'pending', createdAt: null }) }));

test('review defaults to pending only, reads at most 25 and preserves snapshot cursor', async () => {
  const docs = documents(25), fixture = review('pending', docs);
  const result = await fixture.fetch();
  assert.deepEqual(fixture.query(), ['studentWorks', { where: ['status', '==', 'pending'] }, { limit: 25 }]);
  assert.equal(result.cursor, docs[24]);
  assert.equal(result.hasMore, true);
  assert.equal(result.items.length, 25);
});
test('archive pages keep newest-first order and continue after the last document', async () => {
  const fixture = review('archive', documents(3));
  const result = await fixture.fetch({ id: 'last-page' });
  assert.deepEqual(fixture.query(), ['studentWorks', { orderBy: ['createdAt', 'desc'] }, { cursor: 'last-page' }, { limit: 25 }]);
  assert.equal(result.hasMore, false);
});
test('empty review ends pagination without a cursor', async () => {
  const result = await review('pending', []).fetch();
  assert.equal(result.cursor, null);
  assert.equal(result.hasMore, false);
});
