const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const ts = require('typescript');
const { values, storage } = require('../testStorage.cjs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { amountKobo, decodeBalance, decodeLedger, walletApi } = require('./api.ts');
const { preparePayment, loadPayment, submitPayment } = require('./payments.ts');
const draft = { kind: 'user', paymentId: 'TSP-4K7Q-9XBM', amountKobo: 100000, note: 'Test payment' };
const bank = { kind: 'bank', bankCode: '000', accountNumber: '0123456789', amountKobo: 100000, narration: 'Test transfer' };
const completed = { reference: 'p2p-test-reference', status: 'Completed', recipientName: 'Example User', amountKobo: 100000 };
beforeEach(() => values.clear());
test('naira input converts to exact kobo and rejects invalid amounts', () => {
  assert.equal(amountKobo('1000'), 100000); assert.equal(amountKobo('0.29'), 29);
  for (const value of ['0', '-1', '1e3', '1.001', '1000000.01', 'NaN', ' 10']) assert.throws(() => amountKobo(value));
  assert.deepEqual(decodeBalance({ balanceKobo: 12550, balance: 125.5, currency: 'NGN' }), { balanceKobo: 12550, currency: 'NGN' });
  assert.throws(() => decodeBalance({ balanceKobo: 12550, balance: 12550, currency: 'NGN' }));
});
test('wallet history uses signed naira and preserves pending/reversed status', () => {
  const item = { id: 1, amount: -1000, entryType: 'Debit', status: 'Pending', source: 'Transfer', description: null, createdAt: '2026-11-15T10:00:00Z' };
  assert.equal(decodeLedger([item])[0].amount, -1000);
  assert.equal(decodeLedger([{ ...item, status: 'Reversed' }])[0].status, 'Reversed');
  assert.throws(() => decodeLedger([{ ...item, amount: 1000 }])); assert.throws(() => decodeLedger([item, item]));
});
test('P2P posts the verified payment ID, integer amount and persisted idempotency key', async () => {
  const p = await preparePayment('id:1', draft, 'uuid-test-1'); let requests = 0;
  const result = await submitPayment('id:1', p, async (path, init) => {
    requests++; assert.equal(path, '/api/wallet/send'); assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { paymentId: draft.paymentId, amountKobo: 100000, note: 'Test payment', idempotencyKey: 'uuid-test-1' });
    assert.equal((await loadPayment('id:1')).state, 'unknown');
    return { status: 200, data: completed };
  });
  assert.equal(result.state, 'Completed');
  await submitPayment('id:1', p, async () => assert.fail('terminal payment sent again'));
  assert.equal(requests, 1);
});
test('network uncertainty survives reload and retry reuses the original key and body', async () => {
  const p = await preparePayment('id:1', draft, 'original-key'); const bodies = [];
  const unknown = await submitPayment('id:1', p, async (_, init) => { bodies.push(init.body); throw new Error('Connection lost after server received payment'); });
  assert.equal(unknown.state, 'unknown');
  const persisted = await loadPayment('id:1');
  await assert.rejects(preparePayment('id:1', { ...draft, amountKobo: 200000 }, 'different-key'), /previous payment/);
  assert.equal((await preparePayment('id:1', draft, 'new-key')).key, 'original-key');
  const result = await submitPayment('id:1', persisted, async (_, init) => { bodies.push(init.body); return { status: 200, data: completed }; });
  assert.equal(result.state, 'Completed'); assert.equal(bodies[0], bodies[1]);
});
test('bank 202 stays pending and status checks never POST again', async () => {
  const p = await preparePayment('id:1', bank, 'bank-test-key');
  const pending = await submitPayment('id:1', p, async (path, init) => {
    assert.equal(path, '/api/wallet/transfer'); assert.equal(JSON.parse(init.body).amountKobo, 100000);
    return { status: 202, data: { ...completed, status: 'Pending', recipientName: null } };
  });
  assert.equal(pending.state, 'Pending');
  const done = await submitPayment('id:1', pending, async (path, init) => { assert.equal(path, '/api/wallet/transfer/bank-test-key'); assert.equal(init, undefined); return { status: 200, data: completed }; }, true);
  assert.equal(done.state, 'Completed');
});
test('failed bank transfer and insufficient funds are terminal without claiming success', async () => {
  let p = await preparePayment('id:1', bank, 'bank-test-key');
  assert.equal((await submitPayment('id:1', p, async () => ({ status: 502, data: { ...completed, status: 'Failed' } }))).state, 'Failed');
  p = await preparePayment('id:1', draft, 'user-test-key');
  assert.equal((await submitPayment('id:1', p, async () => ({ status: 400, data: { reference: null, status: 'InsufficientFunds', recipientName: null } }))).state, 'Rejected');
});
test('concurrent submissions and storage failure cannot dispatch duplicate payments', async () => {
  const p = await preparePayment('id:1', draft, 'uuid-test-key'); let release; const wait = new Promise(resolve => release = resolve); let posts = 0;
  const first = submitPayment('id:1', p, async () => { posts++; await wait; return { status: 200, data: completed }; });
  await assert.rejects(submitPayment('id:1', p, async () => assert.fail()), /already in progress/); release(); await first; assert.equal(posts, 1);
  const original = storage.setItem; storage.setItem = async () => { throw new Error('disk unavailable'); };
  try { await assert.rejects(preparePayment('id:2', draft, 'another-key'), /disk unavailable/); } finally { storage.setItem = original; }
  assert.equal(await loadPayment('id:2'), null);
});
test('accounts and unresolved payment records are isolated', async () => {
  await preparePayment('id:1', draft, 'first-owner-key'); assert.equal(await loadPayment('id:2'), null);
  const p = await preparePayment('id:2', bank, 'second-owner-key'); assert.equal(p.key, 'second-owner-key');
  assert.equal((await loadPayment('id:1')).key, 'first-owner-key');
});
test('virtual account 404 is empty; creation is explicit and malformed payment responses remain uncertain', async () => {
  assert.equal(await walletApi.account(async () => ({ status: 404, data: null })), null);
  assert.equal((await walletApi.account(async (_, init) => { assert.equal(init.method, 'POST'); return { status: 200, data: { accountNumber: '0123456789', accountName: 'Example User', bankName: 'Sandbox Bank', status: 'ACTIVE' } }; }, true)).accountNumber, '0123456789');
  const p = await preparePayment('id:1', draft, 'test-key-1');
  assert.equal((await submitPayment('id:1', p, async () => ({ status: 200, data: { ...completed, amountKobo: 1 } }))).state, 'unknown');
});
