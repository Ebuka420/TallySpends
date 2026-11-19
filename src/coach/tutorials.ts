import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

export type TutorialPage = "home" | "expenses" | "budget" | "analytics" | "profile";
export type TutorialProgress = Partial<Record<TutorialPage, "completed" | "skipped">>;
export type TourStep = { target: string | null; message: string };
export type TourState = { owner: string | null; page: TutorialPage | null; step: number; replay: boolean };

const ELIGIBLE_PREFIX = "ts_coach_tutorials_eligible_v1_";
const PROGRESS_PREFIX = "ts_coach_tutorials_progress_v1_";
const ACTIVE_PREFIX = "ts_coach_tutorials_active_v1_";
const key = (prefix: string, owner: string) => prefix + encodeURIComponent(owner.trim().toLowerCase());

export const TUTORIALS: Record<TutorialPage, TourStep[]> = {
  home: [
    { target: "coach", message: "Hey! I'm your Smart Coach, your personal money companion. I'll help you understand your finances, manage your spending, and make smarter money decisions. Let me show you around!" },
    { target: "home-qr", message: "Here's your personal QR code! Other TallySpends users can scan it to find and connect with you easily." },
    { target: "home-wallet-arrow", message: "Your money, all in one place! Tap this arrow to explore your TallySpends card and switch between linked bank accounts." },
    { target: "home-insights", message: "This is where you can understand your money, explore spending patterns, track progress, and see financial tips." },
    { target: "home-budgets", message: "Stay in control of your spending. Create budgets, set limits, and track how much you have left." },
    { target: null, message: "That's your home! There's plenty more to explore, and I'll be right here whenever you need me." },
  ],
  expenses: [
    { target: "expenses-history", message: "Every naira counts! Find your income and expenses here, organized so you can keep track of your money." },
    { target: "expenses-filters", message: "Use the date controls and category breakdown to narrow down and understand your spending." },
  ],
  budget: [
    { target: "budget-available", message: "This shows how much money you have available to plan with, so you can decide what goes towards budgets and savings." },
    { target: "budget-items", message: "Give your money a purpose. Create budgets for everyday categories and keep track of your spending limits." },
    { target: "budget-savings", message: "Create savings goals, set targets, and follow your progress." },
    { target: "budget-ajo", message: "Create or join an Ajo circle, contribute with people you trust, and work towards shared savings goals." },
    { target: null, message: "You're all set! This is where your planning, savings, and Ajo circles begin." },
  ],
  analytics: [
    { target: "analytics-period", message: "Switch between weekly, monthly, and yearly views to explore different periods." },
    { target: "analytics-cashflow", message: "See how much money comes in compared with what goes out, and understand your cash flow." },
    { target: "analytics-spending", message: "Explore your spending patterns using the data recorded in your account." },
  ],
  profile: [
    { target: "profile-completion", message: "Open Complete your profile to save your residential address. NIN and BVN verification are coming soon." },
  ],
};

let tour: TourState = { owner: null, page: null, step: 0, replay: false };
let queuedReplay: { owner: string; page: TutorialPage } | null = null;
const listeners = new Set<() => void>();
const publish = (value: TourState) => { tour = value; listeners.forEach(listener => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
export const getTourSnapshot = () => tour;
export const getQueuedTutorialReplay = () => queuedReplay;
export function useTour() { return useSyncExternalStore(subscribe, getTourSnapshot, getTourSnapshot); }

export async function enrollFirstTimeUser(owner: string) {
  if (!owner.trim()) return;
  await AsyncStorage.setItem(key(ELIGIBLE_PREFIX, owner), "1");
  if (!(await AsyncStorage.getItem(key(PROGRESS_PREFIX, owner)))) await AsyncStorage.setItem(key(PROGRESS_PREFIX, owner), "{}");
}
export async function isFirstTimeTutorialUser(owner: string) {
  return !!owner.trim() && await AsyncStorage.getItem(key(ELIGIBLE_PREFIX, owner)) === "1";
}
export async function getTutorialProgress(owner: string): Promise<TutorialProgress> {
  if (!owner.trim()) return {};
  try { const raw = await AsyncStorage.getItem(key(PROGRESS_PREFIX, owner)); const value: unknown = raw ? JSON.parse(raw) : {}; return value && typeof value === "object" && !Array.isArray(value) ? value as TutorialProgress : {}; }
  catch { return {}; }
}
export async function markTutorialFinished(owner: string, page: TutorialPage, result: "completed" | "skipped") {
  if (!owner.trim()) return;
  const progress = await getTutorialProgress(owner);
  await AsyncStorage.setItem(key(PROGRESS_PREFIX, owner), JSON.stringify({ ...progress, [page]: result }));
}
export async function startTutorial(owner: string, page: TutorialPage, replay = false) {
  if (!owner.trim() || !TUTORIALS[page].length) return;
  if (!replay && !(await isFirstTimeTutorialUser(owner))) return;
  const progress = await getTutorialProgress(owner);
  if (!replay && progress[page]) return;
  let step = 0;
  if (!replay) {
    const saved = Number(await AsyncStorage.getItem(key(ACTIVE_PREFIX, owner) + "_" + page));
    if (Number.isInteger(saved) && saved >= 0 && saved < TUTORIALS[page].length) step = saved;
  } else await AsyncStorage.removeItem(key(ACTIVE_PREFIX, owner) + "_" + page);
  publish({ owner, page, step, replay });
}
export function queueTutorialReplay(owner: string, page: TutorialPage) { queuedReplay = { owner, page }; }
export async function consumeTutorialReplay(owner: string, page: TutorialPage) {
  if (!queuedReplay || queuedReplay.owner !== owner || queuedReplay.page !== page) return false;
  queuedReplay = null;
  await startTutorial(owner, page, true);
  return true;
}
export async function setTutorialStep(step: number) {
  if (!tour.page) return;
  const max = TUTORIALS[tour.page].length - 1;
  if (step < 0) return;
  if (step > max) { await finishTutorial("completed"); return; }
  if (tour.owner) await AsyncStorage.setItem(key(ACTIVE_PREFIX, tour.owner) + "_" + tour.page, String(step));
  publish({ ...tour, step });
}
export async function finishTutorial(result: "completed" | "skipped") {
  const { owner, page } = tour;
  if (owner && page) await markTutorialFinished(owner, page, result);
  if (owner && page) await AsyncStorage.removeItem(key(ACTIVE_PREFIX, owner) + "_" + page).catch(() => {});
  publish({ owner, page: null, step: 0, replay: false });
}
export function stopTutorial() { publish({ owner: null, page: null, step: 0, replay: false }); }
