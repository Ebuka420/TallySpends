const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require('../testStorage.cjs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { carouselMetrics, cardIndexAtOffset, retainedSelection, OVERVIEW_ID } = require('./carousel.ts');
const { decodeBankAccounts } = require('./backend.ts');

for (const screen of [320, 375, 390, 430, 768]) {
  const { width, stride, inset, trailingInset } = carouselMetrics(screen);
  const peek = screen - inset - stride;
  assert.ok(peek > 0 && peek < screen * 0.07, 'The next card remains visible');
  for (const count of [1, 2, 3, 8]) {
    const contentWidth = inset + count * width + (count - 1) * 10 + trailingInset;
    const maximumOffset = Math.max(0, contentWidth - screen);
    assert.ok(Math.abs(maximumOffset - (count - 1) * stride) < 0.00001, 'The last card must reach the same aligned position as the first');
    for (let index = 0; index < count; index++) assert.equal(cardIndexAtOffset(index * stride, stride, count), index, 'Every card is reachable moving forward');
    for (let index = count - 1; index >= 0; index--) assert.equal(cardIndexAtOffset(index * stride, stride, count), index, 'Every card is reachable moving backward');
    assert.equal(cardIndexAtOffset(-50, stride, count), 0, 'Overscroll cannot select a negative index');
    assert.equal(cardIndexAtOffset(maximumOffset + screen, stride, count), count - 1);
  }
  assert.equal(cardIndexAtOffset(stride * 0.49, stride, 3), 0);
  assert.equal(cardIndexAtOffset(stride * 0.51, stride, 3), 1);
}
assert.equal(cardIndexAtOffset(NaN, 365, 2), 0);
assert.equal(cardIndexAtOffset(100, 365, 0), 0);
assert.equal(cardIndexAtOffset(100, 0, 2), 0);
const accounts = [{ id: 'account-a' }, { id: 'account-b' }];
assert.equal(retainedSelection('account-b', accounts.reverse()), 'account-b');
assert.equal(retainedSelection('account-b', [{ id: 'account-a' }]), OVERVIEW_ID);
assert.equal(retainedSelection(OVERVIEW_ID, []), OVERVIEW_ID);
const record = { id: 1, name: 'Test Bank', type: 'Bank', currency: 'NGN', status: 'Linked', lastSyncedAt: null, balance: 0 };
const parsed = decodeBankAccounts([record, { ...record, id: 2, balance: null }, { ...record, id: 3, status: 'Disconnected', balance: 100 }]);
assert.equal(parsed[0].availableBalance, 0);
assert.equal(parsed[1].availableBalance, undefined);
assert.equal(parsed[2].availableBalance, undefined);
assert.equal(parsed[1].transactions, undefined);
console.log('Dashboard checks passed: all cards reachable in both directions, first/last alignment, responsive peeking, selection retention and backend-only balances.');
