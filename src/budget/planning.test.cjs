const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createWallet,
  totals,
  reservedSavings,
  reservedAjo,
  applyBudgetCommand,
  upsertTransaction,
  removeTransaction,
  validateWallet,
} = require("./ledger.ts");
const {
  applyPlanCommand,
  tallyTag,
  advanceDate,
  migrateAjoTracking,
} = require("./test-planning-loader.cjs");
const now = "2026-09-19T12:00:00.000Z";
const run = (wallet, command, id, date = now) =>
  applyPlanCommand(wallet, command, id, date);
const personal = (extra = {}) => ({
  type: "create-savings",
  name: "Laptop",
  kind: "personal",
  target: 100000,
  initial: 0,
  unlockDate: "2026-10-01",
  owner: "@EBUKA",
  tags: [],
  ...extra,
});
const ajo = (extra = {}) => ({
  type: "create-ajo",
  name: "Friends",
  amount: 10000,
  frequency: "monthly",
  firstDate: "2026-09-19",
  owner: "ebuka",
  tags: ["@ADA", "obi"],
  ...extra,
});
const accept = (wallet, kind, id, tag) =>
  run(
    wallet,
    kind === "ajo"
      ? { type: "record-membership", id, tag, response: "accepted" }
      : { type: "demo-response", kind, id, tag, response: "accepted" },
    `accept-${id}-${tag}`,
  );
const circleReady = () =>
  accept(
    accept(run(createWallet([]), ajo(), "circle"), "ajo", "circle", "ada"),
    "ajo",
    "circle",
    "obi",
  );

test("TallyTags normalize and reject invalid usernames", () => {
  assert.equal(tallyTag(" @Ada_12 "), "ada_12");
  for (const tag of ["", "ab", "@@ada", "two people", "!name", "x".repeat(31)])
    assert.throws(() => tallyTag(tag), /TallyTag/);
});
test("joint goals require unique, non-self participant TallyTags", () => {
  for (const tags of [[], ["EBUKA"], ["ada", "@ADA"], ["hi"]])
    assert.throws(() =>
      run(createWallet([]), personal({ kind: "joint", tags }), "joint"),
    );
  const wallet = run(
    createWallet([]),
    personal({ kind: "joint", tags: ["@Ada"] }),
    "joint",
  );
  assert.equal(wallet.savings[0].participants[1].status, "invited");
  assert.equal(wallet.savings[0].participants[1].tag, "ada");
});
test("savings reserve money without changing wallet cash and cannot overspend", () => {
  const before = createWallet([]);
  const wallet = run(before, personal({ initial: 10000 }), "savings");
  assert.equal(totals(wallet).balance, totals(before).balance);
  assert.equal(totals(wallet).available, totals(before).available - 10000);
  assert.equal(reservedSavings(wallet), 10000);
  assert.equal(before.savings, undefined);
  assert.throws(
    () => run(wallet, { type: "save", id: "savings", amount: 100000 }, "more"),
    /more than/,
  );
  assert.throws(
    () =>
      run(wallet, personal({ target: 900000, initial: 900000 }), "too-much"),
    /Insufficient/,
  );
});
test("savings add is idempotent and enforces unlock date including archive", () => {
  let wallet = run(createWallet([]), personal(), "savings");
  const command = { type: "save", id: "savings", amount: 20000 };
  wallet = run(wallet, command, "save");
  assert.equal(run(wallet, command, "save"), wallet);
  for (const type of ["release-savings", "archive-savings"])
    assert.throws(
      () => run(wallet, { type, id: "savings" }, type),
      /locked until/,
    );
  wallet = run(
    wallet,
    { type: "release-savings", id: "savings" },
    "release",
    "2026-10-01T12:00:00.000Z",
  );
  assert.equal(wallet.savings[0].status, "completed");
  assert.equal(wallet.savings[0].saved, 0);
  assert.equal(totals(wallet).available, totals(createWallet([])).available);
  assert.throws(
    () =>
      run(wallet, { type: "release-savings", id: "savings" }, "release-again"),
    /no saved money/,
  );
});
test("an unfunded goal can be archived before its unlock date", () => {
  const wallet = run(
    run(createWallet([]), personal(), "savings"),
    { type: "archive-savings", id: "savings" },
    "archive",
  );
  assert.equal(wallet.savings[0].status, "archived");
  assert.throws(
    () => run(wallet, { type: "save", id: "savings", amount: 100 }, "save"),
    /no longer active/,
  );
});
test("joint savings wait for all acceptances and reject contributions after decline", () => {
  let wallet = run(
    createWallet([]),
    personal({ kind: "joint", tags: ["ada", "obi"] }),
    "joint",
  );
  const command = { type: "save", id: "joint", amount: 1000 };
  assert.throws(() => run(wallet, command, "save"), /Everyone/);
  wallet = accept(wallet, "savings", "joint", "ada");
  assert.throws(() => run(wallet, command, "save"), /Everyone/);
  const declined = run(
    wallet,
    {
      type: "demo-response",
      kind: "savings",
      id: "joint",
      tag: "obi",
      response: "declined",
    },
    "decline",
  );
  assert.throws(() => run(declined, command, "save"), /Everyone/);
  assert.throws(
    () => accept(declined, "savings", "joint", "obi"),
    /already been answered/,
  );
  wallet = accept(wallet, "savings", "joint", "obi");
  assert.equal(run(wallet, command, "save").savings[0].saved, 1000);
});
test("joint creation cannot bypass invitations by supplying initial money", () => {
  assert.throws(
    () =>
      run(
        createWallet([]),
        personal({ kind: "joint", tags: ["ada"], initial: 100 }),
        "joint",
      ),
    /Wait for all/,
  );
});

