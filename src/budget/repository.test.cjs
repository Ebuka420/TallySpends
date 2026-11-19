const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { totals, minor } = require('./ledger.ts');
const empty = owner => ({ version: 1, userId: owner, openingBalance: 0, transactions: [], budgets: [], savings: [], circles: [], activity: [], operations: [], deductions: {}, review: {}, backend: { budgetId: null, period: '2026-11', totalAmount: 0, totalSpent: 0, remaining: 0 } });
function harness(overrides = {}) {
  let owner = 'user-a';
  const calls = [];
  const backend = {
    fetchPlanning: async (_request, scope) => { calls.push(['load', scope]); return empty(scope); },
    saveBudget: async () => { calls.push(['budget']); },
    savePlan: async () => { calls.push(['plan']); return '7'; },
    joinAjo: async () => { calls.push(['join']); }, ...overrides,
  };
  const compiled = ts.transpileModule(fs.readFileSync(require.resolve('./repository.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports, require(name) {
    if (name === './backend') return backend;
    if (name === '../profile/repository') return { getProfileSnapshot: () => ({ scope: owner, profile: { tallyTag: 'tester' } }) };
    if (name === '../authenticated') return { authenticated: async (work, expected = owner) => { assert.equal(expected, owner); return work(async () => { throw new Error('Unexpected request'); }); } };
    if (name === '../transactions/manual') return { createManualTransaction: async () => ({ id: '1' }), manualCategories: ['Food & Dining'], manualMethods: ['Cash'] };
    throw new Error('Unexpected dependency: ' + name);
  } });
  const repo = loaded.exports; repo.setWalletOwner(owner);
  return { repo, calls, setOwner(next) { owner = next; repo.setWalletOwner(next); } };
}
const command = { type: 'allocate', allocations: [{ name: 'Food', category: 'Food & Dining', amount: 10000, startDate: '2026-11-01' }] };
test('planning loads only server data, never legacy transactions or opening funds', async () => {
  const h = harness(), wallet = await h.repo.loadWallet([{ id: 'demo', amount: 9999 }]);
  assert.equal(wallet.openingBalance, 0); assert.equal(wallet.transactions.length, 0); assert.equal(wallet.budgets.length, 0);
  assert.equal(totals(wallet).available, 0);
  assert.throws(() => totals({ ...wallet, backend: undefined }), /server balance/);
  assert.equal(minor('12.34'), 1234);
});
test('concurrent reads share one backend request and mutations refresh before publishing', async () => {
  const h = harness();
  await Promise.all([h.repo.loadWallet(), h.repo.loadWallet()]);
  assert.equal(h.calls.length, 1);
  await h.repo.runBudgetCommand(command, 'save-1');
  assert.deepEqual(h.calls.map(c => c[0]), ['load', 'budget', 'load']);
  await h.repo.runBudgetCommand(command, 'save-1');
  assert.equal(h.calls.length, 3);
});
test('unknown mutation results are not replayed as a second contribution', async () => {
  let sends = 0;
  const h = harness({ savePlan: async () => { sends++; throw new Error('Connection lost'); } });
  await h.repo.loadWallet();
  await assert.rejects(h.repo.runPlanCommand({ type: 'save', id: '7', amount: 100 }, 'contribution'), /Connection lost/);
  await assert.rejects(h.repo.runPlanCommand({ type: 'save', id: '7', amount: 100 }, 'contribution'), /already have reached/);
  assert.equal(sends, 1);
});
test('a successful save followed by failed readback never reports a fresh failure to retry', async () => {
  let loads = 0, saves = 0;
  const h = harness({ fetchPlanning: async (_r, owner) => { if (loads++) throw new Error('Offline'); return empty(owner); }, saveBudget: async () => { saves++; } });
  await h.repo.loadWallet();
  await assert.rejects(h.repo.runBudgetCommand(command, 'save'), /Saved on the server/);
  await assert.rejects(h.repo.runBudgetCommand(command, 'save'), /already have reached/);
  assert.equal(saves, 1);
});
test('switching accounts clears the snapshot and prevents old responses from publishing', async () => {
  let release, started;
  const entered = new Promise(resolve => { started = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const h = harness({ fetchPlanning: async (_r, owner) => { if (owner === 'user-a') { started(); await gate; } return empty(owner); } });
  const old = h.repo.loadWallet();
  const rejected = assert.rejects(old, /account changed/);
  await entered; h.setOwner('user-b'); assert.equal(h.repo.getWalletSnapshot(), null);
  const next = h.repo.loadWallet(); release(); await rejected;
  assert.equal((await next).userId, 'user-b');
  h.setOwner(null); assert.equal(h.repo.getWalletSnapshot(), null);
  await assert.rejects(h.repo.loadWallet(), /Sign in/);
});
test('a failed initial request leaves no synthetic empty successful wallet', async () => {
  const h = harness({ fetchPlanning: async () => { throw new Error('Service unavailable'); } });
  await assert.rejects(h.repo.loadWallet(), /Service unavailable/);
  assert.equal(h.repo.getWalletSnapshot(), null);
});
