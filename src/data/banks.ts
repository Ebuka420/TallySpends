import type { ImageSourcePropType } from "react-native";
import catalogue from "./nigerian-banks.json";

// Catalogue and logos: https://github.com/ridbay/nigerian-banks (MIT).
export const BANK_LOGOS: Record<string, ImageSourcePropType> = {
  "access-bank-diamond": require("../../assets/banks/access-bank-diamond.png"),
  "access-bank": require("../../assets/banks/access-bank.png"),
  "alat-by-wema": require("../../assets/banks/alat-by-wema.png"),
  "asosavings": require("../../assets/banks/asosavings.png"),
  "cemcs-microfinance-bank": require("../../assets/banks/cemcs-microfinance-bank.png"),
  "citibank-nigeria": require("../../assets/banks/citibank-nigeria.png"),
  "default-image": require("../../assets/banks/default-image.png"),
  "ecobank-nigeria": require("../../assets/banks/ecobank-nigeria.png"),
  "ekondo-microfinance-bank": require("../../assets/banks/ekondo-microfinance-bank.png"),
  "fidelity-bank": require("../../assets/banks/fidelity-bank.png"),
  "first-bank-of-nigeria": require("../../assets/banks/first-bank-of-nigeria.png"),
  "first-city-monument-bank": require("../../assets/banks/first-city-monument-bank.png"),
  "globus-bank": require("../../assets/banks/globus-bank.png"),
  "guaranty-trust-bank": require("../../assets/banks/guaranty-trust-bank.png"),
  "heritage-bank": require("../../assets/banks/heritage-bank.png"),
  "keystone-bank": require("../../assets/banks/keystone-bank.png"),
  "kuda-bank": require("../../assets/banks/kuda-bank.png"),
  "lotus-bank": require("../../assets/banks/lotus-bank.png"),
  "moniepoint-mfb-ng": require("../../assets/banks/moniepoint-mfb-ng.png"),
  "paga": require("../../assets/banks/paga.png"),
  "palmpay": require("../../assets/banks/palmpay.png"),
  "paycom": require("../../assets/banks/paycom.png"),
  "polaris-bank": require("../../assets/banks/polaris-bank.png"),
  "sparkle-microfinance-bank": require("../../assets/banks/sparkle-microfinance-bank.png"),
  "stanbic-ibtc-bank": require("../../assets/banks/stanbic-ibtc-bank.png"),
  "standard-chartered-bank": require("../../assets/banks/standard-chartered-bank.png"),
  "sterling-bank": require("../../assets/banks/sterling-bank.png"),
  "taj-bank": require("../../assets/banks/taj-bank.png"),
  "union-bank-of-nigeria": require("../../assets/banks/union-bank-of-nigeria.png"),
  "united-bank-for-africa": require("../../assets/banks/united-bank-for-africa.png"),
  "wema-bank": require("../../assets/banks/wema-bank.png"),
  "zenith-bank": require("../../assets/banks/zenith-bank.png"),
};
export const NIGERIAN_BANKS = catalogue.filter((bank, index) => catalogue.findIndex(item => item.slug === bank.slug) === index);
export type NigerianBank = (typeof NIGERIAN_BANKS)[number];
export const POPULAR_BANK_SLUGS = [
  "access-bank", "guaranty-trust-bank", "zenith-bank",
  "united-bank-for-africa", "first-bank-of-nigeria",
];
export function bankDisplayName(bank: NigerianBank) {
  return ({
    "guaranty-trust-bank": "GTBank",
    "united-bank-for-africa": "UBA",
    "first-bank-of-nigeria": "First Bank",
  } as Record<string, string>)[bank.slug] || bank.name;
}

export type BankIdentity = { bankCode?: string; bankSlug?: string; bankName?: string; providerId?: string };
const normalizeBank = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const BANK_ALIASES: Record<string, string> = {
  gtbank: "guaranty-trust-bank", gtco: "guaranty-trust-bank", guarantytrust: "guaranty-trust-bank",
  guarantytrustbankplc: "guaranty-trust-bank", access: "access-bank", accessbankplc: "access-bank",
  uba: "united-bank-for-africa", firstbank: "first-bank-of-nigeria", firstbankofnigerialimited: "first-bank-of-nigeria",
  fcmb: "first-city-monument-bank", stanbicibtc: "stanbic-ibtc-bank", zenith: "zenith-bank",
  zenithbankplc: "zenith-bank", fidelity: "fidelity-bank", wema: "wema-bank", unionbank: "union-bank-of-nigeria",
  ecobank: "ecobank-nigeria", kuda: "kuda-bank", moniepoint: "moniepoint-mfb-ng", opay: "paycom",
};
export function resolveBank(identity: BankIdentity): NigerianBank | undefined {
  // Preserve leading zeros in Nigerian bank codes. Provider IDs are matched
  // only to known slugs/codes, never guessed from an account's own ID.
  const byCode = identity.bankCode && catalogue.find(bank => bank.code === identity.bankCode);
  if (byCode) return byCode;
  for (const value of [identity.bankSlug, identity.providerId, identity.bankName]) {
    if (!value) continue;
    const normalized = normalizeBank(value);
    const bank = NIGERIAN_BANKS.find(bank => bank.slug === value.toLowerCase() || bank.code === value
      || normalizeBank(bank.name) === normalized || bank.slug === BANK_ALIASES[normalized]);
    if (bank) return bank;
  }
  return undefined;
}
export function bankLogo(identity: BankIdentity): ImageSourcePropType | undefined {
  const bank = resolveBank(identity);
  return bank ? BANK_LOGOS[bank.slug] : undefined;
}
