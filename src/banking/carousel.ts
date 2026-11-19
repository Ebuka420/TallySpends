import type { LinkedBankAccount } from "./backend";

export const OVERVIEW_ID = "tallyspends-overview";
export function carouselMetrics(screenWidth: number) {
  const width = screenWidth * 0.91;
  return { width, height: width / 1.8, stride: width + 10, inset: 12, trailingInset: screenWidth - width - 12 };
}
export function cardIndexAtOffset(offset: number, stride: number, count: number) {
  if (count < 2 || !Number.isFinite(offset) || stride <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(offset / stride)));
}
export function retainedSelection(id: string, accounts: LinkedBankAccount[]) {
  return id === OVERVIEW_ID || accounts.some(account => account.id === id) ? id : OVERVIEW_ID;
}

export const BANK_COLORS: Record<string, string> = {
  // Exact colours from official styles or the bundled bank-logo artwork.
  // Source notes: BANK_BRANDING.md. Do not darken these to fit the app theme.
  "access-bank": "#114185", "access-bank-diamond": "#114185", "alat-by-wema": "#C7001D",
  "asosavings": "#E22630", "cemcs-microfinance-bank": "#2390C9", "citibank-nigeria": "#003B70",
  "ecobank-nigeria": "#00577A", "ekondo-microfinance-bank": "#026635", "fidelity-bank": "#11237D",
  "first-bank-of-nigeria": "#162D4C", "first-city-monument-bank": "#5C2682", "globus-bank": "#242E64",
  "guaranty-trust-bank": "#D94F00", "heritage-bank": "#68AC48", "keystone-bank": "#133F77",
  "kuda-bank": "#40196D", "lotus-bank": "#2D1B79", "moniepoint-mfb-ng": "#0357EE", "paga": "#F16522",
  "palmpay": "#8F00FF", "polaris-bank": "#8934AD", "sparkle-microfinance-bank": "#8BC43F",
  "stanbic-ibtc-bank": "#00529B", "standard-chartered-bank": "#0072A9", "sterling-bank": "#DB353A",
  "taj-bank": "#D52A1D", "union-bank-of-nigeria": "#0AB8F2", "united-bank-for-africa": "#D71920",
  "wema-bank": "#981D87", "zenith-bank": "#ED1C24",
};
