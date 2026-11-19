const assert = require("node:assert/strict");
require("../testStorage.cjs");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { API_URL } = require("../api.ts");
const { canSubmitFeedback, toggleFeedbackTag, createFeedbackSubmission, submitFeedback } = require("./service.ts");
const receipt = { accepted: true };
const session = { token: "access", refreshToken: null, saveTokens: async () => {} };
const signal = new AbortController().signal;

(async () => {
  const empty = { rating: 0, tags: [], suggestions: " \n\t " };
  assert.equal(canSubmitFeedback(empty), false);
  assert.equal(canSubmitFeedback({ ...empty, tags: ["User Interface"] }), false);
  for (let rating = 1; rating <= 5; rating++) assert.equal(canSubmitFeedback({ ...empty, rating }), true);
  assert.equal(canSubmitFeedback({ ...empty, suggestions: "A useful idea" }), false);
  let tags = toggleFeedbackTag([], "Budgeting Tools");
  tags = toggleFeedbackTag(tags, "App Performance");
  assert.deepEqual(tags, ["Budgeting Tools", "App Performance"]);
  tags = toggleFeedbackTag(tags, "Budgeting Tools");
  assert.deepEqual(tags, ["App Performance"]);
  const draft = { rating: 4, tags, suggestions: "  First line\nSecond line 📝  " };
  const busy = [];
  const runner = createFeedbackSubmission();
  let finish;
  let captured;
  const pending = runner.run(draft, (payload, key) => {
    captured = { payload, key };
    return new Promise(resolve => { finish = resolve; });
  }, value => busy.push(value));
  assert.deepEqual(busy, [true]);
  assert.equal(await runner.run(draft, () => { throw new Error("Duplicate must not send"); }, () => {}), null);
  assert.equal(captured.payload.suggestions, draft.suggestions);
  assert.equal(captured.payload.rating, 4);
  assert.deepEqual(captured.payload.categories, tags);
  assert.deepEqual(Object.keys(captured.payload).sort(), ["categories", "rating", "suggestions"]);
  finish(receipt);
  assert.deepEqual(await pending, receipt);
  assert.deepEqual(busy, [true, false]);
  assert.equal(await runner.run(draft, () => { throw new Error("Success must not resubmit"); }, () => {}), null);

  const retry = createFeedbackSubmission();
  const attempts = [];
  const failureBusy = [];
  await assert.rejects(retry.run(draft, async (payload, key) => {
    attempts.push({ payload, key }); throw new Error("offline");
  }, value => failureBusy.push(value)), /offline/);
  assert.deepEqual(failureBusy, [true, false]);
  await retry.run(draft, async (payload, key) => { attempts.push({ payload, key }); return receipt; }, () => {});
  assert.deepEqual(attempts[0], attempts[1]);
  const edits = createFeedbackSubmission();
  let firstKey;
  await assert.rejects(edits.run(draft, async (_payload, key) => { firstKey = key; throw new Error("failed"); }, () => {}));
  await edits.run({ ...draft, suggestions: "Changed text" }, async (_payload, key) => {
    assert.notEqual(key, firstKey); return receipt;
  }, () => {});
  await assert.rejects(createFeedbackSubmission().run(empty, async () => receipt, () => {}), /Select a star/);
  await assert.rejects(createFeedbackSubmission().run({ ...draft, rating: 6 }, async () => receipt, () => {}), /Select a star/);
  await assert.rejects(createFeedbackSubmission().run({ ...draft, tags: ["Unknown"] }, async () => receipt, () => {}), /available improvement/);

  const payload = captured.payload;
  await assert.rejects(submitFeedback(payload, session, "request-1", signal,
    async () => { throw new Error("Disabled service must not send"); }, false), /currently unavailable/);
  const calls = [];
  const savedTokens = [];
  const refreshed = await submitFeedback(payload, {
    token: "old-access", refreshToken: "refresh", saveTokens: async (...tokens) => savedTokens.push(tokens),
  }, "request-1", signal, async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/api/auth/refresh")) return new Response(JSON.stringify({ accessToken: "new-access", refreshToken: "new-refresh" }));
    return calls.length === 1 ? new Response(null, { status: 401 }) : new Response(null, { status: 200 });
  }, true);
  assert.deepEqual(refreshed, receipt);
  assert.equal(calls[0].url, `${API_URL}/api/feedback`);
  assert.equal(calls[0].options.headers.Authorization, "Bearer old-access");
  assert.equal(calls[2].options.headers.Authorization, "Bearer new-access");
  assert.equal(calls[0].options.headers["Idempotency-Key"], calls[2].options.headers["Idempotency-Key"]);
  assert.equal(calls[0].options.body, calls[2].options.body);
  assert.equal(JSON.parse(calls[0].options.body).suggestions, draft.suggestions);
  assert.deepEqual(savedTokens, [["new-access", "new-refresh"]]);
  for (const status of [400, 401, 404, 422, 429, 500, 503]) {
    await assert.rejects(submitFeedback(payload, session, "request-1", signal,
      async () => new Response(null, { status }), true));
  }
  for (const body of [{ success: false }, { saved: false }, { status: "pending" }, { status: "failed" }]) {
    await assert.rejects(submitFeedback(payload, session, "request-1", signal,
      async () => new Response(JSON.stringify(body)), true), /hasn't confirmed/);
  }
  for (const status of [201, 202, 204]) await assert.rejects(submitFeedback(payload, session, "request-1", signal,
    async () => new Response(null, { status }), true), /hasn't confirmed/);
  // Swagger specifies no success body. Do not require invented saved/email fields.
  for (const body of [null, "OK", "{}", JSON.stringify({ id: 17 })]) {
    assert.deepEqual(await submitFeedback(payload, session, "request-1", signal,
      async () => new Response(body)), receipt);
  }
  await assert.rejects(submitFeedback(payload, session, "request-1", signal,
    async () => { throw new TypeError("fetch failed"); }, true), /fetch failed/);
  await assert.rejects(submitFeedback(payload, { ...session, token: null }, "anonymous", signal,
    async () => { throw new Error("Anonymous requests must not be sent"); }, true), /Sign in/);
  await assert.rejects(submitFeedback({ ...payload, rating: 0 }, session, "request-1", signal,
    async () => { throw new Error("Invalid rating must not be sent"); }), /review/);
  assert.deepEqual(JSON.parse(calls[0].options.body), { rating: 4, categories: tags, suggestions: draft.suggestions });
  assert.equal(calls[0].options.redirect, "error");
  console.log("Feedback checks passed: eligibility, multiple categories, exact text, loading, duplicate protection, retries, acceptance, errors and token refresh.");
})().catch(error => { console.error(error); process.exitCode = 1; });
