const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  applyBudgetCommand: run,
  createWallet,
  totals,
  minor,
  upsertTransaction: tx,
  removeTransaction,
  budgetPayments,
} = require("./ledger.ts");
const now = "2026-09-19T12:00:00.000Z";
const allocation = (name, amount, extra = {}) => ({
  name,
  category: name,
  amount,
  startDate: "2026-09-01",
  ...extra,
});
const fund = (wallet, allocations, id = "fund") =>
  run(wallet, { type: "allocate", allocations }, id, now);
const expense = (extra = {}) => ({
  id: "expense",
  title: "Lunch",
  type: "expense",
  amount: 75,
  category: "Food & Dining",
  date: "2026-09-19",
  ...extra,
});
const setup = () =>
  fund(createWallet([]), [
    allocation("Food", 100000),
    allocation("Transport", 50000),
  ]);

test("archiving a bucket releases remaining money, preserves spent money and history", () => {
  let wallet = tx(setup(), expense());
  const available = totals(wallet).available;
  const budget = wallet.budgets[0];
  const spent = budget.spentAmount;
  const remaining = budget.remainingAmount;
  wallet = run(
    wallet,
    { type: "archive", budgetId: budget.id },
    "archive",
    now,
  );
  assert.equal(totals(wallet).available, available + remaining);
  assert.equal(wallet.budgets[0].remainingAmount, 0);
  assert.equal(wallet.budgets[0].allocatedAmount, spent);
  assert.equal(wallet.budgets[0].status, "archived");
  assert.ok(wallet.activity.some((a) => a.kind === "spend"));
  assert.throws(
    () =>
      run(
        wallet,
        { type: "add", budgetId: budget.id, amount: 100 },
        "add",
        now,
      ),
    /Restore/,
  );
});
test("archived expense reversals return money to available, not a hidden bucket", () => {
  let wallet = tx(setup(), expense());
  wallet = run(
    wallet,
    { type: "archive", budgetId: wallet.budgets[0].id },
    "archive",
    now,
  );
  const available = totals(wallet).available;
  wallet = removeTransaction(wallet, "expense", now);
  assert.equal(totals(wallet).available, available + 7500);
  assert.equal(wallet.budgets[0].remainingAmount, 0);
  assert.equal(wallet.budgets[0].spentAmount, 0);
  assert.equal(wallet.budgets[0].allocatedAmount, 0);
});
test("restore is unfunded, rename preserves identity, and new funding works", () => {
  let wallet = setup();
  const id = wallet.budgets[0].id;
  wallet = run(wallet, { type: "archive", budgetId: id }, "archive", now);
  wallet = run(wallet, { type: "restore", budgetId: id }, "restore", now);
  assert.equal(wallet.budgets[0].remainingAmount, 0);
  wallet = run(
    wallet,
    { type: "rename", budgetId: id, name: "Lunch money" },
    "rename",
    now,
  );
  wallet = run(wallet, { type: "add", budgetId: id, amount: 1000 }, "add", now);
  assert.equal(wallet.budgets[0].id, id);
  assert.equal(wallet.budgets[0].name, "Lunch money");
  assert.equal(wallet.budgets[0].remainingAmount, 1000);
  assert.throws(
    () =>
      run(wallet, { type: "rename", budgetId: id, name: "   " }, "bad", now),
    /name/,
  );
});
test("exhausted buckets cannot overspend, but can be topped up or archived", () => {
  let wallet = fund(createWallet([]), [allocation("Food", 7500)]);
  wallet = tx(wallet, expense({ budgetId: "fund-0" }));
  assert.equal(wallet.budgets[0].remainingAmount, 0);
  assert.throws(
    () => tx(wallet, expense({ id: "second", budgetId: "fund-0" })),
    /enough money/,
  );
  const available = totals(wallet).available;
  const archived = run(
    wallet,
    { type: "archive", budgetId: "fund-0" },
    "archive",
    now,
  );
  assert.equal(totals(archived).available, available);
  wallet = run(
    wallet,
    { type: "add", budgetId: "fund-0", amount: 1000 },
    "add",
    now,
  );
  assert.equal(wallet.budgets[0].remainingAmount, 1000);
});

