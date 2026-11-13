const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { ageOn, validateDraft, parseNotice, parseList, parseReceipt } = require("./model.ts");
const { younginsApi, buildYounginsRegistration, createYounginsRequest, createSubmissionGate } = require("./api.ts");
const { API_URL } = require("../api.ts");
// Synthetic fixtures only; never submit these to a live service.
const draft = { firstName: "Ada", lastName: "Example", dateOfBirth: "2015-07-10", guardianRelationship: "Mother", nin: "00000000000" };
const profile = { id: "1", firstName: draft.firstName, lastName: draft.lastName, dateOfBirth: draft.dateOfBirth, guardianRelationship: draft.guardianRelationship };
// Exact confirmed production shape, with synthetic values only.
const receipt = { ...profile, id: 1, ninMasked: "*******0000", ninVerified: false,
  consent: { accepted: true, noticeVersion: "fixture-v1", acceptedAt: "2026-10-11T09:14:02.331Z" },
  createdAt: "2026-10-11T09:14:02.331Z" };
const notice = { version: "fixture-v1", notice: "Test notice; not approved for real data.", guardianDeclaration: "Test declaration.", ninCollectionEnabled: true };
const session = { token: "test-access", refreshToken: null, saveTokens: async () => {} };
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
// Exercise the payload builder and authenticated transport using synthetic data.
// Production younginsApi.create remains release-gated and is tested separately.
async function submitFixture(draft, notice, consent, key, request) {
  return parseReceipt(await request("/api/children", buildYounginsRegistration(draft, notice, consent, key)));
}
(async () => {
  assert.deepEqual(validateDraft(draft, "2026-10-10"), {});
  const errors = validateDraft({ firstName: " ", lastName: "", dateOfBirth: "", guardianRelationship: "", nin: "" }, "2026-10-10");
  assert.equal(Object.keys(errors).length, 5);
  for (const value of ["2008-10-10", "2026-10-11", "2025-02-29", "2015-13-01"]) assert.ok(validateDraft({ ...draft, dateOfBirth: value }, "2026-10-10").dateOfBirth);
  assert.equal(validateDraft({ ...draft, dateOfBirth: "2008-10-11" }, "2026-10-10").dateOfBirth, undefined);
  assert.equal(validateDraft({ ...draft, dateOfBirth: "2026-10-10" }, "2026-10-10").dateOfBirth, undefined);
  assert.equal(ageOn("2008-10-10", "2026-10-09"), 17);
  assert.equal(ageOn("2008-10-10", "2026-10-10"), 18);
  assert.equal(ageOn("2008-02-29", "2026-02-28"), 17);
  assert.equal(ageOn("2008-02-29", "2026-03-01"), 18);
  for (const nin of ["123", "000000000000", "0000000000a", " 0000000000", "00000000000 "]) assert.ok(validateDraft({ ...draft, nin }).nin);
  for (const relationship of ["Mother", "Father", "Legal Guardian"]) assert.equal(validateDraft({ ...draft, guardianRelationship: relationship }).guardianRelationship, undefined);
  assert.ok(validateDraft({ ...draft, guardianRelationship: "Other" }).guardianRelationship);
  assert.deepEqual(parseNotice(notice), notice);
  assert.throws(() => parseNotice({ ...notice, ninCollectionEnabled: false }));
  assert.throws(() => parseNotice({ ...notice, guardianDeclaration: "" }));
  assert.deepEqual(parseList([]), []);
  assert.deepEqual(parseList([receipt]), [profile]);
  for (const id of [0, -1, 1.5, "1", Number.MAX_SAFE_INTEGER + 1, null]) assert.throws(() => parseReceipt({ ...receipt, id }));
  assert.throws(() => parseReceipt({ success: true }));
  assert.throws(() => parseList([{ id: 1 }]));
  const safe = parseReceipt({ ...receipt, nin: draft.nin, balance: 50000, walletId: "unexpected" });
  assert.equal("nin" in safe, false);
  assert.equal("balance" in safe, false);
  assert.equal("walletId" in safe, false);
  for (const key of ["ninMasked", "ninVerified", "consent", "createdAt"]) assert.equal(key in safe, false);
  assert.throws(() => parseNotice({ ...notice, version: "x".repeat(21) }));

  const calls = [];
  const request = createYounginsRequest(session, new AbortController().signal, async (url, init) => {
    calls.push({ url, init });
    if (init.method === "POST") return response(receipt, 201);
    return response([receipt]);
  });
  await assert.rejects(younginsApi.notice(request), /approved child-data privacy notice/);
  await assert.rejects(younginsApi.create(draft, notice, { accepted: true, noticeVersion: notice.version }, "blocked", request), /approved child-data privacy notice/);
  assert.equal(calls.length, 0, "Missing release prerequisites must block all child-data requests");
  assert.deepEqual(await submitFixture(draft, notice, { accepted: true, noticeVersion: notice.version }, "stable-key", request), profile);
  const create = calls.find(c => c.init.method === "POST");
  assert.equal(create.url, API_URL + "/api/children");
  assert.equal(create.init.headers.get("Authorization"), "Bearer test-access");
  assert.equal(create.init.headers.has("Idempotency-Key"), false);
  assert.equal(create.init.cache, "no-store");
  assert.deepEqual(JSON.parse(create.init.body), { ...draft, consent: { accepted: true, noticeVersion: "fixture-v1" } });
  assert.equal("guardianId" in JSON.parse(create.init.body), false);
  const beforeRejectedConsent = calls.length;
  await assert.rejects(submitFixture(draft, notice, { accepted: false, noticeVersion: notice.version }, "no-consent", request), /accept/);
  await assert.rejects(submitFixture(draft, notice, { accepted: true, noticeVersion: "stale" }, "stale-consent", request), /current/);
  assert.equal(calls.length, beforeRejectedConsent);
  assert.deepEqual(await younginsApi.list(request), [profile]);
  assert.equal(calls.at(-1).url, API_URL + "/api/children");
  for (const unknown of [null, { success: true }, { children: [receipt] }, [{ id: "partial", nin: draft.nin }]]) {
    await assert.rejects(younginsApi.list(async () => unknown), error =>
      /invalid Youngins accounts response/.test(error.message) && !error.message.includes(draft.nin));
  }
  await assert.rejects(request("/api/youngins"));
  await assert.rejects(request("/api/children/privacy"));
  await assert.rejects(request("/api/children/child-A"));
  assert.deepEqual(await younginsApi.get("1", request), profile);
  await assert.rejects(younginsApi.get("2", async () => [receipt]), /selected/);
  const beforeEdit = calls.length;
  await assert.rejects(younginsApi.update("1", draft, "edit-key", request), /not supported/);
  assert.equal(calls.length, beforeEdit);
  await assert.rejects(request("/api/youngins/1", { method: "PATCH" }));
  const replay = createYounginsRequest(session, new AbortController().signal, async () => response(receipt, 200));
  assert.deepEqual(await submitFixture(draft, notice, { accepted: true, noticeVersion: notice.version }, "replay", replay), profile);
  await assert.rejects(submitFixture(draft, { ...notice, version: "x".repeat(21) }, { accepted: true, noticeVersion: "x".repeat(21) }, "long-version", request), /current privacy notice/);
  await assert.rejects(submitFixture({ ...draft, nin: "invalid" }, notice, { accepted: true, noticeVersion: notice.version }, "bad", request));
  await assert.rejects(request("https://external.example/collect"));

  for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 503]) {
    const failing = createYounginsRequest(session, new AbortController().signal, async () => response({ message: "SECRET-NIN-ECHO", nin: draft.nin }, status));
    await assert.rejects(submitFixture(draft, notice, { accepted: true, noticeVersion: notice.version }, "error", failing), error => !error.message.includes("SECRET-NIN-ECHO") && !error.message.includes(draft.nin));
  }
  for (const status of [202, 204]) {
    const pending = createYounginsRequest(session, new AbortController().signal, async () => status === 204 ? new Response(null, { status }) : response(receipt, status));
    await assert.rejects(submitFixture(draft, notice, { accepted: true, noticeVersion: notice.version }, "pending", pending), /not been confirmed/);
  }
  let refreshed = 0;
  let savedTokens;
  const refreshing = createYounginsRequest({ ...session, refreshToken: "test-refresh", saveTokens: async (...values) => { savedTokens = values; } }, new AbortController().signal, async (url, init) => {
    if (url.endsWith("/api/auth/refresh")) { refreshed++; return response({ accessToken: "rotated-access", refreshToken: "rotated-refresh" }); }
    if (init.headers.get("Authorization") === "Bearer test-access") return response({}, 401);
    assert.equal(init.headers.has("Idempotency-Key"), false);
    return response(receipt, 201);
  });
  assert.deepEqual(await submitFixture(draft, notice, { accepted: true, noticeVersion: notice.version }, "retry-key", refreshing), profile);
  assert.equal(refreshed, 1);
  assert.deepEqual(savedTokens, ["rotated-access", "rotated-refresh"]);
  let anonymousCalls = 0;
  const anonymous = createYounginsRequest({ ...session, token: null }, new AbortController().signal, async () => { anonymousCalls++; return response(receipt); });
  await assert.rejects(submitFixture(draft, notice, { accepted: true, noticeVersion: notice.version }, "anon", anonymous), /Sign in/);
  assert.equal(anonymousCalls, 0);

  const gate = createSubmissionGate();
  const loading = [];
  let release;
  let submissions = 0;
  const first = gate.run(async () => { submissions++; await new Promise(resolve => { release = resolve; }); return profile; }, busy => loading.push(busy));
  assert.equal(gate.busy, true);
  assert.equal(await gate.run(async () => { submissions++; return profile; }, () => {}), null);
  release();
  assert.deepEqual(await first, profile);
  assert.deepEqual(loading, [true, false]);
  assert.equal(submissions, 1);
  assert.equal(await gate.run(async () => { submissions++; return profile; }, () => {}), null);
  const retryGate = createSubmissionGate();
  await assert.rejects(retryGate.run(async () => { throw new Error("Storage failed"); }, () => {}));
  assert.equal(retryGate.completed, false);
  assert.equal(retryGate.busy, false);
  assert.deepEqual(await retryGate.run(async () => profile, () => {}), profile);
  console.log("Youngins validation, safe responses, authenticated API flow, errors, token refresh, loading and duplicate-submission checks passed (mocked backend).");
})().catch(error => { console.error(error.message); process.exitCode = 1; });
