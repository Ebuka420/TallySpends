const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const ledger = require("./ledger.ts");
const people = require("./people.ts");
const { applyPlanCommand } = require("./test-planning-loader.cjs");
const compiled = ts.transpileModule(
  fs.readFileSync(require.resolve("./dashboard.ts"), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const loaded = { exports: {} };
vm.runInNewContext(compiled, {
  module: loaded,
  exports: loaded.exports,
  require: () => ledger,
});
const { planningCards } = loaded.exports;
const now = "2026-09-19T12:00:00Z";
const run = (wallet, command, id) => applyPlanCommand(wallet, command, id, now);
function sample() {
  let wallet = run(
    ledger.createWallet([]),
    {
      type: "create-ajo",
      name: "Friends",
      amount: 10000,
      frequency: "monthly",
      firstDate: "2026-09-19",
      owner: "ebuka",
      tags: ["ada", "obi"],
    },
    "circle",
  );
  wallet = run(
    wallet,
    {
      type: "create-savings",
      name: "Laptop",
      kind: "joint",
      initial: 0,
      target: 100000,
      unlockDate: "2026-10-01",
      owner: "ebuka",
      tags: ["ada"],
    },
    "goal",
  );
  return wallet;
}
test("dashboard starts empty rather than displaying fabricated savings and circle balances", () => {
  const cards = planningCards(ledger.createWallet([]));
  assert.equal(cards.ajo.length, 0);
  assert.equal(cards.joint.length, 0);
});
test("dashboard uses correct ids, next recipient, saved amount and unlock date", () => {
  const cards = planningCards(sample(), "2026-09-19");
  assert.equal(cards.ajo[0].id, "circle");
  assert.equal(cards.ajo[0].tag, "ebuka");
  assert.equal(cards.joint[0].id, "goal");
  assert.equal(cards.joint[0].tag, "ada");
  assert.equal(cards.joint[0].amount, ledger.money(0));
  assert.equal(cards.joint[0].date, "Unlocks 2026-10-01");
});
test("dashboard updates contributions and payout order, and ignores corrected records", () => {
  let wallet = sample();
  for (const tag of ["ada", "obi"])
    wallet = run(
      wallet,
      { type: "record-membership", id: "circle", tag, response: "accepted" },
      `accept-${tag}`,
    );
  for (const tag of ["ebuka", "ada", "obi"])
    wallet = run(
      wallet,
      {
        type: "record-ajo-contribution",
        id: "circle",
        tag,
        paidOn: "2026-09-19",
      },
      tag,
    );
  assert.equal(planningCards(wallet).ajo[0].progress, 100);
  wallet = run(
    wallet,
    { type: "undo-ajo-contribution", id: "circle", tag: "ada" },
    "undo",
  );
  assert.equal(planningCards(wallet).ajo[0].progress, 67);
  wallet = run(
    wallet,
    {
      type: "record-ajo-contribution",
      id: "circle",
      tag: "ada",
      paidOn: "2026-09-19",
    },
    "re-record",
  );
  wallet = run(
    wallet,
    { type: "record-ajo-payout", id: "circle", paidOn: "2026-09-19" },
    "payout",
  );
  assert.equal(planningCards(wallet).ajo[0].tag, "ada");
  assert.equal(planningCards(wallet).ajo[0].progress, 0);
});
test("archived, completed and legacy-demo plans do not remain as active carousel cards", () => {
  const wallet = sample();
  wallet.savings[0].status = "archived";
  wallet.circles[0].trackingMode = "legacy-demo";
  assert.equal(planningCards(wallet).joint.length, 0);
  assert.equal(planningCards(wallet).ajo.length, 0);
  wallet.circles[0].trackingMode = "external";
  wallet.circles[0].status = "completed";
  assert.equal(planningCards(wallet).ajo.length, 0);
});
test("profile projection excludes credentials and unsafe photo URLs", () => {
  const person = people.publicPerson({
    tallyTag: "@ADA",
    fullName: "Ada Obi",
    profileImage: "https://example.com/ada.jpg",
    password: "secret",
    email: "private@example.com",
  });
  assert.equal(person.tag, "ada");
  assert.equal(person.avatarUri, "https://example.com/ada.jpg");
  assert.equal(person.password, undefined);
  assert.equal(person.email, undefined);
  assert.equal(people.safePhoto("javascript:alert(1)"), undefined);
});
test("people search is case insensitive and preserves actual profile photos without inventing missing ones", () => {
  const directory = people.buildPeopleDirectory(
    null,
    [
      {
        tallyTag: "ada",
        fullName: "Ada Obi",
        profileImage: "https://example.com/ada.jpg",
      },
    ],
    { tag: "ebuka", displayName: "Ebuka" },
  );
  assert.equal(
    people.searchPeople(directory, "@ADA")[0].avatarUri,
    "https://example.com/ada.jpg",
  );
  assert.equal(people.searchPeople(directory, "obi")[0].tag, "ada");
  assert.equal(people.searchPeople(directory, "unknown").length, 0);
  assert.equal(
    directory.find((person) => person.tag === "ebuka").avatarUri,
    undefined,
  );
});
