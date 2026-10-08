const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { API_URL } = require("../api.ts");
const { canSubmitFeedback, toggleFeedbackTag, createFeedbackSubmission, submitFeedback } = require("./service.ts");
const receipt = { id: "feedback-1", saved: true, emailStatus: "queued" };
const session = { token: "access", refreshToken: null, saveTokens: async () => {} };
const signal = new AbortController().signal;

(async () => {
  const empty = { rating: 0, tags: [], suggestions: " \n\t " };
  assert.equal(canSubmitFeedback(empty), false);
  assert.equal(canSubmitFeedback({ ...empty, tags: ["User Interface"] }), false);
  for (let rating = 1; rating <= 5; rating++) assert.equal(canSubmitFeedback({ ...empty, rating }), true);
  assert.equal(canSubmitFeedback({ ...empty, suggestions: "A useful idea" }), true);
  let tags = toggleFeedbackTag([], "Budgeting Tools");
  tags = toggleFeedbackTag(tags, "App Performance");
  assert.deepEqual(tags, ["Budgeting Tools", "App Performance"]);
  tags = toggleFeedbackTag(tags, "Budgeting Tools");
  assert.deepEqual(tags, ["App Performance"]);
  const draft = { rating: 0, tags, suggestions: "  First line\nSecond line 📝  " };
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
  assert.equal(captured.payload.rating, null);
  assert.deepEqual(captured.payload.tags, tags);
  assert.ok(!Number.isNaN(Date.parse(captured.payload.submittedAt)));
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
    return calls.length === 1 ? new Response(null, { status: 401 }) : new Response(JSON.stringify(receipt), { status: 201 });
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
  for (const body of [{}, { ...receipt, saved: false }, { ...receipt, emailStatus: "failed" }]) {
    await assert.rejects(submitFeedback(payload, session, "request-1", signal,
      async () => new Response(JSON.stringify(body)), true), /couldn't confirm/);
  }
  await assert.rejects(submitFeedback(payload, session, "request-1", signal,
    async () => new Response("not-json"), true), /couldn't confirm/);
  await assert.rejects(submitFeedback(payload, session, "request-1", signal,
    async () => { throw new TypeError("fetch failed"); }, true), /fetch failed/);
  assert.deepEqual(await submitFeedback(payload, { ...session, token: null }, "anonymous", signal, async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return new Response(JSON.stringify(receipt));
  }, true), receipt);
  console.log("Feedback checks passed: eligibility, multiple categories, exact text, loading, duplicate protection, retries, acceptance, errors and token refresh.");
})().catch(error => { console.error(error); process.exitCode = 1; });
