const { test } = require('node:test');
const assert = require('node:assert/strict');
const { registerSession, recoverLocalSession } = require('./register.ts');
const { API_URL } = require('./api.ts');
const signup = { fullName: 'Test User', email: 'test@example.com', password: 'test-password', tallyTag: 'testuser', phoneNumber: '00000000000' };

test('older local accounts obtain a backend session only after matching their credentials', async () => {
  const send = async () => ({ ok: true, json: async () => ({ accessToken: 'access' }) });
  for (const identifier of [signup.email, signup.tallyTag]) {
    const recovered = await recoverLocalSession(identifier, signup.password, [signup], send);
    assert.equal(recovered.accessToken, 'access');
    assert.equal(recovered.email, signup.email);
    assert.equal(recovered.password, undefined);
  }
  const noRequest = () => { throw new Error('Must not contact backend'); };
  assert.equal(await recoverLocalSession(signup.email, 'wrong-password', [signup], noRequest), null);
  assert.equal(await recoverLocalSession('unknown', signup.password, [signup], noRequest), null);
});

test('registration obtains backend tokens before completing signup', async () => {
  let calls = 0;
  const session = await registerSession(signup, async (url, options) => {
    calls++;
    assert.equal(url, `${API_URL}/api/auth/register`);
    assert.deepEqual(JSON.parse(options.body), signup);
    return { ok: true, json: async () => ({ accessToken: 'access', refreshToken: 'refresh', userId: 1 }) };
  });
  assert.equal(calls, 1);
  assert.deepEqual(session, { accessToken: 'access', refreshToken: 'refresh', userId: 1 });
});

test('registration without tokens logs in using the backend contract', async () => {
  for (const status of [200, 409]) {
    const calls = [];
    const session = await registerSession(signup, async (url, options) => {
      calls.push(url);
      if (url.endsWith('/register')) return { ok: status === 200, status, json: async () => ({}) };
      assert.deepEqual(JSON.parse(options.body), { emailOrTallyTag: signup.email, password: signup.password });
      return { ok: true, json: async () => ({ accessToken: 'access' }) };
    });
    assert.deepEqual(calls, [`${API_URL}/api/auth/register`, `${API_URL}/api/auth/login`]);
    assert.equal(session.accessToken, 'access');
  }
});

test('registration failure and missing login tokens never return a successful session', async () => {
  await assert.rejects(registerSession(signup, async () => ({ ok: false, status: 400, json: async () => ({ message: 'Invalid signup' }) })), /Invalid signup/);
  await assert.rejects(registerSession(signup, async () => ({ ok: true, json: async () => ({}) })), /did not return a session/);
  await assert.rejects(registerSession(signup, async () => { throw new Error('Network unavailable'); }), /Network unavailable/);
});
