const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { spendingRhythm } = require("./rhythm.ts");
const { analyticsRange, analyticsReport } = require("./report.ts");
const tx = (date, type = "expense", amount = 10) => ({ id: date, title: "Test", date, type, amount, category: "Food" });
const selected = rows => analyticsReport(rows, analyticsRange("monthly", "Oct", new Date(2026, 9, 14, 12))).selected;

test("hourly rhythm counts selected expenses and leaves unused hours empty", () => {
  const rhythm = spendingRhythm(selected([
    tx("2026-10-01T13:00:00"), tx("2026-10-02T13:59:00"), tx("2026-10-02T23:00:00"),
    tx("2026-10-01T13:00:00", "income"), tx("2026-09-30T12:00:00"), tx("bad"), tx("2026-10-02", "expense", -10),
  ]));
  assert.equal(rhythm.hourly, true);
  assert.equal(rhythm.cells.length, 24);
  assert.equal(rhythm.cells[13].count, 2);
  assert.equal(rhythm.cells[13].intensity, 4);
  assert.equal(rhythm.cells[23].intensity, 2);
  assert.equal(rhythm.cells[12].intensity, 0);
  assert.match(rhythm.caption, /1 PM.*\(2\)/);
});
test("date-only and mixed records use weekdays without inventing times", () => {
  const rhythm = spendingRhythm(selected([tx("2026-10-05"), tx("2026-10-12T20:00:00"), tx("2026-10-06")]));
  assert.equal(rhythm.hourly, false);
  assert.equal(rhythm.cells[0].label, "Mon");
  assert.equal(rhythm.cells[0].count, 2);
  assert.equal(rhythm.cells[1].count, 1);
  assert.match(rhythm.note, /times are missing/);
});
test("empty and income-only periods show no expenses and no colored activity", () => {
  for (const rows of [[], [tx("2026-10-01T14:00:00", "income")]]) {
    const rhythm = spendingRhythm(selected(rows));
    assert.match(rhythm.caption, /No expenses/);
    assert.ok(rhythm.cells.every(cell => cell.intensity === 0));
    assert.equal(rhythm.note, null);
  }
});
test("ties are stated honestly and timezone offsets use the device's local hour", () => {
  const date = "2026-10-01T23:30:00Z";
  const rhythm = spendingRhythm(selected([tx(date)]));
  assert.equal(rhythm.cells[new Date(date).getHours()].count, 1);
  const tied = spendingRhythm(selected([tx("2026-10-05"), tx("2026-10-06")]));
  assert.match(tied.caption, /Mon, Tue are tied/);
});
