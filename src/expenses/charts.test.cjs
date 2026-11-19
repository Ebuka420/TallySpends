const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { expenseChartData, expenseReportData, expenseDonutSlices } = require('./charts.ts');
const tx = (date, amount, category = 'Food', type = 'expense') => ({ date: `${date}T12:00:00`, amount, category, type });
const sum = values => values.reduce((a, b) => a + b, 0);

test('unconfirmed or failed feeds never display cached expense amounts as current totals', () => {
  const cached = [tx('2026-11-01', 1200000)];
  const date = new Date(2026, 10, 15);
  for (const state of ['idle', 'loading', 'error']) {
    assert.equal(expenseReportData(cached, state, date, 'month'), null);
    assert.equal(expenseReportData([], state, date, 'month'), null, 'unavailable is distinct from a real zero');
  }
  const empty = expenseReportData([], 'ready', date, 'month');
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.transactions, []);
  assert.deepEqual(empty.categories, []);
  assert.ok(empty.points.every(point => point.value === 0 && point.count === 0));
  assert.equal(expenseReportData(cached, 'ready', date, 'month').total, 1200000, 'confirmed records must not be arbitrarily changed to zero');
});

test('all representations reconcile to the selected month, excluding income and other periods', () => {
  const rows = [tx('2026-11-01', 100), tx('2026-11-07', 200), tx('2026-11-08', '300', 'Transport'),
    tx('2026-11-30', 400, 'Bills'), tx('2026-10-10', 900), tx('2025-11-10', 1000), tx('2026-11-04', 5000, 'Food', 'income')];
  const data = expenseChartData(rows, new Date(2026, 10, 15), 'month');
  assert.equal(data.total, 1000);
  assert.deepEqual(data.points.map(p => p.value), [300, 300, 0, 0, 400]);
  assert.deepEqual(data.points.map(p => p.count), [2, 1, 0, 0, 1]);
  assert.equal(sum(data.categories.map(c => c[1])), data.total);
  assert.equal(sum(data.points.map(p => p.value)), data.total);
  assert.equal(sum(data.points.map(p => p.count)), data.transactions.length);
  assert.equal(rows[0].date, '2026-11-01T12:00:00', 'source is not reordered');
});
test('month buckets use actual month length, including leap day', () => {
  const ordinary = expenseChartData([], new Date(2026, 1, 1), 'month');
  assert.equal(ordinary.points.length, 4);
  assert.equal(ordinary.points.at(-1).range, 'Days 22–28');
  const leap = expenseChartData([tx('2024-02-29', 75)], new Date(2024, 1, 1), 'month');
  assert.equal(leap.points.length, 5);
  assert.equal(leap.points[4].value, 75);
  assert.equal(leap.points[4].range, 'Days 29–29');
});
test('year view assigns each month correctly and excludes other years', () => {
  const data = expenseChartData([tx('2026-01-01', 25), tx('2026-12-31', 75), tx('2025-12-31', 900)], new Date(2026, 10, 15), 'year');
  assert.equal(data.points.length, 12);
  assert.equal(data.points[0].label, 'Jan');
  assert.equal(data.points[11].label, 'Dec');
  assert.equal(data.points[0].value, 25);
  assert.equal(data.points[11].value, 75);
  assert.equal(data.total, 100);
});
test('invalid values never distort totals; missing categories are named honestly', () => {
  const rows = [tx('2026-11-01', -1), tx('2026-11-01', Infinity), tx('2026-11-01', 'bad'), tx('2026-11-01', null),
    tx('2026-11-01', ''), tx('2026-11-01', true), { date: 'invalid', amount: 100, type: 'expense' },
    tx('2026-11-01', 0), tx('2026-11-01', 20, ' ')];
  const data = expenseChartData(rows, new Date(2026, 10, 1), 'month');
  assert.equal(data.total, 20);
  assert.equal(data.transactions.length, 2);
  assert.deepEqual(data.categories, [['Uncategorized', 20], ['Food', 0]]);
});
test('donut includes every positive category even when small categories are grouped', () => {
  const categories = Array.from({ length: 9 }, (_, i) => [`Category ${i}`, 90 - i * 10]);
  const slices = expenseDonutSlices(categories);
  assert.equal(slices.length, 6);
  assert.equal(slices[5].label, 'Remaining 4 categories');
  assert.equal(sum(slices.map(s => s.value)), sum(categories.map(c => c[1])));
  assert.ok(Math.abs(sum(slices.map(s => s.share)) - 1) < 1e-10);
  assert.ok(Math.abs(slices.at(-1).offset + slices.at(-1).share - 1) < 1e-10);
});
test('empty, zero-only and single-category donuts have no fabricated segments', () => {
  assert.deepEqual(expenseDonutSlices([]), []);
  assert.deepEqual(expenseDonutSlices([['Food', 0]]), []);
  assert.deepEqual(expenseDonutSlices([['Food', 100]]), [{ label: 'Food', value: 100, share: 1, offset: 0 }]);
});
