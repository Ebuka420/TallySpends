const { test } = require("node:test");
const assert = require("node:assert/strict");
const { analyticsRange, analyticsReport, reportMoney, reportText } = require("./report.ts");
const now = new Date(2026, 8, 23, 12);
const tx = (id, amount, date, category = "Food", type = "expense") => ({ id, title: id, amount, date, category, type });

test("monthly reports include local-day boundaries and keep different years separate", () => {
  const range = analyticsRange("monthly", "Sep", now);
  const report = analyticsReport([tx("first", 10, "2026-09-01"), tx("last", 20, "2026-09-30T23:59:59"), tx("last-year", 1000, "2025-09-23"), tx("next-month", 1000, "2026-10-01")], range);
  assert.deepEqual(report.selected.map(row => row.id), ["first", "last"]);
  assert.equal(report.spent, 3000);
  assert.equal(range.label, "September 2026");
});
test("the final week includes month-end days without extending into another month", () => {
  const range = analyticsRange("weekly", "W5", now);
  assert.equal(range.start.getDate(), 29);
  assert.equal(range.end.getDate(), 30);
  const report = analyticsReport([tx("before", 50, "2026-09-28"), tx("end", 7.5, "2026-09-30")], range);
  assert.equal(report.chart.length, 2);
  assert.deepEqual(report.chart.map(point => point.amount), [0, 750]);
  const february = analyticsRange("monthly", "Feb", new Date(2024, 1, 12));
  assert.equal(february.end.getDate(), 29);
  assert.equal(analyticsReport([tx("leap-day", 5, "2024-02-29")], february).chart[4].amount, 500);
});
test("report totals use exact kobo and net flow is income minus spending", () => {
  const report = analyticsReport([tx("one", 0.1, "2026-09-02"), tx("two", 0.2, "2026-09-03"), tx("credit", 10.55, "2026-09-04", "Income", "income")], analyticsRange("monthly", "Sep", now));
  assert.equal(report.spent, 30);
  assert.equal(report.income, 1055);
  assert.equal(report.net, 1025);
  assert.equal(report.expenseCount, 2);
  assert.equal(reportMoney(report.net), "₦10.25");
  assert.equal(reportMoney(-123450), "−₦1,234.50");
});
test("category breakdown and chart preserve all spending, including smaller categories", () => {
  const rows = [100, 50, 25, 15, 10].map((amount, index) => tx(String(index), amount, `2026-09-${String(index * 7 + 1).padStart(2, "0")}`, `Category ${index}`));
  const report = analyticsReport(rows, analyticsRange("monthly", "Sep", now));
  assert.equal(report.breakdown.length, 4);
  assert.equal(report.breakdown[3].name, "Everything else");
  assert.equal(report.breakdown.reduce((sum, row) => sum + row.amount, 0), report.spent);
  assert.equal(report.chart.reduce((sum, row) => sum + row.amount, 0), report.spent);
  assert.equal(report.breakdown.reduce((sum, row) => sum + row.share, 0), 1);
  assert.match(report.takeaway, /Category 0 made up 50%/);
  assert.match(reportText(report), /Net flow: −₦200/);
  assert.doesNotMatch(reportText(report), /82|health score|saved/i);
});
test("yearly and empty reports avoid invented scores, activity and non-finite values", () => {
  const year = analyticsReport([tx("2025", 10, "2025-12-31"), tx("2026", 50, "2026-01-01")], analyticsRange("yearly", "2025", now));
  assert.equal(year.chart.length, 12);
  assert.equal(year.chart[11].amount, 1000);
  const empty = analyticsReport([tx("bad", NaN, "2026-09-01"), tx("bad-date", 20, "invalid"), tx("negative", -5, "2026-09-02")], analyticsRange("monthly", "Sep", now));
  assert.equal(empty.count, 0);
  assert.deepEqual(empty.breakdown, []);
  assert.ok(empty.chart.every(row => row.amount === 0));
  assert.match(empty.takeaway, /No transactions recorded/);
  assert.doesNotMatch(reportText(empty), /NaN|Infinity/);
});
