const { test } = require('node:test');
const assert = require('node:assert/strict');
const { careGreeting, helpTopics, supportMailUrl } = require('./care.ts');
const { requestHelpReply } = require('./api.ts');
test('support distinguishes coach messages from contacting a human', () => {
  assert.match(careGreeting, /saved in coach history/);
  assert.match(careGreeting, /does not contact a human/);
  assert.equal(helpTopics.length, 5);
  const url = new URL(supportMailUrl());
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'tallyspends@gmail.com');
  assert.match(url.searchParams.get('body'), /Do not include passwords/);
});
test('help sends the question to the authenticated chat service and displays its reply', async () => {
  const result = await requestHelpReply(' How do budgets work? ', async (path, init) => {
    assert.equal(path, '/api/chat'); assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { message: 'How do budgets work?' });
    return { status: 200, data: { assistantMessage: { content: 'A reply from the service' } } };
  });
  assert.equal(result, 'A reply from the service');
});
test('help failures never fabricate replies or tickets', async () => {
  for (const response of [{ status: 503, data: {} }, { status: 200, data: {} }, { status: 200, data: { assistantMessage: { content: '' } } }]) await assert.rejects(requestHelpReply('Help', async () => response));
  await assert.rejects(requestHelpReply('Help', async () => { throw new Error('Offline'); }), /Offline/);
  await assert.rejects(requestHelpReply('', async () => assert.fail('must not request')));
});