const contribute = (wallet, tag, id = tag, extra = {}) =>
  run(
    wallet,
    {
      type: "record-ajo-contribution",
      id: "circle",
      tag,
      paidOn: "2026-09-19",
      ...extra,
    },
    id,
  );
const payout = (wallet, id = "payout", extra = {}) =>
  run(
    wallet,
    { type: "record-ajo-payout", id: "circle", paidOn: "2026-09-19", ...extra },
    id,
  );
test("Ajo requires two others and valid dates, frequency and amounts", () => {
  for (const extra of [
    { tags: ["ada"] },
    { tags: ["ada", "ADA"] },
    { firstDate: "2026-09-18" },
    { firstDate: "2026-02-30" },
    { amount: 0 },
    { amount: 2.5 },
    { frequency: "daily" },
  ])
    assert.throws(() => run(createWallet([]), ajo(extra), "circle"));
});
test("Ajo waits for member agreement and never reserves wallet money", () => {
  const wallet = run(createWallet([]), ajo(), "circle");
  assert.equal(wallet.circles[0].trackingMode, "external");
  assert.equal(reservedAjo(wallet), 0);
  assert.equal(totals(wallet).available, totals(createWallet([])).available);
  assert.throws(() => contribute(wallet, "ebuka"), /agreement/);
});
test("external contributions work with zero wallet balance and leave budgets and savings unchanged", () => {
  const original = circleReady();
  original.openingBalance = 0;
  const wallet = contribute(original, "ebuka");
  assert.deepEqual(totals(wallet), totals(original));
  assert.equal(wallet.transactions.length, 0);
  assert.equal(reservedAjo(wallet), 0);
  assert.equal(wallet.circles[0].contributions.length, 1);
  assert.throws(() => contribute(wallet, "ebuka", "again"), /already recorded/);
});
test("payment records validate date, member and duplicate references", () => {
  const wallet = circleReady();
  assert.throws(() => contribute(wallet, "outsider"), /member/);
  assert.throws(
    () => contribute(wallet, "ada", "future", { paidOn: "2026-09-20" }),
    /later than today/,
  );
  assert.throws(
    () => contribute(wallet, "ada", "invalid", { paidOn: "2026-02-30" }),
    /date paid/,
  );
  const recorded = contribute(wallet, "ada", "first", { reference: "REF-101" });
  assert.throws(
    () => contribute(recorded, "obi", "second", { reference: "REF-101" }),
    /already recorded/,
  );
  assert.equal(
    contribute(recorded, "ada", "first", { reference: "REF-101" }),
    recorded,
  );
});
test("corrections retain history and cannot change already-settled rounds", () => {
  let wallet = contribute(circleReady(), "ada", "wrong");
  wallet = run(
    wallet,
    { type: "undo-ajo-contribution", id: "circle", tag: "ada" },
    "correct",
  );
  assert.equal(wallet.circles[0].contributions.length, 1);
  assert.ok(wallet.circles[0].contributions[0].voidedAt);
  assert.equal(
    wallet.circles[0].activity.at(-1).type,
    "contribution-corrected",
  );
  wallet = contribute(wallet, "ada", "correct-payment");
  wallet = contribute(contribute(wallet, "ebuka"), "obi");
  validateWallet(wallet);
  wallet = payout(wallet);
  assert.throws(
    () =>
      run(
        wallet,
        { type: "undo-ajo-contribution", id: "circle", tag: "ada" },
        "too-late",
      ),
    /No contribution/,
  );
  assert.equal(wallet.circles[0].payouts.length, 1);
});
test("payouts require every contribution and cannot precede payment dates", () => {
  let wallet = contribute(circleReady(), "ada");
  assert.throws(() => payout(wallet), /every member/);
  wallet = contribute(contribute(wallet, "ebuka"), "obi");
  assert.throws(
    () => payout(wallet, "early", { paidOn: "2026-09-18" }),
    /before the contributions/,
  );
});
test("full Ajo cycle tracks each payout once and never creates wallet transactions", () => {
  let wallet = circleReady();
  const original = totals(wallet);
  for (let round = 0; round < 3; round++) {
    for (const tag of ["ebuka", "ada", "obi"])
      wallet = contribute(wallet, tag, `${tag}-${round}`);
    wallet = payout(wallet, `payout-${round}`);
    assert.equal(payout(wallet, `payout-${round}`), wallet);
    assert.equal(
      wallet.circles[0].payouts[round].tag,
      ["ebuka", "ada", "obi"][round],
    );
    assert.deepEqual(totals(wallet), original);
    assert.equal(wallet.transactions.length, 0);
    validateWallet(JSON.parse(JSON.stringify(wallet)));
  }
  assert.equal(wallet.circles[0].status, "completed");
  assert.throws(() => contribute(wallet, "ada", "late"), /complete/);
  wallet = run(wallet, { type: "archive-ajo", id: "circle" }, "archive");
  assert.equal(wallet.circles[0].status, "archived");
});
test("recorded obligations cannot be hidden by archiving an unfinished circle", () => {
  const wallet = contribute(circleReady(), "ada");
  assert.throws(
    () => run(wallet, { type: "archive-ajo", id: "circle" }, "archive"),
    /Finish every round/,
  );
});
test("legacy migration releases only outstanding reservations, retains demo transactions and is idempotent", () => {
  let wallet = circleReady();
  delete wallet.circles[0].trackingMode;
  wallet.circles[0].contributions.push({
    round: 0,
    tag: "ebuka",
    amount: 10000,
    date: now,
  });
  wallet.transactions.push({
    id: "old-demo",
    planId: "circle",
    title: "Previous demo entry",
    type: "income",
    category: "Ajo",
    amount: 200,
    date: now,
  });
  const balance = totals(wallet).balance;
  const available = totals(wallet).available;
  const migrated = migrateAjoTracking(wallet, now);
  assert.equal(migrated.circles[0].trackingMode, "legacy-demo");
  assert.equal(totals(migrated).balance, balance);
  assert.equal(totals(migrated).available, available + 10000);
  assert.equal(migrated.transactions[0].id, "old-demo");
  assert.equal(migrated.circles[0].contributions.length, 1);
  assert.equal(wallet.circles[0].trackingMode, undefined);
  assert.equal(migrateAjoTracking(migrated, now), migrated);
  assert.throws(() => contribute(migrated, "ada"), /read-only/);
  assert.throws(
    () => removeTransaction(migrated, "old-demo"),
    /cannot be deleted/,
  );
});
test("member snapshots retain public identity but not arbitrary profile data", () => {
  const wallet = run(
    createWallet([]),
    ajo({
      profiles: [
        {
          tag: "ada",
          displayName: "Ada Obi",
          avatarUri: "https://example.com/ada.jpg",
          userId: "12",
          password: "must-not-copy",
        },
      ],
    }),
    "circle",
  );
  assert.equal(
    wallet.circles[0].participants[1].avatarUri,
    "https://example.com/ada.jpg",
  );
  assert.equal(wallet.circles[0].participants[1].displayName, "Ada Obi");
  assert.equal(wallet.circles[0].participants[1].password, undefined);
});
test("invalid circle mode and duplicate active payment records are rejected on load", () => {
  let wallet = circleReady();
  wallet.circles[0].trackingMode = "unknown";
  assert.throws(() => validateWallet(wallet), /circle balances/);
  wallet = contribute(circleReady(), "ada");
  wallet.circles[0].contributions.push(wallet.circles[0].contributions[0]);
  assert.throws(() => validateWallet(wallet), /contributions need review/);
});
test("period advancement handles month ends, leap years and weekly transitions", () => {
  assert.equal(advanceDate("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(advanceDate("2028-01-31", "monthly"), "2028-02-29");
  assert.equal(advanceDate("2026-02-28", "monthly", 31), "2026-03-31");
  assert.equal(advanceDate("2026-12-28", "weekly"), "2027-01-04");
  assert.equal(advanceDate("2026-12-28", "biweekly"), "2027-01-11");
});
