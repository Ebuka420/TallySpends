const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { THEME_PALETTES } = require("../theme.ts");
let activeTheme;
const original = Module._load;
let useIntroColors;
try {
  Module._load = function(name, ...args) {
    if (name === "react-native-reanimated") return {};
    if (name.endsWith("ThemeExperience")) return { useThemeTokens: () => activeTheme };
    return original.call(this, name, ...args);
  };
  ({ useIntroColors } = require("../../components/onboarding/motion.ts"));
} finally { Module._load = original; }

test("intro colours remain the official light Aurora identity for every selected theme and appearance", () => {
  const initial = useIntroColors();
  assert.equal(initial.mode, "light");
  assert.equal(initial.button, "#20142A");
  for (const palettes of Object.values(THEME_PALETTES)) {
    for (const mode of ["light", "dark"]) {
      activeTheme = palettes[mode];
      assert.deepEqual(useIntroColors(), initial);
    }
  }
});
