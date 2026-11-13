const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);

const { checkTransactionFeed, eligibleBankAlerts, importEligibleBankAlerts } = require("./tracking.ts");
const { decodeSmsImportResponse, decodeTransactionFeed, formatSmsImportResult, mergeTransactionFeed } = require("./api.ts");
const { spendingByBudget, spendingInMonth } = require("./budgeting.ts");
const { refreshTransactionFeed, clearTransactionFeed, getTransactionFeedSnapshot } = require("./feed.ts");

const access = { platform: "android", nativeInboxAvailable: true, consentAccepted: true, allowedSenders: ["ExampleBank"] };
const alert = { sender: "ExampleBank", body: "Debit alert NGN 100.00 Ref EXAMPLE-A", receivedAt: "2026-10-20T10:00:00Z" };
const expense = { id: 91, amount: 1250.5, currency: "NGN", transactionType: "Expense", categoryName: "Food & Dining", vendorName: null, paymentMethodName: "Card", description: "Restaurant purchase", isRecurring: false, source: "Sms", transactionDate: "2026-10-20T10:00:00Z" };
const income = { id: "income-2", amount: 5000, currency: "NGN", transactionType: "Income", categoryName: "Income", vendorName: "Employer", paymentMethodName: null, description: null, isRecurring: false, source: "BankSync", transactionDate: "2026-10-20T09:00:00Z" };
const smsResponse = {
  imported: 1, duplicates: 1, ignored: 1, unparsed: 1,
  results: [
    { index: 0, status: "Imported", transactionId: 91, parsed: { direction: "Debit", amount: 1250.5, currency: "NGN" } },
    { index: 1, status: "Duplicate", transactionId: null, parsed: { direction: "Credit", amount: 55 } },
    { index: 2, status: "Ignored", transactionId: null, parsed: null },
    { index: 3, status: "Unparsed", transactionId: null, parsed: null },
  ],
};

test("GET /api/transactions decodes the direct array and uses transactionType, not amount sign", async () => {
  const calls = [];
  const transactions = await checkTransactionFeed(async path => { calls.push(path); return [expense, income]; });
  assert.deepEqual(calls, ["/api/transactions"]);
  assert.equal(transactions[0].id, "91");
  assert.equal(transactions[0].amount, 1250.5);
  assert.equal(transactions[0].type, "expense");
  assert.equal(transactions[0].title, "Restaurant purchase");
  assert.equal(transactions[0].vendorName, undefined);
  assert.equal(transactions[1].type, "income");
  assert.equal(transactions[1].amount, 5000);
  assert.equal(transactions[1].method, undefined);
  assert.equal(transactions[1].category, "Income");
  await assert.rejects(checkTransactionFeed(async () => ({ transactions: [expense] })), /unexpected response/);
  assert.throws(() => decodeTransactionFeed([{ ...expense, transactionType: "Credit" }]), /unsupported transaction type/);
  assert.throws(() => decodeTransactionFeed([{ ...expense, amount: -1250.5 }]), /invalid transaction amount/);
  assert.throws(() => decodeTransactionFeed([{ ...expense, currency: "USD" }]), /not in NGN/);
  assert.throws(() => decodeTransactionFeed([{ ...expense, transactionDate: "2026-10-20T10:00:00" }]), /UTC transaction date/);
  assert.throws(() => decodeTransactionFeed([expense, expense]), /duplicate IDs/);
});

test("SMS import requires exact counters and renders all per-message statuses without message text", async () => {
  const decoded = decodeSmsImportResponse(smsResponse);
  const formatted = formatSmsImportResult({ ...decoded, results: decoded.results.map(result => ({ batch: 1, index: result.index, status: result.status })) });
  assert.match(formatted, /1 imported, 1 duplicate, 1 ignored, 1 unparsed/);
  for (const status of ["Imported", "Duplicate", "Ignored", "Unparsed"]) assert.match(formatted, new RegExp(status));
  assert.doesNotMatch(formatted, /EXAMPLE-A|Debit alert/);
  assert.equal(decoded.results[2].parsed, null);
  assert.equal(decoded.results[0].parsed.amount, 1250.5);
  assert.throws(() => decodeSmsImportResponse({ ...smsResponse, duplicates: 0 }), /did not match/);
  assert.throws(() => decodeSmsImportResponse({ ...smsResponse, results: [{ ...smsResponse.results[0], status: "Success" }] }), /unknown SMS import status/);
});

