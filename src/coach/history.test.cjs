const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const values = new Map();
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === '@react-native-async-storage/async-storage') return {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
  };
  return originalLoad.call(this, name, ...args);
};
const h = require('./history.ts');
Module._load = originalLoad;
const message = (id, sender, text) => ({ id, sender, text });
test('history persists complete replies, isolates accounts, and deletes only the requested chat', async () => {
  const chat = h.newConversation();
  chat.messages.push(message('u', 'user', 'Budget question'));
  const first = h.saveCoachConversation('alice', chat);
  const completed = { ...chat, messages: [...chat.messages, message('c', 'coach', 'Budget reply')] };
  const second = h.saveCoachConversation('alice', completed);
  await Promise.all([first, second]);
  assert.deepEqual(await h.loadCoachHistory('alice'), [completed]);
  assert.deepEqual(await h.loadCoachHistory('bob'), []);
  await h.deleteCoachConversation('bob', chat.id);
  assert.equal((await h.loadCoachHistory('alice')).length, 1);
  await h.deleteCoachConversation('alice', chat.id);
  assert.deepEqual(await h.loadCoachHistory('alice'), []);
});
test('memory is explicit, separate from history, scoped to the account, and removable', async () => {
  const fact = { id: 'f', category: 'Savings', text: 'Save for school', extra: 'not persisted' };
  await h.saveCoachMemory('alice', [fact]);
  assert.deepEqual(await h.loadCoachMemory('alice'), [{ id: 'f', category: 'Savings', text: 'Save for school' }]);
  assert.deepEqual(await h.loadCoachMemory('bob'), []);
  assert.deepEqual(await h.loadCoachHistory('alice'), []);
  await h.saveCoachMemory('alice', []);
  assert.deepEqual(await h.loadCoachMemory('alice'), []);
});
test('current question includes saved memory and ordered recent conversation without inventing API fields', () => {
  const output = h.coachQuestionWithContext('What next?', [{ id: 'f', category: 'Savings', text: 'Laptop goal' }], [message('u', 'user', 'I save monthly'), message('c', 'coach', 'Set a target')]);
  assert.match(output, /\[Savings\] Laptop goal/);
  assert.ok(output.indexOf('User: I save monthly') < output.indexOf('Coach: Set a target'));
  assert.ok(output.endsWith('Current question:\nWhat next?'));
  assert.equal(h.coachQuestionWithContext('Hello', [], []), 'Hello');
});
test('context stays within the message limit and preserves the entire current question', () => {
  const facts = Array.from({ length: 20 }, (_, i) => ({ id: String(i), category: 'Context', text: 'x'.repeat(300) }));
  const previous = Array.from({ length: 30 }, (_, i) => message(String(i), 'user', 'y'.repeat(100)));
  for (const size of [1, 300, 1500, 1900, 2000]) {
    const question = 'q'.repeat(size);
    const result = h.coachQuestionWithContext(question, facts, previous);
    assert.ok(result.length <= 2000);
    assert.ok(result.endsWith(question));
  }
});
test('authenticated chat sends both memory and previous messages through the existing message field', async () => {
  const { requestCoachReply } = require('./chat.ts');
  const prompt = h.coachQuestionWithContext('Continue my plan', [{ id: 'f', category: 'Budget', text: 'Weekly budget' }], [message('u', 'user', 'My earlier question')]);
  const reply = await requestCoachReply(prompt, 'test-token', new AbortController().signal, async (url, options) => {
    assert.ok(url.endsWith('/api/chat'));
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.deepEqual(Object.keys(JSON.parse(options.body)), ['message']);
    assert.match(JSON.parse(options.body).message, /Weekly budget/);
    assert.match(JSON.parse(options.body).message, /My earlier question/);
    return { ok: true, json: async () => ({ assistantMessage: { content: 'Plan continued' } }) };
  });
  assert.equal(reply, 'Plan continued');
});
test('malformed storage is reported instead of replaced with fake empty history', async () => {
  values.set('ts_coach_history_v1_corrupt', '{broken');
  await assert.rejects(h.loadCoachHistory('corrupt'), /Couldn't read/);
  await assert.rejects(h.saveCoachConversation('corrupt', h.newConversation()), /Couldn't read/);
  assert.equal(values.get('ts_coach_history_v1_corrupt'), '{broken');
});
