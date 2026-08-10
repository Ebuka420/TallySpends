export const APP_COLORS = {
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

export const THEME_PALETTES = {
  aurora: APP_COLORS,
  sage: {
    ...APP_COLORS,
    accent: "#2E7D32",
    accentSoft: "#EAF4EC",
    accentSecondary: "#4D7C5A",
    accentHighlight: "#34A853",
  },
  sunset: {
    ...APP_COLORS,
    accent: "#C47C49",
    accentSoft: "#FAF2EC",
    accentSecondary: "#A9622C",
    accentHighlight: "#D98F4B",
  },
};

export const getThemePalette = (themeId = "aurora") => {
  return THEME_PALETTES[themeId] || THEME_PALETTES.aurora;
};
