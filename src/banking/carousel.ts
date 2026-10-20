import type { LinkedBankAccount } from "./backend";

export const OVERVIEW_ID = "tallyspends-overview";
export function nextCardIndex(index: number, count: number) {
  "worklet";
  return count > 1 ? (index + 1) % count : 0;
}
export function acceptsRightSwipe(dx: number, dy: number, velocity: number, width: number, count: number) {
  "worklet";
  return count > 1 && dx > 20 && Math.abs(dx) > Math.abs(dy)
    && (dx >= width * 0.18 || velocity >= 600);
}
export function retainedSelection(id: string, accounts: LinkedBankAccount[]) {
  return id === OVERVIEW_ID || accounts.some(account => account.id === id) ? id : OVERVIEW_ID;
}

// Unbounded turns and modulo positions avoid a scrollTo/reset at the last card.
// Two ring copies let the next account enter from the left on a right swipe;
// the third slot keeps the same next account peeking at the right while idle.
export function carouselSlotPosition(turn: number, index: number, count: number, stride: number, mode: "front" | "back" | "peek") {
  "worklet";
  const delta = ((turn - index) % count + count) % count;
  const fraction = turn - Math.floor(turn);
  const next = (Math.floor(turn) + 1) % count;
  const x = mode === "peek" ? stride * (1 + fraction) : stride * (delta - (mode === "back" ? count : 0));
  const visible = mode === "peek" ? index === next : x <= stride - 1 && x >= -stride;
  return { x, visible };
}

export const BANK_COLORS: Record<string, string> = {
  "access-bank": "#AE3D08", "guaranty-trust-bank": "#B6430B", "zenith-bank": "#8B1029",
  "united-bank-for-africa": "#AA1422", "first-bank-of-nigeria": "#003963",
  "kuda-bank": "#40196D", "wema-bank": "#672466", "fidelity-bank": "#16472B",
};
