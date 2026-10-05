import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { THEME_PALETTES } from "../src/theme";

export const BRAND_PURPLE = THEME_PALETTES.aurora.light.accent;
export const BRAND_PURPLE_DARK = THEME_PALETTES.aurora.dark.accent;

/** Square wallet proportions and sparkle details from the original TallySpends mark. */
export default function BrandMark({ size = 64, dark = false }: { size?: number; dark?: boolean }) {
  const palette = THEME_PALETTES.aurora[dark ? "dark" : "light"];
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" style={{ flexShrink: 0 }} accessible={false}>
      <Defs>
        <LinearGradient id="brand-aurora" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palette.accentSecondary} />
          <Stop offset="1" stopColor={palette.accent} />
        </LinearGradient>
      </Defs>
      <Path d="M54 28 V25 Q54 16 45 16 H25 Q16 16 16 25 V46 Q16 55 25 55 H45 Q54 55 54 46 V44" fill="none" stroke="url(#brand-aurora)" strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M57 30 H43 Q35 30 35 37 Q35 44 43 44 H57 V30 Z" fill="none" stroke="url(#brand-aurora)" strokeWidth={3.5} strokeLinejoin="round" />
      <Circle cx="43" cy="37" r={2.2} fill={palette.accent} />
      <Path d="M59 20 L63 16 M60 26 L66 25 M54 14 L56 8" fill="none" stroke="url(#brand-aurora)" strokeWidth={2.8} strokeLinecap="round" />
      <Circle cx="10" cy="47" r={1.5} fill={palette.accent} />
      <Path d="M8 51 Q8.5 54 11 54.5 Q8.5 55 8 58 Q7.5 55 5 54.5 Q7.5 54 8 51 Z" fill={palette.accentSecondary} />
      <Circle cx="13" cy="61" r={3} fill={palette.accent} />
      <Circle cx="21" cy="63" r={1.5} fill={palette.accentSecondary} />
    </Svg>
  );
}