import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";
import { THEME_IDS, type ThemeId } from "./theme";
export type AppearancePreference = "light" | "dark" | "system";
let state = { ready: false, themePreference: "aurora" as ThemeId, darkModePreference: "system" as AppearancePreference };
const listeners = new Set<() => void>();
const publish = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
export const getAppearance = () => state;
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
let hydration: Promise<void> | undefined;
let revision = 0;
let writes = Promise.resolve();
export function hydrateAppearance() {
  if (!hydration) {
    const initialRevision = revision;
    hydration = AsyncStorage.multiGet(["ts_theme", "ts_dark_mode_preference"]).then(entries => {
      if (revision !== initialRevision) { publish({ ready: true }); return; }
      const values = Object.fromEntries(entries);
      const theme = values.ts_theme;
      const mode = values.ts_dark_mode_preference;
      publish({ ready: true, themePreference: THEME_IDS.includes(theme as ThemeId) ? theme as ThemeId : "aurora", darkModePreference: mode === "dark" || mode === "light" ? mode : "system" });
    }).catch(() => { publish({ ready: true }); });
  }
  return hydration;
}
function save(patch: Partial<typeof state>, entries: [string, string][]) {
  revision++;
  publish(patch); // Immediate preview; writes are serialized so the last tap survives restart.
  const pending = writes.catch(() => {}).then(() => AsyncStorage.multiSet(entries));
  writes = pending;
  return pending;
}
export const setThemePreference = (theme: ThemeId) => save({ themePreference: THEME_IDS.includes(theme) ? theme : "aurora" }, [["ts_theme", THEME_IDS.includes(theme) ? theme : "aurora"], ["ts_theme_is_customized", "true"]]);
export const setDarkModePreference = (mode: AppearancePreference) => {
  const valid = ["light", "dark", "system"].includes(mode) ? mode : "system";
  return save({ darkModePreference: valid as AppearancePreference }, [["ts_dark_mode_preference", valid]]);
};
export function useAppearance() {
  const snapshot = useSyncExternalStore(subscribe, getAppearance, getAppearance);
  useEffect(() => { void hydrateAppearance(); }, []);
  return snapshot;
}
