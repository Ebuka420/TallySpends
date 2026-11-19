const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { decodeAnalytics, fetchAnalytics, refreshBackendAnalytics } = require('./api.ts');
const { dashboardReport, dashboardRhythm } = require('./dashboard.ts');
const { reportText } = require('./report.ts');
const sample = () => ({
  analyticsSummaryId: 1, periodType: 'Monthly', periodStart: '2026-11-01', periodEnd: '2026-11-30', currency: 'NGN',
  financialHealth: { score: 0, status: null, recommendation: null },
  totals: { totalIncome: 0, totalExpenses: 0, totalSavings: 0, incomeChangePercent: 0, expenseChangePercent: 0, savingsChangePercent: 0 },
  trendPoints: [], categorySummaries: [], heatMap: [], insights: [],
});
test('an empty account preserves server zeros without invented activity', () => {
  const data = decodeAnalytics(sample());
  assert.equal(data.financialHealth.score, 0);
  assert.equal(data.financialHealth.status, '');
  const report = dashboardReport(data, 'monthly');
  assert.equal(report.spent, 0); assert.equal(report.count, 0);
  assert.deepEqual(report.chart, []); assert.deepEqual(dashboardRhythm(data).cells, []);
});
test('invalid or missing financial data cannot silently become zero', () => {
  for (const value of [null, {}, { ...sample(), totals: {} }, { ...sample(), currency: 'USD' }, { ...sample(), trendPoints: [{}] }, { ...sample(), heatMap: [{}] }, { ...sample(), periodStart: '2026-02-30' }]) assert.throws(() => decodeAnalytics(value));
  for (const invalid of [undefined, null, NaN, Infinity, '100', -1]) {
    const value = sample(); value.totals.totalIncome = invalid;
    assert.throws(() => decodeAnalytics(value));
  }
});
test('load and refresh send the selected period and anchor, rejecting wrong periods and API errors', async () => {
  const calls = [];
  const request = async (path, init) => { calls.push({ path, init }); return { status: 200, data: path === '/api/transactions' ? [] : sample() }; };
  const anchor = '2026-11-01T12:00:00Z';
  await fetchAnalytics(request, 2, anchor); await refreshBackendAnalytics(request, 2, anchor);
  const analyticsCalls = calls.filter(call => call.path !== '/api/transactions');
  for (const call of analyticsCalls) {
    const url = new URL(call.path, 'https://example.invalid');
    assert.equal(url.searchParams.get('anchorDate'), anchor); assert.equal(url.searchParams.get('periodType'), '2');
  }
  assert.equal(analyticsCalls[1].init.method, 'POST');
  await assert.rejects(fetchAnalytics(request, 1, anchor), /different period/);
  await assert.rejects(fetchAnalytics(request, 2, '2026-10-01T12:00:00Z'), /different period/);
  await assert.rejects(fetchAnalytics(async () => ({ status: 503, data: sample() })), /503/);
});

test('sandbox-contaminated backend summaries cannot appear in analytics or exports', async () => {
  const bankRow = { id: 1, amount: 1226465.92, currency: 'NGN', transactionType: 'Expense', categoryName: 'Other', vendorName: null, paymentMethodName: null, description: null, isRecurring: false, source: 'BankSync', transactionDate: '2026-11-01T12:00:00Z' };
  for (const load of [fetchAnalytics, refreshBackendAnalytics]) {
    const calls = [];
    await assert.rejects(load(async path => {
      calls.push(path);
      return { status: 200, data: [bankRow] };
    }), /sandbox bank activity/);
    assert.deepEqual(calls, ['/api/transactions']);
    const value = await load(async path => ({ status: 200, data: path === '/api/transactions' ? [{ ...bankRow, source: 'Manual' }] : sample() }));
    assert.equal(value.totals.totalExpenses, 0);
  }
});
test('screen, export and rhythm use backend amounts, dates and expense counts consistently', () => {
  const value = sample();
  value.totals.totalExpenses = 12.34; value.totals.totalIncome = 20;
  value.categorySummaries = [{ categoryId: 1, categoryName: 'Food', icon: null, colorHex: null, totalSpent: 12.34, transactionCount: 2, percentageOfExpenses: 100, changePercent: -10 }];
  value.trendPoints = [{ pointDate: '2026-11-02', income: 20, expenses: 12.34, savings: 0 }];
  value.heatMap = [{ dayOfWeek: 1, hourOfDay: 13, totalSpent: 12.34, transactionCount: 2, intensity: 4 }];
  const data = decodeAnalytics(value), report = dashboardReport(data, 'monthly');
  assert.equal(report.spent, 1234); assert.equal(report.net, 766); assert.equal(report.chart[0].amount, 1234);
  assert.equal(report.countKind, 'expense'); assert.equal(report.expenseCount, 2);
  assert.match(reportText(report), /2 recorded expenses/);
  const rhythm = dashboardRhythm(data);
  assert.equal(rhythm.cells[13].count, 2); assert.equal(rhythm.cells[13].intensity, 4);
});
