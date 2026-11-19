const test = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'); const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { createManualTransaction, confirmManualTransaction, manualPayload, ManualSaveError } = require('./manual.ts');
const draft = { amount: 1250.50, categoryId: 1, paymentMethodId: 2, transactionType: 'Expense', description: 'Synthetic expense', date: '2026-11-15T10:00:00Z', isRecurring: false };
const dto = (id, type) => ({ id, amount: draft.amount, currency: 'NGN', transactionType: type, categoryName: 'Food & Dining', vendorName: null, paymentMethodName: 'Cash', description: 'Synthetic fixture', isRecurring: false, source: 'Manual', transactionDate: draft.date });
test('manual income and expense send exact contract payloads and confirm in GET transactions', async () => {
  for (const type of ['Income', 'Expense']) {
    const calls = [];
    const result = await createManualTransaction({ ...draft, transactionType: type }, async (path, init) => {
      calls.push({ path, init }); assert.equal(path, '/api/transactions');
      if (init) { assert.equal(init.method, 'POST'); assert.deepEqual(JSON.parse(init.body), { accountId: 0, categoryId: 1, vendorId: null, paymentMethodId: 2, amount: 1250.5, transactionType: type, description: 'Synthetic expense', transactionDate: '2026-11-15T10:00:00.000Z', isRecurring: false }); return { status: 201, data: 57 }; }
      return { status: 200, data: [dto(57, type)] };
    });
    assert.equal(result.type, type.toLowerCase()); assert.equal(result.id, '57'); assert.equal(calls.length, 2);
  }
});
test('unknown POST results are never automatically replayed', async () => {
  let calls = 0;
  await assert.rejects(createManualTransaction(draft, async () => { calls++; throw new Error('network lost'); }), e => e instanceof ManualSaveError && e.uncertain && e.createdId === null);
  assert.equal(calls, 1);
});
test('readback failure preserves the created ID so recovery only reads history', async () => {
  let id;
  await assert.rejects(createManualTransaction(draft, async (_, init) => init ? { status: 201, data: 57 } : { status: 200, data: [] }), e => { id = e.createdId; return e.uncertain; });
  await confirmManualTransaction(id, async (_, init) => { assert.equal(init, undefined); return { status: 200, data: [dto(57, 'Expense')] }; });
});
test('invalid category/method IDs and fractional kobo are rejected before POST', () => {
  for (const invalid of [{ categoryId: 7 }, { paymentMethodId: 0 }, { amount: 0 }, { amount: 1.001 }, { transactionType: 'income' }]) assert.throws(() => manualPayload({ ...draft, ...invalid }));
});
