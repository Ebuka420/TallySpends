const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { eligibleBankAlerts, checkTransactionFeed } = require("./tracking.ts");
const access = { platform: "android", nativeInboxAvailable: true, distributionApproved: true, consentAccepted: true, allowedSenders: ["ExampleBank"] };
const alert = { sender: "ExampleBank", body: "Debit alert NGN 100.00 Ref EXAMPLE-A", receivedAt: "2026-10-20T10:00:00Z" };
(async () => {
  for (const denied of [{ platform: "ios" }, { nativeInboxAvailable: false }, { distributionApproved: false }, { consentAccepted: false }, { allowedSenders: [] }]) assert.deepEqual(eligibleBankAlerts([alert], { ...access, ...denied }), []);
  for (const body of ["OTP 123456 Debit NGN100", "Your password Debit NGN100", "Hello there", "Debit alert without an amount"]) assert.deepEqual(eligibleBankAlerts([{ ...alert, body }], access), []);
  assert.deepEqual(eligibleBankAlerts([{ ...alert, sender: "Unknown" }], access), []);
  assert.deepEqual(eligibleBankAlerts([{ ...alert, receivedAt: "invalid" }], access), []);
  const distinct = { ...alert, body: "Debit alert NGN 100.00 Ref EXAMPLE-B" };
  assert.deepEqual(eligibleBankAlerts([alert, alert, distinct], access), [alert, distinct]);
  assert.deepEqual(eligibleBankAlerts([{ ...alert, extra: "not transmitted" }], access), [alert]);
  assert.deepEqual(eligibleBankAlerts([{ ...alert, body: "Credit NGN 100.00" }], access).length, 1);
  for (const response of [[], { transactions: [] }, null, { amount: 100 }]) {
    const calls = [];
    await assert.rejects(checkTransactionFeed(async path => { calls.push(path); return response; }), /response format/);
    assert.deepEqual(calls, ["/api/transactions"]);
  }
  await assert.rejects(checkTransactionFeed(async () => { throw new Error("offline"); }), /offline/);
  console.log("Tracking checks passed: privacy gates, alert filtering, exact repeats, distinct transfers, and unconfirmed response rejection.");
})().catch(error => { console.error(error); process.exitCode = 1; });
