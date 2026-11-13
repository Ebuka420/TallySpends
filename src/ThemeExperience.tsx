import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useAppearance } from "./appearance";
import { getThemePalette, interpolatePalette, type ThemePalette } from "./theme";
import { useReducedMotion } from "./accessibility";
const VisualTheme = createContext<ThemePalette | null>(null);
export const useVisualTheme = (fallback: ThemePalette) => useContext(VisualTheme) ?? fallback;
export function useThemeTokens() {
  const { themePreference, darkModePreference } = useAppearance();
  const system = useColorScheme();
  const mode = darkModePreference === "system" ? (system === "dark" ? "dark" : "light") : darkModePreference;
  return useVisualTheme(getThemePalette(themePreference, mode));
}
/** One short color interpolation for the app, never a screenshot or an input-blocking overlay. */
export default function ThemeExperience({ children }: { children: ReactNode }) {
  const settings = useAppearance();
  const system = useColorScheme();
  const mode = settings.darkModePreference === "system" ? (system === "dark" ? "dark" : "light") : settings.darkModePreference;
  const target = getThemePalette(settings.themePreference, mode);
  const [palette, setPalette] = useState(target);
  const current = useRef(target);
  const initialized = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    let frame = 0;
    const from = current.current;
    // Crossing Light/Dark must be atomic: interpolating both foreground and
    // background through grey would temporarily make text unreadable.
    const instant = from.mode !== target.mode || !initialized.current || !settings.ready || reduced !== false || AppState.currentState !== "active";
    initialized.current = settings.ready;
    if (from === target) return;
    const started = performance.now();
    let last = -100;
    const tick = (now: number) => {
      const elapsed = now - started;
      const fraction = instant ? 1 : Math.min(1, elapsed / target.identity.motion.duration);
      // Shared 30fps palette updates; ambient/press/scroll animations stay native.
      if (now - last >= 32 || fraction === 1) {
        last = now;
        current.current = fraction === 1 ? target : interpolatePalette(from, target, 1 - Math.pow(1 - fraction, 3));
        setPalette(current.current);
      }
      if (fraction < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced, settings.ready]);
  useEffect(() => { void SystemUI.setBackgroundColorAsync(target.background).catch(() => {}); }, [target.background]);
  return <VisualTheme.Provider value={palette}><StatusBar style={mode === "dark" ? "light" : "dark"} />{children}</VisualTheme.Provider>;
}
