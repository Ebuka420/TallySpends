const assert = require("node:assert/strict");
require("../testStorage.cjs");
const fs = require("node:fs");
const ts = require("typescript");
const decode = require("jsqr");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { accountQrIdentity, buildQrLink, parseQrLink, parseIdentity, parseRecipient, validAmount } = require("./model.ts");
const { encodeQrMatrix } = require("./encoder.ts");
const { createQrRequest, qrApi } = require("./api.ts");
const { redirectQrIntent, getQrIntent, clearQrIntent, transferRoute } = require("./intent.ts");
const identity = { publicPaymentId: "TSP-4K7Q-9XBM", fullName: "Example Person", tallyTag: "example" };
const profileDto = { paymentId: identity.publicPaymentId, fullName: identity.fullName, tallyTag: identity.tallyTag };
const recipientDto = { paymentId: identity.publicPaymentId, displayName: identity.fullName, tallyTag: identity.tallyTag, isSelf: false };
const request = { paymentId: identity.publicPaymentId, amount: "1200.50", memo: "Lunch & tea ☕" };
function decodeMatrix(matrix) {
  const quiet = 4, scale = 6, side = (matrix.length + quiet * 2) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  matrix.forEach((row, y) => row.forEach((black, x) => {
    if (!black) return;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const p = (((y + quiet) * scale + dy) * side + (x + quiet) * scale + dx) * 4;
      pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
    }
  }));
  return decode(pixels, side, side)?.data;
}
const response = (value, status = 200) => new Response(JSON.stringify(value), { status });
(async () => {
  const link = buildQrLink(request);
  assert.deepEqual(parseQrLink(link), request);
  assert.equal(decodeMatrix(encodeQrMatrix(link)), link, "Independent decoder must read the generated QR");
  const second = buildQrLink({ paymentId: "TSP-ABCD-1234" });
  assert.notEqual(link, second);
  assert.equal(decodeMatrix(encodeQrMatrix(second)), second);
  const max = buildQrLink({ paymentId: identity.publicPaymentId, amount: "9999999999.99", memo: "😀".repeat(20) });
  assert.equal(decodeMatrix(encodeQrMatrix(max)), max, "Long IDs and Unicode notes must remain decodable");
  for (const amount of ["0", "-1", "1e3", "NaN", "Infinity", "1.234", " 1", "1 ", "10000000000"]) assert.equal(validAmount(amount), false);
  for (const value of [
    "https://external.example/transfer?v=1&paymentId=" + request.paymentId,
    "tallyspends://other?v=1&paymentId=" + request.paymentId,
    "tallyspends://transfer?recipient=ebuka",
    "tallyspends://transfer?v=2&paymentId=" + request.paymentId,
    link + "&paymentId=another-public-fixture-id",
    link + "&token=secret",
    link + "#extra",
    "tallyspends://transfer?v=1&paymentId=short",
    "tallyspends://transfer?v=1&paymentId=" + request.paymentId + "&amount=-1",
  ]) assert.throws(() => parseQrLink(value));
  assert.throws(() => buildQrLink({ ...request, memo: "x".repeat(41) }));
  assert.throws(() => buildQrLink({ ...request, memo: "line\nbreak" }));
  assert.throws(() => parseIdentity({ username: "ebuka" }), /identity is missing/);
  const localIdentity = accountQrIdentity(identity.publicPaymentId, "Example", "@example");
  assert.equal(localIdentity.publicPaymentId, identity.publicPaymentId);
  assert.equal(accountQrIdentity(identity.publicPaymentId, "Changed name", "@newtag").publicPaymentId, localIdentity.publicPaymentId);
  for (const scope of [null, "email:private@example.com", "id:", "id:0", "id:-1", "id:1.5"]) assert.equal(accountQrIdentity(scope, "Example", "example"), null);
  const localLink = buildQrLink({ paymentId: localIdentity.publicPaymentId, amount: "42.50", memo: "Food & tea" });
  assert.deepEqual(parseQrLink(decodeMatrix(encodeQrMatrix(localLink))), { paymentId: identity.publicPaymentId, amount: "42.50", memo: "Food & tea" });
  assert.equal(accountQrIdentity("id:123", "Example", "example"), null);
  assert.equal(parseIdentity({ paymentId: identity.publicPaymentId }).publicPaymentId, identity.publicPaymentId);
  assert.throws(() => parseRecipient({ publicPaymentId: identity.publicPaymentId }, identity.publicPaymentId), /verified recipient/);
  assert.deepEqual(parseIdentity({ ...profileDto, accessToken: "DO-NOT-RETAIN", nin: "DO-NOT-RETAIN" }), identity);
  assert.throws(() => parseRecipient(recipientDto, "TSP-ABCD-1234"), /verify/);
  assert.throws(() => parseRecipient({ ...recipientDto, isSelf: true }), /yourself/);
  assert.throws(() => parseRecipient({ ...recipientDto, isSelf: undefined }), /verified/);
  assert.equal(redirectQrIntent(link), transferRoute(request));
  assert.deepEqual(getQrIntent().request, request);
  clearQrIntent(); assert.equal(getQrIntent(), null);
  assert.equal(redirectQrIntent("tallyspends://transfer?recipient=ebuka"), "/transfer?qrError=invalid");
  assert.equal(redirectQrIntent("/profile"), "/profile", "Unrelated navigation stays unchanged");
  assert.equal(redirectQrIntent(transferRoute(request)), transferRoute(request));
  assert.equal(redirectQrIntent("exp://192.0.2.1:8081/--" + transferRoute(request)), transferRoute(request));
  clearQrIntent();
  const calls = [];
  const session = { token: "test-token", refreshToken: null, saveTokens: async () => {} };
  const client = createQrRequest(session, new AbortController().signal, async (url, options) => { calls.push({ url, options }); return response(url.endsWith('/users/me') ? profileDto : recipientDto); });
  assert.deepEqual(await qrApi.identity(client), { ...identity, tallyTag: "example" });
  assert.deepEqual(await qrApi.recipient(request.paymentId, client), { ...identity, tallyTag: "example" });
  assert.ok(calls[0].url.endsWith("/api/users/me"));
  assert.ok(calls[1].url.endsWith("/api/payment-ids/" + request.paymentId));
  assert.equal(calls[1].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[1].options.method, undefined, "Lookup does not submit a payment");
  assert.equal((await qrApi.byTag('@example', client)).publicPaymentId, identity.publicPaymentId);
  assert.ok(calls[2].url.endsWith('/api/payment-ids/by-tag/example'));
  assert.equal((await qrApi.recipient('tsp4k7q9xbm', client)).publicPaymentId, identity.publicPaymentId);
  await assert.rejects(qrApi.byTag('partial', async () => ({ ...recipientDto, tallyTag: 'different' })), /match/);
  await assert.rejects(client("https://external.example/collect"));
  await assert.rejects(client("/api/payments/recipients/" + request.paymentId));
  let rotated;
  const refreshing = createQrRequest({ ...session, refreshToken: "refresh-fixture", saveTokens: async (...value) => { rotated = value; } }, new AbortController().signal, async (url, options) => {
    if (url.endsWith("/auth/refresh")) return response({ accessToken: "new-token", refreshToken: "new-refresh" });
    return options.headers.Authorization === "Bearer test-token" ? response({}, 401) : response(recipientDto);
  });
  await qrApi.recipient(request.paymentId, refreshing);
  assert.deepEqual(rotated, ["new-token", "new-refresh"]);
  for (const status of [401, 403, 404, 429, 500, 503, 202]) {
    await assert.rejects(qrApi.recipient(request.paymentId, createQrRequest(session, new AbortController().signal, async () => response({ message: "UNTRUSTED SERVER TEXT" }, status))), error => !error.message.includes("UNTRUSTED"));
  }
  let sent = false;
  await assert.rejects(qrApi.identity(createQrRequest({ ...session, token: null }, new AbortController().signal, async () => { sent = true; return response(identity); })));
  assert.equal(sent, false);
  console.log("QR generation independently decodes; identity, payload validation, intent replay, Bearer lookup, token refresh and failure checks passed (mocked API).");
})().catch(error => { console.error(error.message); process.exitCode = 1; });