test("amounts parse exactly to integer kobo and reject invalid input", () => {
  assert.equal(minor("0.29"), 29);
  assert.equal(minor("50000.01"), 5000001);
  for (const input of [
    "0",
    "-2",
    "NaN",
    "Infinity",
    "1e4",
    "1.234",
    "12abc",
    "",
    "9007199254740991",
  ])
    assert.throws(() => minor(input));
});
test("allocating reserves existing money, with no expense or invented cash", () => {
  const wallet = setup();
  assert.deepEqual(totals(wallet), {
    balance: 292678,
    allocated: 150000,
    remaining: 150000,
    available: 142678,
  });
  assert.equal(wallet.transactions.length, 0);
  assert.equal(wallet.activity.length, 2);
});
test("allocation fails atomically if the full plan exceeds available balance", () => {
  const wallet = createWallet([]);
  assert.throws(
    () =>
      fund(wallet, [
        allocation("Food", 200000),
        allocation("Transport", 200000),
      ]),
    /Insufficient/,
  );
  assert.equal(wallet.budgets.length, 0);
  assert.equal(wallet.activity.length, 0);
});
test("funding retries are idempotent", () => {
  const wallet = setup();
  assert.equal(fund(wallet, [allocation("Food", 100000)], "fund"), wallet);
});
test("adding money decreases available money by the same amount", () => {
  const next = run(
    setup(),
    { type: "add", budgetId: "fund-0", amount: 25000 },
    "add",
    now,
  );
  assert.equal(next.budgets[0].remainingAmount, 125000);
  assert.equal(totals(next).available, 117678);
});
test("transfers conserve money and write both sides of the activity", () => {
  const before = setup();
  const next = run(
    before,
    {
      type: "move",
      budgetId: "fund-0",
      destinationId: "fund-1",
      amount: 25000,
    },
    "move",
    now,
  );
  assert.equal(next.budgets[0].remainingAmount, 75000);
  assert.equal(next.budgets[1].remainingAmount, 75000);
  assert.deepEqual(totals(next), totals(before));
  assert.deepEqual(
    next.activity.slice(-2).map((a) => a.kind),
    ["move-out", "move-in"],
  );
});
test("releasing money returns it immediately to unallocated balance", () => {
  const next = run(
    setup(),
    { type: "release", budgetId: "fund-0", amount: 40000 },
    "release",
    now,
  );
  assert.equal(next.budgets[0].remainingAmount, 60000);
  assert.equal(totals(next).available, 182678);
});
test("reject overspending, oversize releases, transfers, negative and fractional kobo", () => {
  const before = setup();
  for (const type of ["release", "move", "add"])
    for (const amount of [999999, -1, 0, 1.2, Infinity])
      assert.throws(() =>
        run(
          before,
          { type, amount, budgetId: "fund-0", destinationId: "fund-1" },
          `${type}${amount}`,
          now,
        ),
      );
  assert.throws(() =>
    run(
      before,
      {
        type: "move",
        amount: 100,
        budgetId: "fund-0",
        destinationId: "fund-0",
      },
      "same",
      now,
    ),
  );
  assert.throws(
    () => tx(before, expense({ budgetId: "fund-0", amount: 1001 }), now),
    /enough money/,
  );
});
test("automatically matches an expense to its category once", () => {
  const first = tx(setup(), expense(), now);
  const second = tx(first, expense(), now);
  assert.equal(first.budgets[0].remainingAmount, 92500);
  assert.equal(first.budgets[0].spentAmount, 7500);
  assert.equal(totals(first).available, totals(setup()).available);
  assert.equal(second, first);
});
test("a confirmed payment and subsequent bank feed echo deduct only once", () => {
  const first = tx(
    setup(),
    expense({ budgetId: "fund-0", paymentReference: "provider-123" }),
    now,
  );
  const echo = tx(
    first,
    expense({ id: "bank-feed-7", paymentReference: "provider-123" }),
    now,
  );
  assert.equal(echo, first);
  assert.equal(echo.transactions.length, 1);
  assert.throws(
    () =>
      tx(
        first,
        expense({
          id: "conflict",
          amount: 76,
          paymentReference: "provider-123",
        }),
        now,
      ),
    /conflicts/,
  );
});
test("editing and deleting expenses reverse prior deductions with an audit trail", () => {
  const first = tx(setup(), expense(), now);
  const edited = tx(first, expense({ amount: 100 }), now);
  assert.equal(edited.budgets[0].spentAmount, 10000);
  assert.equal(edited.budgets[0].remainingAmount, 90000);
  const removed = removeTransaction(edited, "expense", now);
  assert.equal(removed.budgets[0].remainingAmount, 100000);
  assert.equal(removed.budgets[0].spentAmount, 0);
  assert.equal(removed.activity.filter((a) => a.kind === "reversal").length, 2);
});
test("changing category moves a deduction to the appropriate budget", () => {
  const next = tx(
    tx(setup(), expense(), now),
    expense({ category: "Transport" }),
    now,
  );
  assert.equal(next.budgets[0].spentAmount, 0);
  assert.equal(next.budgets[1].spentAmount, 7500);
});
test("income increases available money without spending from any bucket", () => {
  const next = tx(setup(), expense({ type: "income", amount: 1000 }), now);
  assert.equal(totals(next).available, 242678);
  assert.equal(next.budgets[0].spentAmount, 0);
});
test("expired and future budgets do not auto-deduct outside their dates", () => {
  const future = fund(createWallet([]), [
    allocation("Food", 50000, { startDate: "2026-10-01" }),
  ]);
  assert.equal(tx(future, expense(), now).budgets[0].spentAmount, 0);
  const ended = fund(createWallet([]), [
    allocation("Food", 50000, { endDate: "2026-09-20" }),
  ]);
  assert.equal(
    tx(ended, expense({ date: "2026-09-21" }), now).budgets[0].spentAmount,
    0,
  );
});
test("ambiguous category matches and low budget balances need review, never go negative", () => {
  const ambiguous = fund(setup(), [allocation("Food", 10000)], "second");
  const next = tx(ambiguous, expense(), now);
  assert.equal(next.budgets[0].spentAmount, 0);
  assert.match(next.review.expense, /more than one/);
  const low = tx(setup(), expense({ amount: 1001 }), now);
  assert.equal(low.budgets[0].remainingAmount, 100000);
  assert.match(low.review.expense, /too low/);
});
test("unallocated expenses cannot spend reserved funds or create a negative wallet", () => {
  assert.throws(
    () => tx(setup(), expense({ category: "Other", amount: 2000 }), now),
    /Release money/,
  );
});
test("invalid dates and unknown budget IDs reject without changing funds", () => {
  assert.throws(
    () =>
      fund(createWallet([]), [
        allocation("Food", 100, { startDate: "2026-02-30" }),
      ]),
    /valid date/,
  );
  assert.throws(
    () =>
      fund(createWallet([]), [
        allocation("Food", 100, { endDate: "2026-08-01" }),
      ]),
    /valid date/,
  );
  assert.throws(
    () => tx(setup(), expense({ budgetId: "missing" }), now),
    /Choose a budget/,
  );
});
test("payments remain unavailable and do not pretend to move real money", async () => {
  assert.equal(budgetPayments.available, false);
  await assert.rejects(
    budgetPayments.pay("fund-0", 100, "recipient"),
    /not connected/,
  );
});
