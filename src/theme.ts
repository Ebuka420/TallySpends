export type ThemeMode = "light" | "dark";

export type ThemeId = "aurora" | "sage" | "sunset" | "ocean" | "forest" | "crimson" | "midnight" | "pink";

export type ThemePalette = {
  background: string;
  surface: string;
  surfaceSoft: string;
  mutedBackground: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSoft: string;
  accentSecondary: string;
  accentHighlight: string;
  success: string;
  warning: string;
  danger: string;
};

export const LIGHT_COLORS: ThemePalette = {
  background: "#FAF9FB",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F0F8",
  mutedBackground: "#F6F1FA",
  border: "#EDE8F3",
  textPrimary: "#1C1C1E",
  textSecondary: "#6F6876",
  accent: "#4B2C40",
  accentSoft: "#F3EBF1",
  accentSecondary: "#6C4C7A",
  accentHighlight: "#5B4E91",
  success: "#2E7D32",
  warning: "#C47C49",
  danger: "#D9534F",
};

export const DARK_COLORS: ThemePalette = {
  background: "#111014",
  surface: "#1A181D",
  surfaceSoft: "#242027",
  mutedBackground: "#211D24",
  border: "#332D36",
  textPrimary: "#F7F4F8",
  textSecondary: "#B8B0BA",
  accent: "#C49AAF",
  accentSoft: "#332630",
  accentSecondary: "#A982B5",
  accentHighlight: "#9185D0",
  success: "#66BB6A",
  warning: "#E09A62",
  danger: "#EF6B66",
};

export const THEME_PALETTES: Record<
  ThemeId,
  Record<ThemeMode, ThemePalette>
> = {
  aurora: {
    light: LIGHT_COLORS,
    dark: DARK_COLORS,
  },

  sage: {
    light: {
      ...LIGHT_COLORS,
      accent: "#2E7D32",
      accentSoft: "#EAF4EC",
      accentSecondary: "#4D7C5A",
      accentHighlight: "#34A853",
    },

    dark: {
      ...DARK_COLORS,
      accent: "#81C784",
      accentSoft: "#1E3023",
      accentSecondary: "#6FA875",
      accentHighlight: "#66BB6A",
    },
  },

  sunset: {
    light: {
      ...LIGHT_COLORS,
      accent: "#C47C49",
      accentSoft: "#FAF2EC",
      accentSecondary: "#A9622C",
      accentHighlight: "#D98F4B",
    },

    dark: {
      ...DARK_COLORS,
      accent: "#E3A16F",
      accentSoft: "#35271F",
      accentSecondary: "#C98250",
      accentHighlight: "#E5A46F",
    },
  },

  ocean: {
    light: {
      ...LIGHT_COLORS,
      accent: "#1E40AF",
      accentSoft: "#EFF6FF",
      accentSecondary: "#3B82F6",
      accentHighlight: "#2563EB",
    },

    dark: {
      ...DARK_COLORS,
      accent: "#60A5FA",
      accentSoft: "#172554",
      accentSecondary: "#3B82F6",
      accentHighlight: "#2563EB",
    },
  },

  forest: {
    light: {
      ...LIGHT_COLORS,
      accent: "#15803D",
      accentSoft: "#F0FDF4",
      accentSecondary: "#16A34A",
      accentHighlight: "#22C55E",
    },

    dark: {
      ...DARK_COLORS,
      accent: "#4ADE80",
      accentSoft: "#14532D",
      accentSecondary: "#16A34A",
      accentHighlight: "#22C55E",
    },
  },

  crimson: {
    light: {
      ...LIGHT_COLORS,
      accent: "#BE123C",
      accentSoft: "#FFF1F2",
      accentSecondary: "#E11D48",
      accentHighlight: "#F43F5E",
    },

    dark: {
      ...DARK_COLORS,
      accent: "#FB7185",
      accentSoft: "#4C0519",
      accentSecondary: "#E11D48",
      accentHighlight: "#F43F5E",
    },
  },

  midnight: {
    light: {
      ...LIGHT_COLORS,
      accent: "#B45309",
      accentSoft: "#FEF3C7",
      accentSecondary: "#D97706",
      accentHighlight: "#F59E0B",
    },

    dark: {
      ...DARK_COLORS,
      background: "#08080A",
      surface: "#121115",
      surfaceSoft: "#1B1920",
      border: "#25222B",
      accent: "#F59E0B",
      accentSoft: "#451A03",
      accentSecondary: "#D97706",
      accentHighlight: "#F59E0B",
    },
  },

  pink: {
    light: {
      ...LIGHT_COLORS,
      accent: "#DB2777",
      accentSoft: "#FDF2F8",
      accentSecondary: "#F472B6",
      accentHighlight: "#EC4899",
    },

    dark: {
      ...DARK_COLORS,
      accent: "#F472B6",
      accentSoft: "#500724",
      accentSecondary: "#EC4899",
      accentHighlight: "#F472B6",
    },
  },
};

/**
 * Backwards-compatible light palette.
 *
 * Keep this export for older screens that still import APP_COLORS.
 * As we go through the remaining files, we'll replace those usages
 * with getThemePalette() where appropriate.
 */
export const APP_COLORS = LIGHT_COLORS;

/**
 * Returns the complete palette for a selected visual theme
 * and light/dark color scheme.
 *
 * themeId = palette choice:
 *   aurora | sage | sunset
 *
 * colorScheme = appearance:
 *   light | dark
 */
export const getThemePalette = (
  themeId: ThemeId = "aurora",
  colorScheme: ThemeMode = "light",
): ThemePalette => {
  const theme = THEME_PALETTES[themeId] ?? THEME_PALETTES.aurora;

  return theme[colorScheme] ?? theme.light;
};

/**
 * Backwards compatibility wrapper.
 *
 * Some screens still expect an older theme shape (legacy keys like `card`,
 * `text`, `secondaryText`, `primary`). Export `getTheme` which returns the
 * modern palette plus legacy aliases so both new and old consumers work.
 */
export type LegacyTheme = ThemePalette & {
  card: string;
  text: string;
  secondaryText: string;
  primary: string;
};

export const getTheme = (
  themeId: ThemeId = "aurora",
  colorScheme: ThemeMode = "light",
): LegacyTheme => {
  const p = getThemePalette(themeId, colorScheme);

  return {
    ...p,
    card: p.surface,
    text: p.textPrimary,
    secondaryText: p.textSecondary,
    primary: p.accent,
  };
};
