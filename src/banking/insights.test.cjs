const { test } = require('node:test');
const assert = require('node:assert/strict');
const { accountInsights, accountMoney, selectLinkedAccount } = require('./insights.ts');
const now = new Date(2026, 10, 12, 12);
const account = extra => ({ id: 'a', bankName: 'Bank A', accountName: 'Account owner', currency: 'NGN', ...extra });
const tx = (id, extra = {}) => ({ id, title: 'Purchase', amount: 10, type: 'expense', date: '2026-11-10', category: 'Food', ...extra });

test('unavailable activity differs from a confirmed empty period', () => {
  const missing = accountInsights(account({}), 'month', now);
  assert.equal(missing.available, false);
  assert.equal(missing.outgoing, undefined);
  const empty = accountInsights(account({ transactions: [] }), 'month', now);
  assert.equal(empty.available, true);
  assert.equal(empty.outgoing, 0);
  assert.equal(empty.count, 0);
});
test('insights use only this account and sum minor units exactly', () => {
  const result = accountInsights(account({ transactions: [tx('a', { amount: .1 }), tx('b', { amount: .2 }), tx('c', { amount: 2, type: 'income' })] }), 'month', now);
  assert.equal(result.outgoing, .3);
  assert.equal(result.incoming, 2);
  assert.equal(result.net, 1.7);
  assert.equal(result.categories[0].amount, .3);
  assert.equal(result.categories[0].share, 1);
});
test('bad, future and duplicate records cannot inflate totals', () => {
  const result = accountInsights(account({ transactions: [tx('a'), tx('a'), tx('bad', { amount: -1 }),
    tx('fraction', { amount: .001 }), tx('date', { date: '2026-11-31' }), tx('future', { date: '2026-11-13' }),
    tx('transfer', { type: 'unknown' }), tx('nan', { amount: NaN }), tx('yesterday', { date: 'yesterday' })] }), 'month', now);
  assert.equal(result.count, 1);
  assert.equal(result.outgoing, 10);
  assert.equal(result.skipped, 7);
});
test('month and last 30 calendar days have independent inclusive boundaries', () => {
  const source = account({ transactions: [tx('older', { date: '2026-10-13' }), tx('boundary', { date: '2026-10-14' }),
    tx('month', { date: '2026-11-01' }), tx('today', { date: '2026-11-12' })] });
  assert.equal(accountInsights(source, 'month', now).count, 2);
  assert.equal(accountInsights(source, '30days', now).count, 3);
});
test('category rankings, largest outgoing and recent records describe supplied data', () => {
  const result = accountInsights(account({ transactions: [tx('food'), tx('rent', { amount: 100, category: 'Rent', date: '2026-11-11' }),
    tx('misc', { amount: 5, category: '' })] }), 'month', now);
  assert.equal(result.categories[0].name, 'Rent');
  assert.equal(result.categories[2].name, 'Uncategorised');
  assert.equal(result.largest.id, 'rent');
  assert.equal(result.records[0].id, 'rent');
});
test('unknown currency and unsafe sums suppress money summaries', () => {
  const missing = accountInsights(account({ currency: undefined, transactions: [tx('a')] }), 'month', now);
  assert.equal(missing.count, 1);
  assert.equal(missing.outgoing, undefined);
  const unsafe = accountInsights(account({ transactions: [tx('a', { amount: 80000000000000 }), tx('b', { amount: 80000000000000 })] }), 'month', now);
  assert.equal(unsafe.totalsAvailable, false);
  assert.equal(accountMoney(0), 'Unavailable');
  assert.equal(accountMoney(NaN, 'NGN'), 'Unavailable');
  assert.match(accountMoney(0, 'NGN'), /0\.00/);
  assert.match(accountMoney(20, 'USD'), /20\.00/);
});
test('selection follows a deep-linked account and falls back after removal', () => {
  const records = [account({}), account({ id: 'b', currency: 'USD' })];
  assert.equal(selectLinkedAccount(records, 'b').id, 'b');
  assert.equal(selectLinkedAccount(records, 'removed').id, 'a');
  assert.equal(selectLinkedAccount([], 'a'), null);
});
