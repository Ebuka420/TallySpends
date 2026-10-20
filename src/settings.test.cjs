const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const original = Module._load;
let stored = JSON.stringify({ showSavings: false, privateMode: "invalid" });
let rejectWrite = false;
Module._load = function(name, ...args) {
  if (name === "react") return { useEffect: fn => fn(), useSyncExternalStore: (_, get) => get() };
  if (name === "@react-native-async-storage/async-storage") return { getItem: async () => stored, setItem: async (_, value) => {
    await new Promise(resolve => setTimeout(resolve, 5));
    if (rejectWrite) throw new Error("Device storage unavailable");
    stored = value;
  } };
  return original.call(this, name, ...args);
};
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { usePreferences, savePreferences } = require("./settings.ts");
(async () => {
  await Promise.all([savePreferences({ showInsights: false }), savePreferences({ privateMode: true })]);
  assert.equal(usePreferences().values.showSavings, false, "Stored visibility survives other changes");
  assert.equal(usePreferences().values.showInsights, false, "Concurrent writes preserve the first update");
  assert.equal(usePreferences().values.privateMode, true, "Concurrent writes preserve the second update");
  rejectWrite = true;
  await assert.rejects(savePreferences({ privateMode: false }));
  assert.equal(usePreferences().values.privateMode, true, "A failed save cannot report new settings as committed");
  rejectWrite = false;
  await savePreferences({ showBudgets: false });
  assert.equal(usePreferences().values.showBudgets, false, "A failed write does not block later saves");
  console.log("Settings persistence, concurrent writes, failure and retry checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
