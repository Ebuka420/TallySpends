import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";

export const INTRO_KEY = "ts_product_intro_v1";
export const INTRO_PAGES = [
  { label: "A LITTLE CLARITY", title: "Money,\nmade clearer.", description: "Understand your money. Own your future." },
  { label: "SEE THE WHOLE PICTURE", title: "Know where\nit goes.", description: "See your spending, understand your habits, and discover what your money is really doing." },
  { label: "MAKE ROOM FOR WHAT MATTERS", title: "Every naira,\nwith purpose.", description: "Organize your money, build better budgets, and make room for what matters." },
  { label: "YOUR NEXT CHAPTER", title: "Make your next\nmove smarter.", description: "Meet your personal financial companion, built to help you understand, plan, and grow." },
] as const;
let snapshot = { ready: false, seen: false, error: "" };
const listeners = new Set<() => void>();
let hydration: Promise<void> | null = null;
const publish = (patch: Partial<typeof snapshot>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getIntroSnapshot = () => snapshot;
export function hydrateIntro() {
  if (hydration) return hydration;
  hydration = AsyncStorage.multiGet([INTRO_KEY, "ts_onboarding_completed"]).then(values => {
    // Existing completed account setup must not be interrupted by a new introduction.
    publish({ ready: true, seen: snapshot.seen || values[0][1] === "1" || values[1][1] === "true", error: "" });
  }).catch(() => publish({ ready: true, error: "Couldn't read your introduction preference. You can continue below." }));
  return hydration;
}
export function useIntroStatus() {
  const state = useSyncExternalStore(subscribe, getIntroSnapshot, getIntroSnapshot);
  useEffect(() => { void hydrateIntro(); }, []);
  return state;
}
export async function completeIntro() {
  try { await AsyncStorage.setItem(INTRO_KEY, "1"); }
  catch { throw new Error("Couldn't save your introduction preference. Please try again."); }
  publish({ ready: true, seen: true, error: "" });
}
export const introAuthRoute = (mode: "login" | "signup") => ({ pathname: "/auth" as const, params: { mode } });
