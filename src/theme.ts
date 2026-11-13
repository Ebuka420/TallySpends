export type ThemeMode = "light" | "dark";
export type ThemeId = "aurora" | "sage" | "sunset" | "ocean" | "forest" | "crimson" | "midnight" | "pink";
export const THEME_IDS: ThemeId[] = ["aurora", "sage", "sunset", "ocean", "forest", "crimson", "midnight", "pink"];
export type ThemeIdentity = {
  name: string; mood: string; brand: string;
  motion: { duration: number; ambient: number; distance: number; damping: number; stiffness: number };
  glow: number; depth: number;
};
export const THEME_IDENTITIES: Record<ThemeId, ThemeIdentity> = {
  aurora: { name: "Aurora Violet", mood: "Calm. Intelligent. In balance.", brand: "#20142A", motion: { duration: 320, ambient: 8500, distance: 5, damping: 25, stiffness: 150 }, glow: .13, depth: .10 },
  sage: { name: "Sage Green", mood: "Fresh. Peaceful. Room to grow.", brand: "#526B49", motion: { duration: 400, ambient: 10500, distance: 4, damping: 28, stiffness: 110 }, glow: .08, depth: .05 },
  sunset: { name: "Sunset Peach", mood: "Warm. Welcoming. Moving forward.", brand: "#9B4B37", motion: { duration: 340, ambient: 8000, distance: 6, damping: 23, stiffness: 140 }, glow: .14, depth: .08 },
  ocean: { name: "Ocean Breeze", mood: "Clear. Fluid. Confident.", brand: "#075477", motion: { duration: 380, ambient: 9000, distance: 7, damping: 26, stiffness: 125 }, glow: .12, depth: .08 },
  forest: { name: "Forest Pine", mood: "Grounded. Disciplined. Enduring.", brand: "#103E32", motion: { duration: 420, ambient: 12500, distance: 2, damping: 32, stiffness: 115 }, glow: .07, depth: .17 },
  crimson: { name: "Crimson Rose", mood: "Confident. Ambitious. Composed.", brand: "#801E38", motion: { duration: 260, ambient: 8000, distance: 3, damping: 29, stiffness: 185 }, glow: .10, depth: .12 },
  midnight: { name: "Midnight Gold", mood: "Refined. Considered. Exceptional.", brand: "#6D5426", motion: { duration: 460, ambient: 14000, distance: 2, damping: 34, stiffness: 100 }, glow: .07, depth: .20 },
  pink: { name: "Blossom Pink", mood: "Joyful. Creative. Beautifully you.", brand: "#9D3966", motion: { duration: 340, ambient: 7800, distance: 6, damping: 22, stiffness: 155 }, glow: .11, depth: .06 },
};
export type ThemePalette = {
  id: ThemeId; mode: ThemeMode; identity: ThemeIdentity;
  background: string; surface: string; surfaceSoft: string; mutedBackground: string;
  border: string; textPrimary: string; textSecondary: string;
  accent: string; accentSoft: string; accentSecondary: string; accentHighlight: string;
  success: string; warning: string; danger: string; onAccent: string;
  primary: string; secondary: string; brand: string; shadow: string; overlay: string;
  hero: string; heroEnd: string; onHero: string; heroMuted: string;
  logoStart: string; logoMiddle: string; logoEnd: string;
  logoOnHeroStart: string; logoOnHeroMiddle: string; logoOnHeroEnd: string;
  chart: readonly string[]; gradients: { brand: readonly [string, string, string]; atmosphere: readonly [string, string] };
};
// Theme identity is expressed through accents. Main surfaces stay neutral.
type Colors = [string, string, string, string, string, string, string, string, string, string, string];
const colors: Record<ThemeId, Record<ThemeMode, Colors>> = {
  aurora: {
    light: ["#FAF8FC", "#FFFFFF", "#F1EAF6", "#DED4E6", "#241B2C", "#6D5E76", "#523563", "#EDE1F3", "#725588", "#20142A", "#49315D"],
    dark: ["#100D16", "#1C1524", "#291E34", "#41334D", "#F7F1FC", "#BFB0CB", "#CEADE6", "#34233F", "#B38ACA", "#20142A", "#3C2851"],
  },
  sage: {
    light: ["#F7F8EF", "#FEFFF9", "#EDF1E1", "#D3DCC7", "#273327", "#5E6C57", "#48663F", "#E3ECD6", "#68835A", "#3D5534", "#4F6340"],
    dark: ["#171D17", "#202A20", "#2B3729", "#44523E", "#F0F5E9", "#B9C8AB", "#BED2A7", "#34442F", "#A0BD88", "#293A26", "#41573A"],
  },
  sunset: {
    light: ["#FFF8F2", "#FFFCF8", "#FCEBE0", "#ECD3C4", "#3A2824", "#7C5C52", "#984731", "#FBE2D4", "#AD5C42", "#773D36", "#86452F"],
    dark: ["#211512", "#2E1E19", "#3D2921", "#604235", "#FFF1E7", "#D5B6A4", "#F5B78F", "#503124", "#E7A179", "#48291F", "#704235"],
  },
  ocean: {
    light: ["#F3FAFC", "#FAFEFF", "#E3F1F6", "#C7DDE7", "#163342", "#546E7C", "#126282", "#DCEFF5", "#277B98", "#103E58", "#155E7B"],
    dark: ["#0C1B25", "#132A37", "#1D3947", "#325666", "#EDF9FF", "#A7C7D6", "#92D6ED", "#204859", "#67B9D8", "#10334B", "#1C506A"],
  },
  forest: {
    light: ["#EEF2ED", "#F9FCF8", "#DFE8DF", "#C1D1C5", "#172E25", "#536C5E", "#195540", "#DCE9DD", "#37755A", "#102F26", "#1C4F3C"],
    dark: ["#081610", "#10251C", "#193328", "#2E4D3C", "#EEF6EE", "#ABC6B2", "#9AD5B0", "#214333", "#73B792", "#0A2118", "#194332"],
  },
  crimson: {
    light: ["#FCF6F6", "#FFFCFC", "#F6E7EA", "#E5C9D0", "#38232B", "#7C5B67", "#922E4B", "#F6DDE5", "#AD4D68", "#571B32", "#91324F"],
    dark: ["#1E1118", "#2D1A23", "#402430", "#603C4B", "#FFF0F4", "#D7AFBF", "#F1A6BB", "#532B3C", "#DC829F", "#3E182B", "#6C2841"],
  },
  midnight: {
    light: ["#F5F3ED", "#FFFDF8", "#ECE7DA", "#D9CEB5", "#312C22", "#6D6048", "#78602D", "#EDE3CC", "#8C7136", "#20201E", "#363128"],
    dark: ["#101110", "#1B1C19", "#282820", "#494533", "#FAF5E8", "#C6B997", "#DCC38B", "#3B3423", "#BDA166", "#171815", "#333023"],
  },
  pink: {
    light: ["#FFF7FA", "#FFFCFE", "#FAE8F0", "#EACBD9", "#3D2632", "#7F576C", "#A03A6B", "#F9DEEB", "#B95684", "#70304D", "#913A62"],
    dark: ["#21131E", "#301D2A", "#432738", "#674354", "#FFF0F7", "#D7B2C8", "#F0B2D0", "#543247", "#DA92B6", "#452139", "#6E3453"],
  },
};
function build(id: ThemeId, mode: ThemeMode): ThemePalette {
  const [, , , , , , accent, accentSoft, accentSecondary] = colors[id][mode];
  const dark = mode === "dark";
  const identity = { ...THEME_IDENTITIES[id], motion: THEME_IDENTITIES.aurora.motion, glow: .08, depth: .08 };
  const logoStart = dark ? "#FFF9EE" : accentSecondary;
  const logoMiddle = dark ? accent : accent;
  const logoEnd = dark ? accentSecondary : identity.brand;
  const neutral = dark
    ? { background: "#111014", surface: "#1A181D", surfaceSoft: "#242027", mutedBackground: "#211D24", border: "#332D36", textPrimary: "#F7F4F8", textSecondary: "#B8B0BA" }
    : { background: "#FAF9FB", surface: "#FFFFFF", surfaceSoft: "#F5F5F7", mutedBackground: "#F6F6F8", border: "#E5E5EA", textPrimary: "#1C1C1E", textSecondary: "#63636A" };
  return {
    id, mode, identity, ...neutral,
    accent, accentSoft, accentSecondary, accentHighlight: accentSecondary,
    primary: accent, secondary: accentSecondary, brand: identity.brand,
    onAccent: dark ? neutral.background : "#FFFFFF",
    success: dark ? "#8AD4A1" : "#27643B", warning: dark ? "#F0C27C" : "#855615", danger: dark ? "#FFADB0" : "#AC3039",
    overlay: "rgba(8,12,16,0.48)", onHero: "#FFFCF8", heroMuted: "#E2DCD5",
    logoStart, logoMiddle, logoEnd,
    logoOnHeroStart: "#FFF9EE", logoOnHeroMiddle: colors[id].dark[6], logoOnHeroEnd: colors[id].dark[8],
    gradients: { brand: [logoStart, logoMiddle, logoEnd], atmosphere: [neutral.surfaceSoft, neutral.background] },
    chart: [accent, accentSecondary, dark ? "#9ABAC7" : "#52768B", dark ? "#D9C499" : "#987138", dark ? "#D0AAD1" : "#8C598E"],
    shadow: "#000000",
    hero: colors.aurora[mode][9], heroEnd: colors.aurora[mode][10],
  };
}
export const THEME_PALETTES = Object.fromEntries(THEME_IDS.map(id => [id, { light: build(id, "light"), dark: build(id, "dark") }])) as Record<ThemeId, Record<ThemeMode, ThemePalette>>;
export const LIGHT_COLORS = THEME_PALETTES.aurora.light;
export const DARK_COLORS = THEME_PALETTES.aurora.dark;
export const APP_COLORS = LIGHT_COLORS;
export const getThemePalette = (id: ThemeId = "aurora", mode: ThemeMode = "light"): ThemePalette => (THEME_PALETTES[id] ?? THEME_PALETTES.aurora)[mode] ?? LIGHT_COLORS;
/** Dashboard cards keep their established design regardless of accent selection. */
export const getDashboardPalette = (mode: ThemeMode): ThemePalette => THEME_PALETTES.aurora[mode];
export type LegacyTheme = ThemePalette & { card: string; text: string; secondaryText: string };
export const getTheme = (id: ThemeId = "aurora", mode: ThemeMode = "light"): LegacyTheme => {
  const p = getThemePalette(id, mode); return { ...p, card: p.surface, text: p.textPrimary, secondaryText: p.textSecondary };
};
export function withAlpha(hex: string, opacity: number) {
  const value = hex.replace("#", "");
  return `rgba(${parseInt(value.slice(0, 2), 16)},${parseInt(value.slice(2, 4), 16)},${parseInt(value.slice(4, 6), 16)},${opacity})`;
}

function mix(a: string, b: string, fraction: number) {
  if (!/^#[\da-f]{6}$/i.test(a) || !/^#[\da-f]{6}$/i.test(b)) return b;
  const color = [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - fraction) + parseInt(b.slice(i, i + 2), 16) * fraction).toString(16).padStart(2, "0")).join("");
  return `#${color}`;
}
export function interpolatePalette(from: ThemePalette, to: ThemePalette, t: number): ThemePalette {
  const palette = { ...to };
  for (const key of Object.keys(to) as (keyof ThemePalette)[]) {
    if (typeof to[key] === "string" && typeof from[key] === "string") {
      (palette as unknown as Record<string, unknown>)[key] = mix(from[key] as string, to[key] as string, t);
    }
  }
  palette.chart = to.chart.map((color, i) => mix(from.chart[i], color, t));
  palette.gradients = { brand: [palette.logoStart, palette.logoMiddle, palette.logoEnd], atmosphere: [palette.accentSoft, palette.background] };
  return palette;
}
