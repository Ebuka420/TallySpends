import { resolveBank, type BankIdentity } from "../data/banks";
import { BANK_COLORS } from "./carousel";

export function bankCardPalette(bank: BankIdentity, _fallback?: string) {
  const slug = resolveBank(bank)?.slug;
  // OPay's official logo uses #1DCF9F. Use a darker green for legible
  // text on white; retain the brand green for borders and decoration.
  if (slug === "paycom") return {
    background: "#FFFFFF", ink: "#006B50", muted: "#006B50",
    accent: "#1DCF9F", border: "#1DCF9F", badge: "#1DCF9F22",
  };
  // Unrecognized banks use neutral grey, never another bank's purple.
  const background = BANK_COLORS[slug || ""] || "#303840";
  const channels = [1, 3, 5].map(offset => parseInt(background.slice(offset, offset + 2), 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  const ink = 1.05 / (luminance + .05) >= 4.5 ? "#FFFFFF" : "#000000";
  return { background, ink, muted: ink, accent: ink, border: ink + "25", badge: ink + "18" };
}
