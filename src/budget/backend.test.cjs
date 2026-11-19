const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const ledger = require('./ledger.ts');
const loaded = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('./backend.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  module: loaded, exports: loaded.exports, require(name) {
    if (name === './ledger') return ledger;
    if (name === '../transactions/manual') return { manualCategories: ['Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Other'] };
    throw new Error(name);
  },
});
const { fetchPlanning, savePlan, saveBudget } = loaded.exports;
const response = async path => {
  if (path === '/api/budgets/current/status') return { status: 404, data: null };
  if (path === '/api/savings-goals' || path === '/api/ajo/groups/my') return { status: 200, data: [] };
  if (path === '/api/wallet/balance') return { status: 200, data: { currency: 'NGN', balance: 0, balanceKobo: 0 } };
  throw new Error(path);
};
test('planning loads documented endpoints and preserves a real zero balance', async () => {
  const wallet = await fetchPlanning(response, 'user', 'tag');
  assert.equal(wallet.userId, 'user'); assert.equal(wallet.openingBalance, 0); assert.equal(wallet.savings.length, 0);
  assert.equal(ledger.totals(wallet).available, 0);
  await assert.rejects(fetchPlanning(async path => path === '/api/wallet/balance' ? { status: 200, data: {} } : response(path), 'user', 'tag'), /invalid/);
  await assert.rejects(fetchPlanning(async () => ({ status: 503, data: null }), 'user', 'tag'), /503/);
});
test('saving contributions uses backend naira units without mutating local wallet funds', async () => {
  const wallet = await fetchPlanning(response, 'user', 'tag');
  const calls = [];
  await savePlan(async (path, init) => { calls.push({ path, method: init.method, body: JSON.parse(init.body) }); return { status: 204, data: null }; }, wallet, { type: 'save', id: '7', amount: 1234 });
  assert.equal(calls[0].path, '/api/savings-goals/7/contribute');
  assert.equal(calls[0].method, 'PUT'); assert.equal(calls[0].body.amount, 12.34);
  assert.equal(wallet.openingBalance, 0);
});
test('budget creation uses the returned ID for category requests', async () => {
  const wallet = await fetchPlanning(response, 'user', 'tag'), calls = [];
  await saveBudget(async (path, init) => { calls.push({ path, body: JSON.parse(init.body) }); return { status: path === '/api/budgets' ? 201 : 204, data: path === '/api/budgets' ? 9 : null }; }, wallet, { type: 'allocate', allocations: [{ name: 'Food', category: 'Food & Dining', amount: 1234 }] });
  assert.equal(calls[0].body.totalAmount, 12.34);
  assert.equal(calls[1].path, '/api/budgets/9/categories/1'); assert.equal(calls[1].body.limitAmount, 12.34);
});
