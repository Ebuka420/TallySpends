const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const vault = new Map(); const ordinary = new Map();
let available = true; let writesFail = false;
const original = Module._load;
Module._load = function(name, ...args) {
  if (name === 'expo-secure-store') return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1, isAvailableAsync: async () => available,
    getItemAsync: async key => vault.get(key) ?? null,
    setItemAsync: async (key, value) => { if (writesFail) throw new Error('Device write failed'); vault.set(key, value); },
    deleteItemAsync: async key => { vault.delete(key); },
  };
  if (name === 'expo-crypto') return { CryptoDigestAlgorithm: { SHA256: 'sha256' }, digestStringAsync: async (_, value) => crypto.createHash('sha256').update(value).digest('hex'), getRandomBytesAsync: async size => crypto.randomBytes(size) };
  if (name === '@react-native-async-storage/async-storage') return { getItem: async key => ordinary.get(key) ?? null, removeItem: async key => ordinary.delete(key) };
  if (name === 'expo-constants') return { __esModule: true, default: { executionEnvironment: 'storeClient' }, ExecutionEnvironment: { StoreClient: 'storeClient' } };
  if (name === 'react-native') return { Platform: { OS: 'ios' } };
  return original.call(this, name, ...args);
};
const pin = require('./pin.ts'); const api = require('./api.ts'); const signup = require('./signup.ts');
const { createConfirmation } = require('./confirmation.ts');
const { createAwayPolicy } = require('./away.ts');
const { biometricBuildIssue, BIOMETRIC_BUILD_ISSUE } = require('./biometrics.ts');
Module._load = original;
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
test('Face ID availability distinguishes iPhone Expo Go from installed native builds', () => {
  assert.match(BIOMETRIC_BUILD_ISSUE, /Expo Go/);
  assert.match(biometricBuildIssue('ios', true), /PIN still works/);
  assert.equal(biometricBuildIssue('ios', false), null);
  assert.equal(biometricBuildIssue('android', true), null);
  assert.match(biometricBuildIssue('web', false), /iPhone and Android/);
});
test('ordinary app switching preserves access below one minute and locks at exactly one minute', () => {
  const policy = createAwayPolicy();
  policy.leave(1000, 500); policy.leave(2000, 1500);
  assert.equal(policy.resume(60999, 60499, { supported: true, screenOff: false }), false);
  assert.equal(policy.away, false);
  policy.leave(70000, 70000);
  assert.equal(policy.resume(130000, 130000, { supported: true, screenOff: false }), true);
});
test('screen-off forces immediate locking even during a short absence', () => {
  const policy = createAwayPolicy(); policy.leave(1000, 1000);
  assert.equal(policy.resume(1100, 1100, { supported: true, screenOff: true }), true);
  assert.equal(policy.resume(1200, 1200, { supported: true, screenOff: true }), true);
});
test('suspended timers, clock changes and unavailable native monitors cannot bypass locking', () => {
  const policy = createAwayPolicy();
  policy.leave(1000, 1000); assert.equal(policy.resume(61000, 1100, { supported: true, screenOff: false }), true);
  policy.leave(1000, 1000); assert.equal(policy.resume(2000, 61000, { supported: true, screenOff: false }), true);
  policy.leave(1000, 1000); assert.equal(policy.resume(999, 1100, { supported: true, screenOff: false }), true);
  policy.leave(1000, 1000); assert.equal(policy.resume(1001, 1001, { supported: false, screenOff: false }), true);
  policy.leave(1000, 1000); policy.clear(); assert.equal(policy.away, false);
});
test('cancelled or replayed biometric callbacks cannot authorize a different confirmation', async () => {
  const confirmation = createConfirmation();
  const first = confirmation.begin(); const old = confirmation.challenge;
  assert.throws(() => confirmation.begin(), /current confirmation/);
  confirmation.cancel(); assert.equal(await first, false);
  const second = confirmation.begin(); const current = confirmation.challenge;
  assert.notEqual(current, old);
  assert.equal(confirmation.complete(old), false);
  assert.equal(confirmation.active, true);
  assert.equal(confirmation.complete(current), true); assert.equal(await second, true);
  assert.equal(confirmation.complete(current), false);
  const third = confirmation.begin(); confirmation.cancel(); assert.equal(await third, false);
});
test('PIN setup requires six digits, persists a salted verifier only, and isolates accounts', async () => {
  await assert.rejects(pin.createPin('alice', '12345'), /six digits/);
  await pin.createPin('alice', '813625');
  assert.equal(await pin.readPin('bob'), null);
  assert.equal(ordinary.size, 0);
  assert.ok(!JSON.stringify([...vault]).includes('813625'));
  await pin.verifyPin('alice', '813625');
  await pin.createPin('bob', '813625');
  assert.notEqual((await pin.readPin('alice')).digest, (await pin.readPin('bob')).digest);
});
test('failed PIN attempts persist and block even a correct PIN during cooldown', async () => {
  await pin.createPin('limited', '259136');
  for (let i = 0; i < 5; i++) await assert.rejects(pin.verifyPin('limited', '000000', 1000), /Incorrect|Too many/);
  assert.equal((await pin.readPin('limited')).failures, 5);
  await assert.rejects(pin.verifyPin('limited', '259136', 1001), /30 seconds/);
  await pin.verifyPin('limited', '259136', 31001);
  assert.equal((await pin.readPin('limited')).failures, 0);
});
test('concurrent PIN checks cannot bypass the retry counter', async () => {
  await pin.createPin('parallel', '829461');
  const outcomes = await Promise.allSettled([pin.verifyPin('parallel', '000000'), pin.verifyPin('parallel', '000000')]);
  assert.ok(outcomes.every(result => result.status === 'rejected'));
  assert.equal((await pin.readPin('parallel')).failures, 1);
});
test('onboarding binds the PIN to the server account and removes its email staging key', async () => {
  await pin.createPin('email:new@example.com', '729164');
  await pin.migrateOnboardingPin('new@example.com', 'id:55');
  assert.equal(await pin.readPin('email:new@example.com'), null);
  await pin.verifyPin('id:55', '729164');
  await pin.migrateOnboardingPin('new@example.com', 'id:55');
});
test('Forgot PIN requires successful backend login for the same account', async () => {
  const signal = new AbortController().signal;
  let sent;
  const good = await api.verifyAccountPassword('id:7', 'test@example.com', 'entered password', signal, async (url, options) => {
    assert.ok(url.endsWith('/api/auth/login')); sent = JSON.parse(options.body);
    return response(200, { userId: 7, accessToken: 'test-only-token', refreshToken: 'test-only-refresh' });
  });
  assert.deepEqual(sent, { emailOrTallyTag: 'test@example.com', password: 'entered password' });
  assert.equal(good.token, 'test-only-token');
  await assert.rejects(api.verifyAccountPassword('id:7', 'user', 'password', signal, async () => response(200, { userId: 8, accessToken: 'other-token' })), /this account/);
  await assert.rejects(api.verifyAccountPassword('id:7', 'user', 'password', signal, async () => response(401, {})), /could not be verified/);
  await assert.rejects(api.verifyAccountPassword('id:7', 'user', 'password', signal, async () => response(200, { userId: 7 })), /this account/);
  await api.verifyAccountPassword('email:test@example.com', 'test@example.com', 'password', signal, async () => response(200, { userId: 7, email: 'test@example.com', accessToken: 'test-token' }));
});
test('password change uses the authenticated production contract and rejects server failures', async () => {
  const signal = new AbortController().signal;
  await api.changePassword('test-token', 'old', 'new strong password', signal, async (url, options) => {
    assert.ok(url.endsWith('/api/auth/change-password'));
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(options.body), { currentPassword: 'old', newPassword: 'new strong password' });
    return response(200, {});
  });
  await assert.rejects(api.changePassword('test-token', 'old', 'new', signal, async () => response(400, {})), /rejected/);
});
test('password changes refresh an expired session once and never treat pending as completed', async () => {
  let requests = 0; let refreshed = 0; let saved;
  const send = async (url, options) => {
    if (url.endsWith('/api/auth/refresh')) { refreshed++; return response(200, { accessToken: 'fresh-token', refreshToken: 'fresh-refresh' }); }
    requests++;
    assert.equal(options.headers.Authorization, 'Bearer ' + (requests === 1 ? 'expired-token' : 'fresh-token'));
    return response(requests === 1 ? 401 : 200, {});
  };
  await api.changePassword('expired-token', 'old', 'new', new AbortController().signal, send, { refreshToken: 'old-refresh', saveTokens: async (...tokens) => { saved = tokens; } });
  assert.equal(requests, 2); assert.equal(refreshed, 1); assert.deepEqual(saved, ['fresh-token', 'fresh-refresh']);
  await assert.rejects(api.changePassword('token', 'old', 'new', new AbortController().signal, async () => response(202, {})), /hasn't confirmed/);
});
test('signup credentials migrate into secure storage and are cleared after onboarding', async () => {
  ordinary.set('ts_pending_signup', JSON.stringify({ email: 'new@example.com', password: 'signup-password' }));
  assert.equal((await signup.readPendingSignup()).password, 'signup-password');
  assert.equal(ordinary.has('ts_pending_signup'), false);
  await signup.clearPendingSignup();
  assert.equal(await signup.readPendingSignup(), null);
});
test('unsupported secure storage and failed writes do not silently create a PIN', async () => {
  available = false;
  await assert.rejects(pin.readPin('alice'), /unavailable/);
  available = true; writesFail = true;
  await assert.rejects(pin.createPin('failure', '936152'), /write failed/);
  writesFail = false;
  assert.equal(await pin.readPin('failure'), null);
});
