const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spendingSummary, answerSpending } = require("./summary.ts");
const { transactionPresentation } = require("../transactionPresentation.ts");
const tx = (id, amount, date, category = "Food", type = "expense") => ({ id, title: id, amount, date, category, type });
const now = new Date(2026, 8, 22, 12);

test("month totals use recorded expenses and income, excluding future and invalid records", () => {
  const data = spendingSummary([
    tx("food", 10.10, "2026-09-01"), tx("ride", 20.20, "2026-09-22T10:00:00", "Transport"),
    tx("income", 100, "2026-09-22", "Income", "income"), tx("future", 999, "2026-09-23"),
    tx("bad-date", 999, "invalid"), tx("bad-money", NaN, "2026-09-03"), tx("negative", -5, "2026-09-01"),
  ], "month", now);
  assert.equal(data.spent, 3030);
  assert.equal(data.income, 10000);
  assert.equal(data.selected.length, 3);
  assert.equal(data.top.name, "Transport");
  assert.equal(data.buckets.reduce((sum, b) => sum + b.amount, 0), data.spent);
  assert.equal(data.buckets.reduce((sum, b) => sum + b.count, 0), 2);
});

test("weekly comparison starts Monday and compares equal day counts across year boundaries", () => {
  const data = spendingSummary([tx("current", 20, "2025-12-29"), tx("before", 40, "2025-12-28"), tx("after", 10, "2026-01-03")], "week", new Date(2026, 0, 2));
  assert.equal(data.days, 5);
  assert.equal(data.spent, 2000);
  assert.equal(data.previousSpent, 4000);
  assert.equal(data.change, -50);
});

test("custom ranges include both boundaries and support single days and reversed dates", () => {
  const records = [tx("a", .10, "2026-02-28"), tx("b", .20, "2026-03-01"), tx("c", 50, "2026-03-02")];
  const data = spendingSummary(records, "custom", now, new Date(2026, 2, 1), new Date(2026, 1, 28));
  assert.equal(data.days, 2);
  assert.equal(data.spent, 30);
  const single = spendingSummary(records, "custom", now, new Date(2026, 2, 1));
  assert.equal(single.spent, 20);
  assert.equal(single.days, 1);
  assert.equal(single.buckets.reduce((sum, b) => sum + b.amount, 0), 20);
});

test("no data and no comparison avoid invented improvement percentages or non-finite charts", () => {
  const data = spendingSummary([], "month", now);
  assert.equal(data.change, null);
  assert.equal(data.spent, 0);
  assert.ok(!/NaN|Infinity/.test(data.path));
  assert.match(answerSpending("Where did most of my money go?", data).summary, /No transactions/);
  assert.match(answerSpending("Can I afford ₦400?", data, 200).summary, /exceeds/);
});

test("answers use the selected period and parse the requested savings amount", () => {
  const data = spendingSummary([tx("food", 1000, "2026-09-01"), tx("transport", 200, "2026-09-21", "Transport")], "month", now);
  assert.match(answerSpending("Where did most of my money go?", data).summary, /Food/);
  assert.match(answerSpending("How can I save ₦80,000?", data).summary, /20,000/);
  assert.match(answerSpending("Can I afford ₦500?", data, 600).summary, /fits within/);
  assert.match(answerSpending("Why did I spend more?", data).summary, /no spending in the comparison/);
});

test("receipt details keep recorded methods and do not invent account numbers", () => {
  const deposit = transactionPresentation({ ...tx("deposit", 25, "2026-09-22", "Income", "income"), title: "Deposit via card", method: "Visa", methodDetail: "Card ending 1234" }, false);
  assert.equal(deposit.title, "Visa");
  assert.equal(deposit.subtitle, "Card ending 1234");
  const withdrawal = transactionPresentation({ ...tx("withdraw", 25, "2026-09-22"), title: "Withdraw to Access Bank" }, true);
  assert.equal(withdrawal.title, "Access Bank");
  assert.ok(!/4821|4910|8237|8912/.test(withdrawal.subtitle));
});
