const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const ledger = require("./ledger.ts");

function harness(initial = {}) {
  const values = new Map(Object.entries(initial));
  let fail = false;
  const storage = {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      if (fail) throw new Error("Disk full");
      values.set(key, value);
    },
  };
  const output = ts.transpileModule(
    fs.readFileSync(require.resolve("./repository.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    exports: module.exports,
    module,
    require: (name) => (name === "./ledger" ? ledger : storage),
    console,
  });
  return {
    repo: module.exports,
    values,
    failWrites: (value) => {
      fail = value;
    },
  };
}
const command = (amount) => ({
  type: "allocate",
  allocations: [
    { name: "Food", category: "Food", amount, startDate: "2026-09-19" },
  ],
});

test("migration preserves legacy feed and does not fund old spending limits", async () => {
  const source = [
    {
      id: "salary",
      title: "Salary",
      amount: 1000,
      category: "Income",
      type: "income",
      date: "2026-09-19",
    },
  ];
  const h = harness({
    ts_txs: JSON.stringify(source),
    ts_bgts: '{"Food": 500}',
  });
  const result = await h.repo.loadWallet([]);
  assert.equal(result.transactions[0].id, "salary");
  assert.equal(result.budgets.length, 0);
  assert.equal(h.values.get("ts_txs"), JSON.stringify(source));
});
test("concurrent allocations cannot reserve the same money twice", async () => {
  const h = harness();
  await h.repo.loadWallet([]);
  const outcomes = await Promise.allSettled([
    h.repo.runBudgetCommand(command(200000), "a"),
    h.repo.runBudgetCommand(command(200000), "b"),
  ]);
  assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
  assert.equal(h.repo.getWalletSnapshot().budgets.length, 1);
});
test("failed storage write publishes no balances, and can be retried", async () => {
  const h = harness();
  const original = await h.repo.loadWallet([]);
  let notices = 0;
  h.repo.subscribeWallet(() => notices++);
  h.failWrites(true);
  await assert.rejects(
    h.repo.runBudgetCommand(command(10000), "a"),
    /Disk full/,
  );
  assert.equal(h.repo.getWalletSnapshot(), original);
  assert.equal(notices, 0);
  h.failWrites(false);
  await h.repo.runBudgetCommand(command(10000), "a");
  assert.equal(notices, 1);
  assert.equal(h.repo.getWalletSnapshot().budgets.length, 1);
});
test("restart restores allocations and transaction deductions together", async () => {
  const first = harness();
  await first.repo.loadWallet([]);
  await first.repo.runBudgetCommand(command(100000), "a");
  await first.repo.saveWalletTransaction({
    id: "lunch",
    title: "Lunch",
    type: "expense",
    amount: 50,
    category: "Food",
    date: "2026-09-19",
  });
  const restarted = harness(Object.fromEntries(first.values));
  const restored = await restarted.repo.loadWallet([]);
  assert.equal(restored.budgets[0].remainingAmount, 95000);
  assert.equal(restored.transactions.length, 1);
  await restarted.repo.saveWalletTransaction(restored.transactions[0]);
  assert.equal(
    restarted.repo.getWalletSnapshot().budgets[0].remainingAmount,
    95000,
  );
});
test("malformed storage fails visibly and is not overwritten", async () => {
  const saved = '{"version":1,"transactions":[]}';
  const h = harness({ ts_demo_wallet_v1: saved });
  await assert.rejects(h.repo.loadWallet([]), /invalid/);
  assert.equal(h.repo.getWalletSnapshot(), null);
  assert.equal(h.values.get("ts_demo_wallet_v1"), saved);
});
