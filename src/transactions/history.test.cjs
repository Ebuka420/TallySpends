const { test } = require("node:test");
const assert = require("node:assert/strict");
const { defaultHistoryFilters, filterHistory, historyTotals, historySections, validateHistoryFilters } = require("./history.ts");
const { completeTransaction, getCompletedTransaction, subscribeCompletedTransaction, clearCompletedTransaction } = require("../transactionCompletion.ts");
const now = new Date(2026, 8, 23, 12);
const tx = (id, amount, date, type = "expense", extras = {}) => ({ id, amount, date, type, title: id, category: "Food", ...extras });
const filters = (patch = {}) => ({ ...defaultHistoryFilters(now), ...patch });
const rows = [
  tx("salary", 10000, "2026-09-01", "income", { category: "Income" }),
  tx("deposit", 5000, "2026-09-23", "income", { title: "Deposit via card", category: "Income" }),
  tx("transfer", 200, "2026-09-22", "expense", { title: "Transfer to @ada", category: "Transfer", recipientName: "Ada Smith", memo: "Lunch" }),
  tx("withdrawal", 1000, "2026-09-23", "expense", { title: "Withdraw to GTBank", category: "Withdrawal" }),
  tx("food", 150.25, "2026-09-17T23:45:00", "expense", { memo: "Lunch at home" }),
  tx("old", 30, "2025-09-23"),
];

test("type filters distinguish incoming funds, deposits, transfers and withdrawals", () => {
  assert.equal(filterHistory(rows, filters({ type: "income" }), "", now).length, 2);
  for (const type of ["transfer", "deposit", "withdrawal"]) assert.deepEqual(filterHistory(rows, filters({ type }), "", now).map(t => t.id), [type]);
  assert.equal(filterHistory(rows, filters({ type: "expense" }), "", now).length, 4);
});
test("search combines names, notes, amounts and references with other filters", () => {
  assert.deepEqual(filterHistory(rows, filters(), "ada lunch", now).map(t => t.id), ["transfer"]);
  assert.deepEqual(filterHistory(rows, filters({ type: "deposit" }), "₦5,000", now).map(t => t.id), ["deposit"]);
  assert.deepEqual(filterHistory(rows, filters({ type: "deposit" }), "₦5,000.00", now).map(t => t.id), ["deposit"]);
  assert.deepEqual(filterHistory(rows, filters(), "₦150.25", now).map(t => t.id), ["food"]);
  assert.equal(filterHistory(rows, filters({ category: "Food" }), "ada", now).length, 0);
});
test("date ranges include both local-day boundaries and last seven days", () => {
  assert.equal(filterHistory(rows, filters({ range: "today" }), "", now).length, 2);
  assert.equal(filterHistory(rows, filters({ range: "week" }), "", now).length, 4);
  assert.equal(filterHistory(rows, filters({ range: "month" }), "", now).length, 5);
  assert.equal(filterHistory(rows, filters({ range: "custom", from: "2026-09-17", to: "2026-09-22" }), "", now).length, 2);
});
test("amount boundaries are inclusive and invalid filters cannot silently show results", () => {
  assert.deepEqual(filterHistory(rows, filters({ minimum: "150.25", maximum: "200" }), "", now).map(t => t.id), ["transfer", "food"]);
  for (const patch of [{ minimum: "200", maximum: "10" }, { minimum: "1e3" }, { range: "custom", from: "2026-09-31", to: "2026-10-01" }, { range: "custom", from: "2026-09-24", to: "2026-09-23" }]) {
    assert.ok(validateHistoryFilters(filters(patch)));
    assert.equal(filterHistory(rows, filters(patch), "", now).length, 0);
  }
});
test("sorting preserves source data and amount order is not undone by date grouping", () => {
  const original = [...rows];
  const largest = filterHistory(rows, filters({ sort: "largest" }), "", now);
  assert.deepEqual(largest.map(t => t.amount), [10000, 5000, 1000, 200, 150.25, 30]);
  assert.equal(historySections(largest, "largest", now).length, 1);
  assert.equal(filterHistory(rows, filters({ sort: "oldest" }), "", now)[0].id, "old");
  assert.deepEqual(rows, original);
});
test("date groups and totals use only filtered results with exact decimal arithmetic", () => {
  const selected = filterHistory(rows, filters({ range: "week" }), "", now);
  assert.deepEqual(historySections(selected, "newest", now).map(section => section.title).slice(0, 2), ["Today", "Yesterday"]);
  assert.deepEqual(historyTotals(selected), { income: 500000, expense: 135025 });
  assert.deepEqual(historySections([], "newest", now), []);
  assert.deepEqual(historyTotals([]), { income: 0, expense: 0 });
});
test("successful completion publishes the receipt then returns home; dismissal clears it", () => {
  clearCompletedTransaction();
  const events = [];
  const unsubscribe = subscribeCompletedTransaction(() => events.push(getCompletedTransaction()));
  const destinations = [];
  completeTransaction({ dismissTo: route => destinations.push(route) }, "saved-tx");
  assert.deepEqual(events, ["saved-tx"]);
  assert.deepEqual(destinations, ["/(tabs)"]);
  clearCompletedTransaction();
  assert.equal(getCompletedTransaction(), null);
  unsubscribe();
  clearCompletedTransaction();
  assert.deepEqual(events, ["saved-tx", null]);
});