test("SMS eligibility and import send only approved bank alerts and decode the exact response", async () => {
  for (const denied of [{ platform: "ios" }, { nativeInboxAvailable: false }, { consentAccepted: false }, { allowedSenders: [] }]) assert.deepEqual(eligibleBankAlerts([alert], { ...access, ...denied }), []);
  for (const body of ["OTP 123456 Debit NGN100", "Your password Debit NGN100", "Hello there", "Debit alert without an amount"]) assert.deepEqual(eligibleBankAlerts([{ ...alert, body }], access), []);
  let call;
  const result = await importEligibleBankAlerts(async (path, init) => { call = { path, init }; return smsResponse; }, [alert, alert], access);
  assert.equal(result.submitted, 2);
  assert.deepEqual(result.response, smsResponse);
  assert.deepEqual(call, { path: "/api/sms/import", init: { method: "POST", body: JSON.stringify({ messages: [alert, alert] }) } });
  await assert.rejects(importEligibleBankAlerts(async () => ({ ...smsResponse, results: [] }), [alert], access), /did not match/);
});

test("remote records replace matching IDs, local manual rows survive, and untouched demo seeds are hidden only from the synced feed", () => {
  const seed = { id: "tx-1", title: "Seed", amount: 20, category: "Food", type: "expense", date: "2024-01-01" };
  const editedSeed = { ...seed, memo: "User added a note" };
  const localRemoteEcho = { id: "remote-1", title: "Local stale", amount: 10, category: "Other", type: "expense", date: "2026-01-01", receiptImage: "receipt://local" };
  const localManual = { id: "manual-device-1", title: "Cash lunch", amount: 400, category: "Food & Dining", type: "expense", date: "2026-10-20" };
  const remote = [{ id: "remote-1", title: "Canonical", amount: 12, category: "Other", type: "expense", date: "2026-01-02", isServerTransaction: true }];
  const merged = mergeTransactionFeed(remote, [seed, editedSeed, localRemoteEcho, localManual], [seed]);
  assert.equal(merged.length, 3);
  assert.equal(merged.find(tx => tx.id === "remote-1").title, "Canonical");
  assert.equal(merged.find(tx => tx.id === "remote-1").receiptImage, "receipt://local");
  assert.equal(merged.find(tx => tx.id === "manual-device-1").source, "LocalManual");
  assert.ok(merged.some(tx => tx.id === "tx-1" && tx.memo === "User added a note"));
});

test("budget spend is a read-only unique category/date attribution and amounts are naira converted once", () => {
  const budgets = [
    { id: "food", category: "Food & Dining", startDate: "2026-10-01", status: "active" },
    { id: "transport", category: "Transport", startDate: "2026-10-01", status: "active" },
    { id: "food-overlap", category: "Food & Dining", startDate: "2026-10-01", status: "active" },
  ];
  const txs = [
    { id: "food-1", amount: 150.25, type: "expense", category: "Food & Dining", categoryName: "Food & Dining", date: "2026-10-20T10:00:00Z", isServerTransaction: true },
    { id: "transport-1", amount: 50, type: "expense", category: "Transport", categoryName: "Transport", date: "2026-10-20T10:00:00Z", isServerTransaction: true },
    { id: "uncategorized", amount: 999, type: "expense", category: "Others", categoryName: null, date: "2026-10-20T10:00:00Z", isServerTransaction: true },
  ];
  const result = spendingByBudget(txs, budgets);
  assert.equal(result.food, 0, "ambiguous same-category budgets remain unattributed");
  assert.equal(result["food-overlap"], 0);
  assert.equal(result.transport, 5000);
  assert.equal(spendingInMonth(txs, "2026-10"), 119925);
});

test("the authenticated feed is owner-scoped and refreshes from the backend array", async () => {
  clearTransactionFeed();
  const first = await refreshTransactionFeed("id:guardian-a", async path => { assert.equal(path, "/api/transactions"); return [expense]; }, true);
  assert.equal(first[0].source, "Sms");
  assert.equal(getTransactionFeedSnapshot().owner, "id:guardian-a");
  const second = await refreshTransactionFeed("id:guardian-b", async () => [income], true);
  assert.deepEqual(second.map(tx => tx.id), ["income-2"]);
  assert.equal(getTransactionFeedSnapshot().owner, "id:guardian-b");
  clearTransactionFeed();
  assert.equal(getTransactionFeedSnapshot().transactions.length, 0);
});

test("a forced post-import refresh waits for older feed requests and reads the backend again", async () => {
  clearTransactionFeed();
  let finishFirst;
  let calls = 0;
  const request = async () => {
    calls++;
    if (calls === 1) return new Promise(resolve => { finishFirst = resolve; });
    return [income];
  };
  const first = refreshTransactionFeed("id:guardian-a", request, true);
  const afterImport = refreshTransactionFeed("id:guardian-a", request, true);
  await Promise.resolve();
  assert.equal(calls, 1);
  finishFirst([expense]);
  await Promise.all([first, afterImport]);
  assert.equal(calls, 2);
  assert.deepEqual(getTransactionFeedSnapshot().transactions.map(tx => tx.id), ["income-2"]);
  clearTransactionFeed();
});
