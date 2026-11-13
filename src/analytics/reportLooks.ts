import { getThemePalette, type ThemePalette } from "../theme";

export type ReportLook = "signature" | "paper" | "prism" | "ocean" | "sage" | "sunset";
export const REPORT_LOOKS: { id: ReportLook; name: string; description: string; background: string; accent: string; motif: "rings" | "plain" | "confetti" | "grid" | "leaves" | "waves" }[] = [
  { id: "signature", name: "Signature", description: "Your theme · classic rings", background: "#30203E", accent: "#C4A9DF", motif: "rings" },
  { id: "paper", name: "Paper", description: "Light · simple and clean", background: "#F3EFF5", accent: "#897893", motif: "plain" },
  { id: "prism", name: "Prism", description: "Violet · playful colour", background: "#47277D", accent: "#F2BD74", motif: "confetti" },
  { id: "ocean", name: "Ocean", description: "Deep blue · crisp grid", background: "#103F58", accent: "#75D5E5", motif: "grid" },
  { id: "sage", name: "Sage", description: "Forest green · soft leaves", background: "#254E3D", accent: "#C7D8A4", motif: "leaves" },
  { id: "sunset", name: "Sunset", description: "Terracotta · flowing waves", background: "#803E36", accent: "#F3B583", motif: "waves" },
];

/** Presentation only: every look shares the same report calculations and export. */
export function reportPalette(look: ReportLook, selected: ThemePalette): ThemePalette {
  if (look === "signature") return selected;
  if (look === "paper") return getThemePalette(selected.id, "light");
  const base = getThemePalette("aurora", "light");
  const colors = {
    prism: { hero: "#382059", heroEnd: "#7753B4", accent: "#6B3EA6", accentSoft: "#EFE7FC", accentSecondary: "#AC75CE", surface: "#FFFCFF", textPrimary: "#30203D", textSecondary: "#72627C", border: "#E5D9F0", heroMuted: "#E4D5F4", chart: ["#7D55C2", "#25A78C", "#E79551", "#6295CF"] },
    ocean: { hero: "#0C3048", heroEnd: "#176E89", accent: "#126580", accentSoft: "#E1F2F7", accentSecondary: "#52A5BA", surface: "#F8FDFF", textPrimary: "#173744", textSecondary: "#57727D", border: "#CDDFE7", heroMuted: "#C4E6EF", chart: ["#177796", "#4CB4BF", "#6C8DC3", "#A4D6D5"] },
    sage: { hero: "#193C2E", heroEnd: "#547953", accent: "#3D6846", accentSoft: "#E8EFDF", accentSecondary: "#8CA878", surface: "#FAFCF5", textPrimary: "#293D2B", textSecondary: "#62715B", border: "#D9E2CF", heroMuted: "#DAE6CE", chart: ["#456F50", "#8DA16C", "#C4AB72", "#6DA69C"] },
    sunset: { hero: "#74372F", heroEnd: "#B96748", accent: "#A14D34", accentSoft: "#FCE9DC", accentSecondary: "#CE926B", surface: "#FFFBF4", textPrimary: "#4B2D28", textSecondary: "#82655A", border: "#EFDBCD", heroMuted: "#FFE0CC", chart: ["#BE674B", "#E7A366", "#B9889B", "#8D8CAC"] },
  }[look];
  return { ...base, ...colors, surfaceSoft: colors.accentSoft, onHero: "#FFFFFF", onAccent: "#FFFFFF" };
}
