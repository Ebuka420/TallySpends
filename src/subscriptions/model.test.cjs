const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  module._compile(output, filename);
};

const { subscriptionStatus } = require("./model.ts");

test("only an active entitlement enables MVP", () => {
  assert.equal(subscriptionStatus({ isActive: true, verification: "VERIFIED" }), "active");
  assert.equal(subscriptionStatus({ isActive: true, verification: "NOT_REQUESTED" }), "active");
  assert.equal(subscriptionStatus({ isActive: false, verification: "VERIFIED" }), "inactive");
  assert.equal(subscriptionStatus(null), "inactive");
  assert.equal(subscriptionStatus(undefined), "inactive");
});

test("a failed entitlement verification never enables MVP", () => {
  assert.equal(subscriptionStatus({ isActive: true, verification: "FAILED" }), "verification-failed");
});
