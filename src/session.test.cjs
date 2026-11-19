const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { storage, values } = require('./testStorage.cjs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const session = require('./session.ts');
const { createApiRequest } = require('./network.ts');
const response = (status, data) => new Response(JSON.stringify(data), { status });
const signal = () => new AbortController().signal;
beforeEach(async () => { await session.beginSession(); values.clear(); });
test('concurrent authenticated callers share exactly one refresh and persist both rotated tokens', async () => {
  let refreshes = 0; let requests = 0;
  const send = async (url, init) => {
    if (url.endsWith('/auth/refresh')) { refreshes++; await new Promise(resolve => setTimeout(resolve, 10)); return response(200, { accessToken: 'new', refreshToken: 'rotated' }); }
    requests++;
    return response(init.headers.get('Authorization') === 'Bearer new' ? 200 : 401, {});
  };
  const make = () => createApiRequest({ token: 'expired', refreshToken: 'old', saveTokens: async () => assert.equal(values.get('ts_refresh_token'), 'rotated') }, signal(), send);
  await Promise.all(Array.from({ length: 12 }, () => make()('/api/wallet/balance')));
  assert.equal(refreshes, 1); assert.equal(requests, 24);
  assert.equal(values.get('ts_access_token'), 'new');
  await make()('/api/wallet/balance'); assert.equal(refreshes, 1, 'late old-token requests use the rotated pair');
});
test('refresh 401 clears credentials, notifies once, and prevents all subsequent requests', async () => {
  values.set('ts_user', 'synthetic-user'); values.set('ts_access_token', 'old'); values.set('ts_refresh_token', 'old');
  let sends = 0; let expiredEvents = 0;
  const unsubscribe = session.subscribeSessionExpired(() => expiredEvents++);
  const send = async () => { sends++; return response(401, {}); };
  const client = createApiRequest({ token: 'old', refreshToken: 'old', saveTokens: async () => assert.fail() }, signal(), send);
  await assert.rejects(client('/api/wallet/balance'), session.SessionExpiredError);
  for (let i = 0; i < 10; i++) await assert.rejects(client('/api/wallet/balance'), session.SessionExpiredError);
  assert.equal(sends, 2); assert.equal(expiredEvents, 1); assert.equal(values.size, 0); unsubscribe();
});
test('one cancelled waiter does not cancel refresh for another screen', async () => {
  let release; const gate = new Promise(resolve => release = resolve);
  const first = new AbortController(); let sends = 0;
  const send = async () => { sends++; await gate; return response(200, { accessToken: 'a', refreshToken: 'r' }); };
  const a = session.refreshSession('old', first.signal, send);
  const b = session.refreshSession('old', signal(), send);
  first.abort(); await assert.rejects(a, /cancelled/); release();
  assert.deepEqual(await b, { token: 'a', refreshToken: 'r' }); assert.equal(sends, 1);
});
test('logout while refresh is saving cannot resurrect stored credentials', async () => {
  const original = storage.multiSet; let entered; let release;
  const begun = new Promise(resolve => entered = resolve); const blocked = new Promise(resolve => release = resolve);
  storage.multiSet = async pairs => { entered(); await blocked; await original(pairs); };
  try {
    const renewed = session.refreshSession('old', signal(), async () => response(200, { accessToken: 'a', refreshToken: 'r' }));
    await begun; const logout = session.expireSession(); release();
    await assert.rejects(renewed); await logout; assert.equal(values.size, 0);
  } finally { storage.multiSet = original; }
});
test('transient refresh failure keeps the session; explicit retry can renew', async () => {
  await assert.rejects(session.refreshSession('old', signal(), async () => response(503, {})));
  assert.equal(session.sessionHasExpired(), false);
  const result = await session.refreshSession('old', signal(), async () => response(200, { accessToken: 'a', refreshToken: 'r' }));
  assert.equal(result.token, 'a');
});
test('password rotation redirects delayed callers to the new pair', async () => {
  await session.refreshSession('old', signal(), async () => response(200, { accessToken: 'a', refreshToken: 'r' }));
  await session.replaceSessionTokens({ token: 'password-token', refreshToken: 'password-refresh' });
  const result = await session.refreshSession('old', signal(), async () => assert.fail('old refresh reused'));
  assert.equal(result.token, 'password-token');
  await session.saveSessionTokens({ token: 'a', refreshToken: 'r' });
  assert.equal(values.get('ts_access_token'), 'password-token');
});
test('missing access token renews once; a second resource 401 ends the session', async () => {
  let requests = 0;
  const client = createApiRequest({ token: null, refreshToken: 'old', saveTokens: async () => {} }, signal(), async url => {
    requests++; return url.endsWith('/auth/refresh') ? response(200, { accessToken: 'new', refreshToken: 'rotated' }) : response(401, {});
  });
  await assert.rejects(client('/api/wallet/balance')); assert.equal(session.sessionHasExpired(), true);
  assert.ok(requests <= 4);
});
