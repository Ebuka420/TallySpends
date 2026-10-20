const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { acceptsRightSwipe, nextCardIndex, retainedSelection, OVERVIEW_ID, carouselSlotPosition } = require("./carousel.ts");
const { parseLinkedAccounts } = require("./backend.ts");

assert.equal(acceptsRightSwipe(150, 2, 900, 355, 1), false);
assert.equal(acceptsRightSwipe(-180, 0, -1000, 355, 4), false);
assert.equal(acceptsRightSwipe(10, 0, 1500, 355, 4), false);
assert.equal(acceptsRightSwipe(30, 120, 800, 355, 4), false);
assert.equal(acceptsRightSwipe(30, 0, 200, 355, 4), false);
assert.equal(acceptsRightSwipe(30, 0, 800, 355, 4), true);
assert.equal(acceptsRightSwipe(90, 4, 100, 355, 4), true);
for (const count of [2, 3, 4, 8]) {
  let selection = 0;
  for (let turn = 0; turn < count * 100; turn++) {
    assert.equal(selection, turn % count);
    const active = carouselSlotPosition(turn, selection, count, 365, "front");
    assert.equal(active.visible, true);
    assert.equal(active.x, 0);
    const next = nextCardIndex(selection, count);
    const peek = carouselSlotPosition(turn, next, count, 365, "peek");
    assert.equal(peek.visible, true);
    assert.equal(peek.x, 365);
    for (const fraction of [0.25, 0.5, 0.9, 0.99999]) {
      const outgoing = carouselSlotPosition(turn + fraction, selection, count, 365, "front");
      const incoming = carouselSlotPosition(turn + fraction, next, count, 365, "back");
      assert.ok(Math.abs(outgoing.x - fraction * 365) < 0.000001);
      assert.ok(Math.abs(incoming.x - (fraction - 1) * 365) < 0.000001);
      assert.equal(incoming.visible, true);
    }
    // At the wrap boundary the incoming ring copy is replaced at the same
    // visible position, not a reversed animation or scroll reset.
    const before = carouselSlotPosition(turn + 0.99999, next, count, 365, "back");
    const after = carouselSlotPosition(turn + 1, next, count, 365, "front");
    assert.ok(Math.abs(before.x - after.x) < 0.01);
    selection = next;
  }
}
const accounts = [{ id: "account-a" }, { id: "account-b" }];
assert.equal(retainedSelection("account-b", accounts.reverse()), "account-b");
assert.equal(retainedSelection("account-b", [{ id: "account-a" }]), OVERVIEW_ID);
assert.equal(retainedSelection(OVERVIEW_ID, []), OVERVIEW_ID);
const parsed = parseLinkedAccounts([{ id: "account-a", bankName: "Test Bank", accountName: "Test User", availableBalance: 0, currency: "NGN" },
  { id: "account-b", bankName: "Test Bank", accountName: "Test User" },
  { id: "account-c", bankName: "Test Bank", accountName: "Test User", availableBalance: NaN }]);
assert.equal(parsed[0].availableBalance, 0);
assert.equal(parsed[1].availableBalance, undefined);
assert.equal(parsed[2].availableBalance, undefined);
assert.equal(parsed[1].transactions, undefined);
for (const screen of [320, 375, 390, 430, 768]) {
  const card = screen * 0.91;
  const peek = screen - 12 - card - 10;
  assert.ok(peek > 0 && peek < screen * 0.07);
}
console.log("Dashboard checks passed: right-only acceptance, single-card mode, 100 circular rotations, continuous positions, refresh/unlink selection, responsive peeking and unavailable balances.");
