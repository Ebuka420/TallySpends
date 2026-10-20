const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
require.extensions[".png"] = (module, filename) => { module.exports = filename; };
const { resolveBank, bankLogo } = require("./banks.ts");
for (const bankName of ["GTBank", "GTCO", "Guaranty Trust Bank", "Guaranty Trust Bank Plc"]) {
  assert.equal(resolveBank({ bankName }).slug, "guaranty-trust-bank");
  assert.match(bankLogo({ bankName }), /guaranty-trust-bank\.png$/);
}
assert.equal(resolveBank({ bankCode: "044", bankName: "GTBank" }).slug, "access-bank");
assert.equal(resolveBank({ bankCode: "058" }).slug, "guaranty-trust-bank");
assert.equal(resolveBank({ providerId: "access-bank" }).slug, "access-bank");
assert.equal(resolveBank({ bankSlug: "zenith-bank" }).slug, "zenith-bank");
assert.equal(resolveBank({ bankName: "UBA" }).slug, "united-bank-for-africa");
assert.equal(bankLogo({ bankName: "Unknown bank" }), undefined);
assert.equal(bankLogo({ bankCode: "110072" }), undefined);
assert.equal(bankLogo({}), undefined);
console.log("Bank logo code/provider matching, aliases, precedence and fallback checks passed.");
