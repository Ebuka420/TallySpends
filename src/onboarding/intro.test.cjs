const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
function fresh(initial = {}, failRead = false, failWrite = false) {
  const values = new Map(Object.entries(initial));
  const original = Module._load;
  Module._load = function(name, ...args) {
    if (name === '@react-native-async-storage/async-storage') return {
      multiGet: async keys => { if (failRead) throw new Error('Storage error'); return keys.map(key => [key, values.get(key) ?? null]); },
      setItem: async (key, value) => { if (failWrite) throw new Error('Storage error'); values.set(key, value); },
    };
    return original.call(this, name, ...args);
  };
  delete require.cache[require.resolve('./intro.ts')];
  const intro = require('./intro.ts'); Module._load = original;
  return { intro, values };
}
test('first-time visitors see the introduction without changing account onboarding state', async () => {
  const { intro, values } = fresh(); await intro.hydrateIntro();
  assert.deepEqual(intro.getIntroSnapshot(), { ready: true, seen: false, error: '' });
  assert.equal(values.size, 0);
});
test('completed/skipped introduction survives reload and never repeats automatically', async () => {
  const first = fresh(); await first.intro.hydrateIntro(); await first.intro.completeIntro();
  assert.equal(first.values.get(first.intro.INTRO_KEY), '1');
  assert.equal(first.values.has('ts_onboarding_completed'), false);
  const second = fresh(Object.fromEntries(first.values)); await second.intro.hydrateIntro();
  assert.equal(second.intro.getIntroSnapshot().seen, true);
});
test('existing completed account setup bypasses the new product introduction', async () => {
  const { intro } = fresh({ ts_onboarding_completed: 'true' }); await intro.hydrateIntro();
  assert.equal(intro.getIntroSnapshot().seen, true);
});
test('failed persistence never pretends that the introduction was saved', async () => {
  const { intro } = fresh({}, false, true); await intro.hydrateIntro();
  await assert.rejects(intro.completeIntro(), /Couldn't save/);
  assert.equal(intro.getIntroSnapshot().seen, false);
});
test('read errors remain actionable and do not leave startup waiting forever', async () => {
  const { intro } = fresh({}, true); await intro.hydrateIntro();
  assert.equal(intro.getIntroSnapshot().ready, true);
  assert.match(intro.getIntroSnapshot().error, /Couldn't read/);
  await intro.completeIntro();
  assert.equal(intro.getIntroSnapshot().error, '');
});
test('both CTAs use the existing authentication route with the correct initial mode', () => {
  const { intro } = fresh();
  assert.deepEqual(intro.introAuthRoute('signup'), { pathname: '/auth', params: { mode: 'signup' } });
  assert.deepEqual(intro.introAuthRoute('login'), { pathname: '/auth', params: { mode: 'login' } });
  assert.equal(intro.INTRO_PAGES.length, 4);
});
