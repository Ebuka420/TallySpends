import { THEME_PALETTES } from "../theme";

// Onboarding is the official brand introduction, independent of account themes
// and appearance preferences. Never write these values to the user's settings.
export const ONBOARDING_THEME = Object.freeze({ ...THEME_PALETTES.aurora.light, accent: "#20142A", onAccent: "#FFFFFF" });
