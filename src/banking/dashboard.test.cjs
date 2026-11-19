const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { dashboardBankAccounts, dashboardActivity, dashboardInsightCards } = require('./dashboard.ts');
const { retainedSelection, OVERVIEW_ID } = require('./carousel.ts');
const now = new Date('2026-11-15T14:00:00Z');
const zenith = { id: '12', bankName: 'Zenith Bank', status: 'Linked', currency: 'NGN', availableBalance: 1000 };
const wallet = [
  { id: '1', amount: 5000, entryType: 'Credit', status: 'Posted', source: 'Anchor', description: 'Test deposit', createdAt: '2026-11-15T12:00:00Z' },
  { id: '2', amount: -300, entryType: 'Debit', status: 'Posted', source: 'P2P', description: 'Test payment', createdAt: '2026-11-15T13:00:00Z' },
  { id: '3', amount: -100, entryType: 'Debit', status: 'Pending', source: 'Transfer', description: 'Pending test', createdAt: '2026-11-15T13:05:00Z' },
  { id: '4', amount: -200, entryType: 'Debit', status: 'Reversed', source: 'Transfer', description: 'Returned test', createdAt: '2026-11-15T13:06:00Z' },
];
test('only explicitly Linked backend accounts produce bank cards', () => {
  const cards = dashboardBankAccounts([zenith, { id: '13', bankName: 'GTBank', status: 'Disconnected' }, { id: '14', bankName: 'PalmPay' }]);
  assert.deepEqual(cards, [zenith]);
  assert.equal(retainedSelection('13', cards), OVERVIEW_ID);
  assert.equal(retainedSelection('12', cards), '12');
  assert.deepEqual(dashboardBankAccounts([]), []);
});
test('a bank with missing activity never inherits wallet transactions or example insights', () => {
  const data = dashboardActivity(zenith, wallet, true);
  assert.equal(data.available, false); assert.deepEqual(data.records, []);
  const cards = dashboardInsightCards(data, now);
  assert.equal(cards.length, 1); assert.match(cards[0].text, /Zenith Bank.*unavailable/);
  assert.doesNotMatch(JSON.stringify(cards), /5,000|18%|96 away|Test deposit/);
});
test('switching between two verified banks keeps their records and stats separate', () => {
  const a = { ...zenith, transactions: [{ id: 'zenith-1', title: 'Zenith expense', amount: 70, type: 'expense', date: '2026-11-14T12:00:00Z', category: 'Food' }] };
  const b = { ...zenith, id: '20', bankName: 'Another Bank', transactions: [{ id: 'other-1', title: 'Other income', amount: 900, type: 'income', date: '2026-11-14T12:00:00Z', category: 'Income' }] };
  const first = dashboardActivity(a, wallet, true); const second = dashboardActivity(b, wallet, true);
  assert.deepEqual(first.records.map(item => item.id), ['zenith-1']);
  assert.deepEqual(second.records.map(item => item.id), ['other-1']);
  assert.match(dashboardInsightCards(first, now)[1].text, /70\.00/);
  assert.match(dashboardInsightCards(second, now)[0].text, /900\.00/);
  assert.doesNotMatch(JSON.stringify(dashboardInsightCards(second, now)), /70\.00|5,000/);
});
test('wallet cards use wallet ledger only; pending/reversed entries remain visible but are excluded from posted totals', () => {
  const data = dashboardActivity(undefined, wallet, true);
  assert.equal(data.name, 'TallySpends wallet'); assert.equal(data.records.length, 4);
  const cards = dashboardInsightCards(data, now);
  assert.match(cards[0].text, /5,000\.00/); assert.match(cards[1].text, /300\.00/);
  assert.match(cards[1].text, /latest 50/);
  assert.equal(data.records.find(item => item.id === '4').status, 'Reversed');
  assert.deepEqual(dashboardActivity(undefined, wallet, false).records, []);
});
test('confirmed empty activity is distinct from missing data and bank currencies are retained', () => {
  const empty = dashboardActivity({ ...zenith, transactions: [] }, wallet, true);
  assert.equal(empty.available, true); assert.equal(dashboardInsightCards(empty, now)[0].id, "no-activity");
  const disconnected = dashboardActivity({ ...zenith, status: 'Disconnected', transactions: [] }, wallet, true);
  assert.equal(disconnected.available, false);
  assert.equal(dashboardActivity({ ...zenith, currency: 'USD', transactions: [] }, wallet, true).currency, 'USD');
});
test('different backend account IDs are not silently merged just because the bank name is the same', () => {
  assert.equal(dashboardBankAccounts([zenith, { ...zenith, id: '99' }]).length, 2);
});
