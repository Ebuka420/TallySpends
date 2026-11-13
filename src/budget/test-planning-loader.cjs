// The app uses Metro's extensionless resolution; tests transpile that one boundary.
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const ledger = require("./ledger.ts");
const output = ts.transpileModule(
  fs.readFileSync(require.resolve("./planning.ts"), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const loaded = { exports: {} };
vm.runInNewContext(output, {
  module: loaded,
  exports: loaded.exports,
  require: (name) => {
    if (name === "./ledger") return ledger;
    if (name === './people') return require('./people.ts');
    throw new Error(`Unexpected import ${name}`);
  },
});
module.exports = loaded.exports;
