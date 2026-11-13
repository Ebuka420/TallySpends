import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";

export type Preferences = {
  showInsights: boolean;
  showBudgets: boolean;
  showSavings: boolean;
  autoAdjustLayout: boolean;
  privateMode: boolean;
};
const defaults: Preferences = { showInsights: true, showBudgets: true, showSavings: true, autoAdjustLayout: false, privateMode: false };
const key = "ts_settings_v1";
let snapshot = { values: defaults, loaded: false, error: null as string | null };
const listeners = new Set<() => void>();
let hydration: Promise<void> | undefined;
let queue = Promise.resolve();
function publish(next: typeof snapshot) {
  snapshot = next;
  listeners.forEach(listener => listener());
}
function load() {
  return hydration ??= AsyncStorage.getItem(key).then(raw => {
    const parsed = raw ? JSON.parse(raw) : {};
    const values = { ...defaults };
    for (const name of Object.keys(defaults) as (keyof Preferences)[]) {
      if (typeof parsed?.[name] === "boolean") values[name] = parsed[name];
    }
    publish({ values, loaded: true, error: null });
  }).catch(() => {
    hydration = undefined;
    publish({ ...snapshot, error: "Could not load saved settings. Please reopen this page to retry." });
  });
}
export async function savePreferences(patch: Partial<Preferences>) {
  await load();
  if (!snapshot.loaded) throw new Error(snapshot.error || "Settings are still loading.");
  const operation = queue.then(async () => {
    const values = { ...snapshot.values, ...patch };
    await AsyncStorage.setItem(key, JSON.stringify(values));
    publish({ values, loaded: true, error: null });
  });
  queue = operation.catch(() => {});
  return operation;
}
export function usePreferences() {
  useEffect(() => { void load(); }, []);
  return useSyncExternalStore(listener => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, () => snapshot, () => snapshot);
}
