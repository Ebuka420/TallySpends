const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const values = new Map();
const storage = {
  getItem: async key => values.get(key) ?? null,
  setItem: async (key, value) => { values.set(key, value); },
  multiGet: async keys => keys.map(key => [key, values.get(key) ?? null]),
  multiSet: async pairs => pairs.forEach(([key, value]) => values.set(key, value)),
};
const originalLoad = Module._load;
let failPhotoRead = false;
class TestFile {
  constructor(uri) { this.uri = uri; this.name = "picked.jpg"; this.type = "image/jpeg"; this.size = 4; this.exists = true; }
  async bytes() { if (failPhotoRead) throw new Error("Local file read failed"); return new Uint8Array([255, 216, 255, 217]); }
}
Module._load = function(name, ...args) {
  if (name === "@react-native-async-storage/async-storage") return storage;
  if (name === "expo-file-system") return { File: TestFile };
  if (name === "expo/fetch") return { fetch: (...args) => global.fetch(...args) };
  return originalLoad.call(this, name, ...args);
};
// Use Expo's actual FormData patch/converter, not Node's stringifying FormData.
class NativeFormData { constructor() { this._parts = []; } }
const { installFormDataPatch } = require("../../node_modules/expo/src/winter/FormData.ts");
const { convertFormDataAsync } = require("../../node_modules/expo/src/winter/fetch/convertFormData.ts");
global.FormData = installFormDataPatch(NativeFormData);
const { profileScope, parseProfile, cachedProfile } = require("./model.ts");
const { createProfileRequest } = require("./api.ts");
const repo = require("./repository.ts");
const response = (data, status = 200) => ({ status, ok: status >= 200 && status < 300, json: async () => data });
function signIn(userId) { repo.clearProfileSession(); values.set("ts_user", JSON.stringify({ userId, fullName: `Person ${userId}`, email: `${userId}@example.com` })); values.set("ts_access_token", `token-${userId}`); }
async function main() {
  const legacy = new FormData(); legacy.append("file", { uri: "file:///picked.jpg", name: "picked.jpg", type: "image/jpeg" });
  await assert.rejects(convertFormDataAsync(legacy), /Unsupported FormDataPart/);
  assert.notEqual(profileScope({ userId: 1 }), profileScope({ userId: 2 }));
  assert.equal(profileScope(null), null);
  assert.equal(profileScope({ email: "A@EXAMPLE.COM" }), "email:a@example.com");
  assert.deepEqual(parseProfile({ fullName: "Person", tallyTag: "@@person", nin: "sensitive", token: "secret" }), { fullName: "Person", tallyTag: "person" });
  assert.throws(() => parseProfile({ avatarUrl: "file:///private/photo.jpg" }));
  assert.throws(() => parseProfile({ user: { fullName: "Unsupported envelope" } }));
  const oldCache = cachedProfile({ fullName: "Server name", nickname: "Old nickname", gender: "Old local value", dob: "2010/01/01", address: "Old local address" });
  assert.equal("nickname" in oldCache, false);
  assert.equal(oldCache.gender, ""); assert.equal(oldCache.dob, ""); assert.equal(oldCache.address, "");
  assert.equal(oldCache.fullName, "Server name");
  values.set("ts_profile_image", "file:///legacy-other-person.jpg");
  values.set("ts_profile_fullname", "Legacy other person");
  let account = { fullName: "Account A", email: "1@example.com", tallyTag: "accountA", avatarUrl: "https://example.com/a.jpg", phoneNumber: "111" };
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    assert.equal(new Headers(init.headers).get("Authorization"), `Bearer ${values.get("ts_access_token")}`);
    if (init.method === "PATCH") account = { ...account, ...JSON.parse(init.body) };
    if (url.endsWith("/avatar")) {
      assert.ok(init.body instanceof FormData); assert.equal(new Headers(init.headers).get("Content-Type"), null);
      const encoded = await convertFormDataAsync(init.body, "test-boundary");
      const bytes = Buffer.from(encoded.body);
      assert.ok(bytes.includes(Buffer.from('name="file"; filename="profile.jpg"')));
      assert.ok(bytes.includes(Buffer.from("content-type: image/jpeg")));
      assert.ok(bytes.includes(Buffer.from([255, 216, 255, 217])));
      assert.ok(!bytes.includes(Buffer.from("file:///picked.jpg")));
      account.avatarUrl = "https://example.com/uploaded.jpg";
    }
    return response(account);
  };
  signIn(1); await repo.loadAccountProfile();
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, "https://example.com/a.jpg");
  await repo.updateAccountProfile({ fullName: "Renamed A" });
  assert.equal(repo.getProfileSnapshot().profile.fullName, "Renamed A");
  assert.equal(JSON.parse(calls.find(call => call.init.method === "PATCH").init.body).fullName, "Renamed A");
  await repo.updateAccountProfile({}, { uri: "file:///picked.jpg", name: "picked.jpg", type: "image/jpeg" });
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, "https://example.com/uploaded.jpg");
  const uploadCalls = calls.length;
  failPhotoRead = true;
  await assert.rejects(repo.updateAccountProfile({}, { uri: "file:///picked.jpg", name: "picked.jpg", type: "image/jpeg" }), /read or prepare/);
  failPhotoRead = false;
  assert.equal(calls.length, uploadCalls, "Local photo read errors never become network requests");
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, "https://example.com/uploaded.jpg");
  const workingFetch = global.fetch;
  global.fetch = async () => { throw new TypeError("Network request failed"); };
  await assert.rejects(repo.updateAccountProfile({}, { uri: "file:///picked.jpg", name: "picked.jpg", type: "image/jpeg" }), /Photo upload couldn't be confirmed/);
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, "https://example.com/uploaded.jpg");
  global.fetch = async (_url, init) => {
    if (init.method === "POST") return response({});
    throw new Error("Profile reload offline");
  };
  await assert.rejects(repo.updateAccountProfile({}, { uri: "file:///picked.jpg", name: "picked.jpg", type: "image/jpeg" }), /upload was accepted.*profile couldn't be loaded/);
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, "https://example.com/uploaded.jpg");
  global.fetch = workingFetch;
  const beforeLocalWrite = calls.length;
  await assert.rejects(repo.updateAccountProfile({ gender: "Other", dob: "2010/01/01" }), /not supported/);
  await assert.rejects(repo.updateAccountProfile({ fullName: "Mixed write", address: "Device-only address" }), /not supported/);
  assert.equal(calls.length, beforeLocalWrite);
  assert.equal(repo.getProfileSnapshot().profile.fullName, "Renamed A");
  const count = calls.length;
  await assert.rejects(repo.updateAccountProfile({ tallyTag: "fake-new-tag" }), /isn't supported/);
  assert.equal(calls.length, count);
  assert.equal(repo.getProfileSnapshot().profile.tallyTag, "accountA");
  const aScope = repo.getProfileSnapshot().scope;
  signIn(2);
  assert.equal(repo.getProfileSnapshot().profile.fullName, "");
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, null);
  account = { fullName: "Account B", tallyTag: "accountB", email: "2@example.com", avatarUrl: null };
  await repo.loadAccountProfile();
  assert.equal("nickname" in repo.getProfileSnapshot().profile, false);
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, null);
  await assert.rejects(repo.updateAccountProfile({ nickname: "stale A" }, undefined, aScope), /account changed/);
  signIn(1); global.fetch = async () => { throw new Error("offline"); };
  await repo.loadAccountProfile();
  assert.equal("nickname" in repo.getProfileSnapshot().profile, false);
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, "https://example.com/uploaded.jpg");
  assert.ok(repo.getProfileSnapshot().error);
  assert.equal(repo.getProfileSnapshot().profile.fullName, "Renamed A");
  assert.ok([...values.keys()].filter(key => key.startsWith("ts_account_profile_v1_")).length === 2);
  // A delayed authenticated response cannot populate another user's profile.
  let resolveOld, started;
  const ready = new Promise(resolve => { started = resolve; });
  global.fetch = () => { started(); return new Promise(resolve => { resolveOld = resolve; }); };
  const oldLoad = repo.loadAccountProfile(true); await ready;
  signIn(2); account = { fullName: "Account B", email: "2@example.com", avatarUrl: null };
  global.fetch = async () => response(account); await repo.loadAccountProfile();
  resolveOld(response({ fullName: "Stale A", avatarUrl: "https://example.com/stale.jpg" })); await oldLoad;
  assert.equal(repo.getProfileSnapshot().profile.fullName, "Account B");
  assert.equal(repo.getProfileSnapshot().profile.avatarUrl, null);
  // Reject unconfirmed saves and preserve the existing profile.
  global.fetch = async () => response({ message: "pending" }, 202);
  await assert.rejects(repo.updateAccountProfile({ fullName: "Unconfirmed" }));
  assert.equal(repo.getProfileSnapshot().profile.fullName, "Account B");
  let savedTokens, requestCalls = 0;
  const request = createProfileRequest({ token: "expired", refreshToken: "refresh", saveTokens: async (...tokens) => { savedTokens = tokens; } }, new AbortController().signal, async (url, init) => {
    if (url.endsWith("/refresh")) return response({ accessToken: "rotated", refreshToken: "next-refresh" });
    if (++requestCalls === 1) return response({}, 401);
    assert.equal(new Headers(init.headers).get("Authorization"), "Bearer rotated"); return response({ fullName: "Refreshed" });
  });
  await request("/api/users/me"); assert.deepEqual(savedTokens, ["rotated", "next-refresh"]);
  const pending = createProfileRequest({ token: "test", refreshToken: null, saveTokens: async () => {} }, new AbortController().signal, async () => response({ success: false }));
  await assert.rejects(pending("/api/users/me", { method: "PATCH" }), /hasn't confirmed/);
  // Duplicate saves are locked before any asynchronous work begins.
  let finishSave, saveStarted;
  const saveReady = new Promise(resolve => { saveStarted = resolve; });
  global.fetch = (url, init) => {
    if (init.method === "PATCH") { saveStarted(); return new Promise(resolve => { finishSave = resolve; }); }
    return Promise.resolve(response({ fullName: "Saved once", email: "2@example.com" }));
  };
  const saving = repo.updateAccountProfile({ fullName: "Saved once" }); await saveReady;
  await assert.rejects(repo.updateAccountProfile({ fullName: "Duplicate" }), /current profile change/);
  finishSave(response({})); await saving;
  repo.clearProfileSession(true); assert.equal(repo.getProfileSnapshot().profile.avatarUrl, null);
  // Logout blocks rehydration even while storage deletion is still in progress.
  await repo.loadAccountProfile(); assert.equal(repo.getProfileSnapshot().scope, null);
  console.log("Profile tests passed: account isolation, legacy exclusion, backend writes, multipart upload, refresh, failure states and stale response protection.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
