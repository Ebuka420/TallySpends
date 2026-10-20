const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { THEME_IDS, THEME_PALETTES, getThemePalette, interpolatePalette } = require('./theme.ts');
function luminance(hex) {
  const channels = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
test('all eight themes support both appearances with readable text, actions, financial status, and hero content', () => {
  assert.equal(THEME_IDS.length,8);
  const failures = [];
  const check = (ok, message) => { if (!ok) failures.push(message); };
  for (const id of THEME_IDS) for (const mode of ['light','dark']) {
    const p = getThemePalette(id, mode);
    for (const surface of ['background','surface','surfaceSoft','accentSoft']) for (const text of ['textPrimary','textSecondary']) {
      check(contrast(p[text],p[surface]) >= 4.5, `${id}/${mode} ${text} on ${surface}: ${contrast(p[text],p[surface])}`);
    }
    check(contrast(p.onAccent,p.accent)>=4.5,`${id}/${mode} button`);
    for (const status of ['success','warning','danger']) check(contrast(p[status],p.surface)>=4.5,`${id}/${mode} ${status}`);
    for (const bg of ['hero','heroEnd']) for (const text of ['onHero','heroMuted']) check(contrast(p[text],p[bg])>=4.5,`${id}/${mode} ${text} ${bg}`);
    assert.equal(p.chart.length,5);
    assert.ok(p.identity.motion.duration<=500);
  }
  assert.deepEqual(failures, []);
});
test('Aurora is the default; themes preserve neutral surfaces, typography and financial status colours', () => {
  assert.equal(getThemePalette().id,'aurora'); assert.equal(getThemePalette().brand,'#20142A');
  for(const mode of ['light','dark']) {
    const sage=THEME_PALETTES.sage[mode], forest=THEME_PALETTES.forest[mode];
    assert.notEqual(sage.accent,forest.accent);
    for(const id of THEME_IDS) for(const key of ['background','surface','surfaceSoft','mutedBackground','border','textPrimary','textSecondary','shadow','hero','heroEnd']) assert.equal(THEME_PALETTES[id][mode][key],THEME_PALETTES.aurora[mode][key]);
    if(mode==='light') assert.equal(sage.surface,'#FFFFFF');
    for(const id of THEME_IDS) for(const status of ['success','warning','danger']) assert.equal(THEME_PALETTES[id][mode][status],sage[status]);
  }
});
function fresh(initial={},fail=false,delay=0) {
  const values=new Map(Object.entries(initial));
  const original=Module._load;
  Module._load=function(name,...args) {
    if(name==='@react-native-async-storage/async-storage') return {
      multiGet: async keys=> { if(delay) await new Promise(r=>setTimeout(r,delay)); return keys.map(k=>[k,values.get(k)??null]); },
      multiSet: async pairs=> { await new Promise(r=>setTimeout(r,3)); if(fail) throw Error('No storage'); pairs.forEach(([k,v])=>values.set(k,v)); }
    };
    return original.call(this,name,...args);
  };
  delete require.cache[require.resolve('./appearance.ts')];
  const appearance=require('./appearance.ts');Module._load=original;
  return {appearance,values};
}
test('new installs default to Aurora/system and every theme and appearance survives rehydration',async()=>{
  const first=fresh();await first.appearance.hydrateAppearance();assert.equal(first.appearance.getAppearance().themePreference,'aurora');
  assert.equal(first.appearance.getAppearance().darkModePreference,'system');
  for(const id of THEME_IDS) for(const mode of ['light','dark','system']) {
    const one=fresh();await one.appearance.hydrateAppearance();await one.appearance.setThemePreference(id);await one.appearance.setDarkModePreference(mode);
    const two=fresh(Object.fromEntries(one.values));await two.appearance.hydrateAppearance();
    assert.equal(two.appearance.getAppearance().themePreference,id);assert.equal(two.appearance.getAppearance().darkModePreference,mode);
  }
});
test('rapid choices persist in order and a delayed startup read cannot overwrite an explicit selection',async()=>{
  const {appearance,values}=fresh({ts_theme:'ocean'},false,15);
  const hydration=appearance.hydrateAppearance();
  const first=appearance.setThemePreference('sage');
  assert.equal(appearance.getAppearance().themePreference,'sage');
  const last=appearance.setThemePreference('midnight');
  await Promise.all([hydration,first,last]);
  assert.equal(appearance.getAppearance().themePreference,'midnight');assert.equal(values.get('ts_theme'),'midnight');
});
test('failed writes reject instead of pretending persistence, and invalid stored options default safely',async()=>{
  const {appearance,values}=fresh({},true);await appearance.hydrateAppearance();await assert.rejects(appearance.setThemePreference('pink'));
  assert.equal(appearance.getAppearance().themePreference,'pink');assert.equal(values.has('ts_theme'),false);
  const bad=fresh({ts_theme:'unknown',ts_dark_mode_preference:'invalid'});await bad.appearance.hydrateAppearance();
  assert.equal(bad.appearance.getAppearance().themePreference,'aurora');assert.equal(bad.appearance.getAppearance().darkModePreference,'system');
});


test('switching between every pair of themes keeps text readable during intermediate frames',()=>{
  for(const mode of ['light','dark']) for(const from of THEME_IDS) for(const to of THEME_IDS) for(const t of [.25,.5,.75]) {
    const p=interpolatePalette(getThemePalette(from,mode),getThemePalette(to,mode),t);
    for(const bg of ['background','surface','surfaceSoft','accentSoft']) for(const text of ['textPrimary','textSecondary']) assert.ok(contrast(p[text],p[bg])>=4.5,`${from}->${to} ${mode} ${t} ${text}/${bg}`);
    assert.ok(contrast(p.onAccent,p.accent)>=4.5,`${from}->${to} ${mode} button`);
  }
});
