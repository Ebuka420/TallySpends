const { test } = require("node:test");
const assert = require("node:assert/strict");
const { actionOffset, hoveredAction, COACH_BUTTON } = require("./menu.ts");
const { requestCoachReply } = require("./chat.ts");

test("fan selection follows the displayed buttons at all four screen edges", () => {
  for (const right of [true, false]) for (const down of [true, false]) {
    for (let index = 0; index < 4; index++) {
      const point = actionOffset(index, right, down);
      assert.equal(hoveredAction(point.x, point.y, right, down), index);
      assert.equal(hoveredAction(point.x + 9, point.y - 9, right, down), index);
    }
  }
});
test("returning to the anchor or dragging away cancels selection", () => {
  for (const right of [true, false]) for (const down of [true, false]) {
    for (const [x, y] of [[0, 0], [15, 15], [500, 500], [-500, -500]]) assert.equal(hoveredAction(x, y, right, down), -1);
  }
});
test("the fan stays inside a small portrait screen when docked at either edge", () => {
  const width = 320, height = 568;
  for (const right of [true, false]) for (const down of [true, false]) {
    const anchorX = right ? width - COACH_BUTTON - 20 : 20;
    const anchorY = down ? 70 : height - COACH_BUTTON - 110;
    for (let index = 0; index < 4; index++) {
      const point = actionOffset(index, right, down);
      const centerX = anchorX + COACH_BUTTON / 2 + point.x;
      const centerY = anchorY + COACH_BUTTON / 2 + point.y;
      assert.ok(centerX - 31 > 0 && centerX + 31 < width);
      assert.ok(centerY - 31 > 20 && centerY + 31 < height - 20);
    }
  }
});
test("chat keeps the existing API contract and returns only a valid reply", async () => {
  const signal = new AbortController().signal;
  const reply = await requestCoachReply("Help with a budget", "test-token", signal, async (url, options) => {
    assert.equal(url, "https://tallyspendapi-production.up.railway.app/api/chat");
    assert.deepEqual(JSON.parse(options.body), { message: "Help with a budget" });
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => ({ assistantMessage: { content: " A useful reply " } }) };
  });
  assert.equal(reply, "A useful reply");
});
test("missing authentication, server failures and empty replies stay retryable errors", async () => {
  const signal = new AbortController().signal;
  await assert.rejects(requestCoachReply("Question", null, signal, () => { throw Error("Must not call the API"); }), /Sign in again/);
  await assert.rejects(requestCoachReply("Question", "test", signal, async () => ({ ok: false, status: 401 })), /session has expired/);
  await assert.rejects(requestCoachReply("Question", "test", signal, async () => ({ ok: false, status: 500 })), /couldn't connect/);
  await assert.rejects(requestCoachReply("Question", "test", signal, async () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid response"); } })), /couldn't finish/);
  for (const data of [null, {}, { assistantMessage: { content: " " } }, { assistantMessage: { content: {} } }]) {
    await assert.rejects(requestCoachReply("Question", "test", signal, async () => ({ ok: true, json: async () => data })), /couldn't finish/);
  }
});
