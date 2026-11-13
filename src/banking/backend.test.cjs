const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const { BankRequestError, bankBackend, createBankRequest, getMonoAuthCode, parseLinkedAccounts } = require("./backend.ts");
(async () => {
  assert.equal(getMonoAuthCode({ getAuthCode: () => "temporary-code" }), "temporary-code");
  assert.equal(getMonoAuthCode({ code: "fallback-code" }), "fallback-code");
  assert.throws(() => getMonoAuthCode({ id: "account-id" }), /authorization code/);
  assert.throws(() => getMonoAuthCode({ code: "" }), /authorization code/);
  const exchangeCalls = [];
  await bankBackend.confirmConnection("temporary-code", async (path, options) => {
    exchangeCalls.push({ path, options });
    return { success: true };
  });
  assert.equal(exchangeCalls[0].path, "/api/bank-accounts/link");
  assert.equal(exchangeCalls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(exchangeCalls[0].options.body), { monoCode: "temporary-code" });
  await assert.rejects(bankBackend.confirmConnection("temporary-code", async () => ({ success: false })), /not been confirmed/);
  await assert.rejects(bankBackend.confirmConnection("temporary-code", async () => ({ status: "pending" })), /not been confirmed/);
  await assert.rejects(bankBackend.listAccounts(async path => {
    assert.equal(path, "/api/bank-accounts");
    return [{ id: "bank-1", bankName: "Test Bank", accountName: "Test User", accountNumber: "1234567890" }];
  }), /confirmed GET \/api\/bank-accounts response schema/);
  assert.deepEqual(await bankBackend.listAccounts(async path => {
    assert.equal(path, "/api/bank-accounts");
    return [];
  }), []);
  const accounts = parseLinkedAccounts([{ id: "bank-1", bankName: "Test Bank", accountName: "Test User", accountNumber: "1234567890" }]);
  assert.equal(accounts[0].maskedAccountNumber, "•••• 7890");
  const identified = parseLinkedAccounts([{ id: "bank-2", bankName: "Backend bank name", accountName: "Test User", bankCode: "058", bankSlug: "guaranty-trust-bank", providerId: "guaranty-trust-bank" }])[0];
  assert.equal(identified.bankCode, "058");
  assert.equal(identified.bankName, "Backend bank name");
  assert.equal(identified.providerId, "guaranty-trust-bank");
  assert.throws(() => parseLinkedAccounts({ unexpected: [] }), /response format needs confirmation/);
  assert.throws(() => parseLinkedAccounts([{ id: "bank-1" }]), /Couldn't read/);
  const signal = new AbortController().signal;
  // Exercise the real adapter + authenticated client together. This fixture
  // verifies frontend wiring; it is not a captured backend account response.
  const roundTripCalls = [];
  const roundTrip = createBankRequest({ token: "access-token", refreshToken: null, saveTokens: async () => {} }, signal,
    async (url, options) => {
      roundTripCalls.push({ url, options });
      assert.equal(options.headers.get("Authorization"), "Bearer access-token");
      if (url.endsWith("/api/bank-accounts/link")) {
        assert.equal(options.method, "POST");
        assert.deepEqual(JSON.parse(options.body), { monoCode: "mono-temporary-code" });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      assert.ok(url.endsWith("/api/bank-accounts"));
      return new Response(JSON.stringify([{ id: "linked-1", bankName: "Test Bank", accountName: "Test User", accountNumber: "1234567890", availableBalance: 125, currency: "NGN" }]));
    });
  await bankBackend.confirmConnection(getMonoAuthCode({ getAuthCode: () => "mono-temporary-code" }), roundTrip);
  await assert.rejects(bankBackend.listAccounts(roundTrip), /response schema/);
  assert.equal(roundTripCalls.length, 2);
  assert.equal(roundTripCalls[1].options.cache, "no-store");
  assert.equal(roundTripCalls[0].options.redirect, "error");
  let calls = [];
  const saved = [];
  const send = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/api/auth/refresh"))
      return new Response(JSON.stringify({ accessToken: "new-token", refreshToken: "new-refresh" }));
    if (calls.length === 1) return new Response("", { status: 401 });
    return new Response(JSON.stringify({ confirmed: true }));
  };
  const request = createBankRequest({
    token: "old-token", refreshToken: "old-refresh",
    saveTokens: async (...tokens) => saved.push(tokens),
  }, signal, send);
  await assert.rejects(request("https://other.example/code"), /Invalid bank backend path/);
  await assert.rejects(request("//other.example/code"), /Invalid bank backend path/);
  assert.equal(calls.length, 0);
  const result = await request("/api/bank-accounts/link", { method: "POST", body: JSON.stringify({ code: "temporary-code" }) });
  assert.deepEqual(result, { confirmed: true });
  assert.equal(calls.length, 3);
  assert.deepEqual(saved, [["new-token", "new-refresh"]]);
  assert.equal(calls[0].options.headers.get("Authorization"), "Bearer old-token");
  assert.equal(calls[2].options.headers.get("Authorization"), "Bearer new-token");
  assert.equal(calls[2].options.body, calls[0].options.body);
  assert.equal(calls[2].options.signal, signal);
  await assert.rejects(request("/api/bank-accounts/link"), /Invalid bank backend path/);
  await assert.rejects(request("/api/bank-accounts", { method: "POST" }), /Invalid bank backend path/);
  await assert.rejects(request("/api/transactions", { method: "POST" }), /Invalid bank backend path/);
  let smsImportAuthorization;
  const smsImport = createBankRequest({ token: "sms-token", refreshToken: null, saveTokens: async () => {} }, signal,
    async (url, init) => {
      assert.ok(url.endsWith("/api/sms/import"));
      smsImportAuthorization = init.headers.get("Authorization");
      assert.equal(init.method, "POST");
      return new Response(JSON.stringify("opaque backend fixture"), { status: 200 });
    });
  assert.equal(await smsImport("/api/sms/import", { method: "POST", body: JSON.stringify({ messages: [] }) }), "opaque backend fixture");
  assert.equal(smsImportAuthorization, "Bearer sms-token");
  let transactionAuthorization;
  const transactionRead = createBankRequest({ token: "transaction-token", refreshToken: null, saveTokens: async () => {} }, signal,
    async (url, init) => { assert.ok(url.endsWith("/api/transactions")); transactionAuthorization = init.headers.get("Authorization"); return new Response("[]", { status: 200 }); });
  assert.deepEqual(await transactionRead("/api/transactions"), []);
  assert.equal(transactionAuthorization, "Bearer transaction-token");
  assert.throws(() => getMonoAuthCode({ getAuthCode: () => { throw new Error("SECRET-AUTH-CODE"); } }), error => !error.message.includes("SECRET"));
  const badNetwork = createBankRequest({ token: "token", refreshToken: null, saveTokens: async () => {} }, signal,
    async () => { throw new Error("SECRET-AUTH-CODE"); });
  await assert.rejects(badNetwork("/api/bank-accounts/link", { method: "POST" }), error => error instanceof BankRequestError && error.uncertain && !error.message.includes("SECRET"));
  for (const status of [400, 409, 422, 429, 500]) {
    const failing = createBankRequest({ token: "token", refreshToken: null, saveTokens: async () => {} }, signal,
      async () => new Response(JSON.stringify({ message: "SECRET-AUTH-CODE" }), { status }));
    await assert.rejects(failing("/api/bank-accounts/link", { method: "POST" }), error => !error.message.includes("SECRET"));
  }
  const rejected = createBankRequest({ token: "token", refreshToken: null, saveTokens: async () => {} },
    signal, async () => new Response("", { status: 500 }));
  await assert.rejects(rejected("/api/bank-accounts"), /could not complete/);
  const signedOut = createBankRequest({ token: null, refreshToken: null, saveTokens: async () => {} },
    signal, async () => { throw new Error("Must not send"); });
  await assert.rejects(signedOut("/api/bank-accounts"), /Sign in again/);
  const emptySuccess = createBankRequest({ token: "token", refreshToken: null, saveTokens: async () => {} },
    signal, async () => new Response(null, { status: 204 }));
  await assert.rejects(emptySuccess("/api/bank-accounts/link", { method: "POST" }), error => error instanceof BankRequestError && error.uncertain);
  const pending = createBankRequest({ token: "token", refreshToken: null, saveTokens: async () => {} },
    signal, async () => new Response(null, { status: 202 }));
  await assert.rejects(pending("/api/bank-accounts/link", { method: "POST" }), /still being processed/);
  const missingEndpoint = createBankRequest({ token: "token", refreshToken: null, saveTokens: async () => {} },
    signal, async () => new Response(null, { status: 404 }));
  await assert.rejects(missingEndpoint("/api/bank-accounts"), /temporarily unavailable/);
  console.log("Bank request checks passed: Mono exchange, account masking, token refresh, failed/pending responses and missing session.");
})().catch(error => { console.error(error); process.exitCode = 1; });
