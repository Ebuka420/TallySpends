const assert = require("node:assert/strict");
require("../testStorage.cjs");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { API_URL } = require("../api.ts");
const { registerPushToken } = require("./api.ts");
const token = "ExponentPushToken[synthetic-test-device]";
const session = { token: "access", refreshToken: null, saveTokens: async () => {} };
const signal = new AbortController().signal;
(async () => {
  const calls = [];
  await registerPushToken(token, session, signal, async (url, init) => {
    calls.push({ url, init }); return new Response(null);
  });
  assert.equal(calls[0].url, API_URL + "/api/notifications/register-token");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { expoPushToken: token });
  assert.equal(calls[0].init.headers.Authorization, "Bearer access");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.cache, "no-store");
  let saved;
  const attempts = [];
  await registerPushToken(token, { ...session, refreshToken: "refresh", saveTokens: async (...tokens) => { saved = tokens; } }, signal, async (url, init) => {
    attempts.push({ url, init });
    if (url.endsWith("/auth/refresh")) return new Response(JSON.stringify({ accessToken: "new", refreshToken: "rotated" }));
    return new Response(null, { status: attempts.length === 1 ? 401 : 200 });
  });
  assert.deepEqual(saved, ["new", "rotated"]);
  assert.equal(attempts.length, 3);
  assert.equal(attempts[2].init.headers.Authorization, "Bearer new");
  assert.equal(attempts[0].init.body, attempts[2].init.body);
  for (const status of [202, 204, 400, 401, 403, 404, 429, 500]) {
    await assert.rejects(registerPushToken(token, session, signal, async () => new Response(null, { status })));
  }
  await assert.rejects(registerPushToken(token, session, signal, async () => new Response(JSON.stringify({ success: false }))));
  for (const bad of ["", "native-fcm-token", "ExpoPushToken[bad token]"]) {
    await assert.rejects(registerPushToken(bad, session, signal, async () => { assert.fail("Invalid token was sent"); }));
  }
  await assert.rejects(registerPushToken(token, { ...session, token: null }, signal,
    async () => { assert.fail("Signed-out registration was sent"); }), /Sign in/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(registerPushToken(token, session, controller.signal,
    async () => { assert.fail("Cancelled request was sent"); }), /cancelled/);
  // A logout during token refresh must not restore the previous session.
  await require('../session.ts').beginSession();
  const logout = new AbortController();
  await assert.rejects(registerPushToken(token, { ...session, token: null, refreshToken: "refresh", saveTokens: async () => assert.fail("Stale tokens persisted") }, logout.signal,
    async () => { logout.abort(); return new Response(JSON.stringify({ accessToken: "stale" })); }), /cancelled/);
  let retries = 0;
  await require('../session.ts').beginSession();
  await assert.rejects(registerPushToken(token, { ...session, refreshToken: "refresh" }, signal, async url => {
    retries++;
    return url.endsWith("/auth/refresh") ? new Response(JSON.stringify({ accessToken: "still-expired", refreshToken: "new-refresh" })) : new Response(null, { status: 401 });
  }));
  assert.equal(retries, 3, "Refresh must run at most once");
  console.log("Push API checks passed: documented contract, auth refresh, cancellation, invalid tokens and rejected registration.");
})().catch(error => { console.error(error); process.exitCode = 1; });
