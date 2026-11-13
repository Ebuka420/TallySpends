import { useId } from "react";
import Svg, { Defs, Image, LinearGradient, Mask, Rect, Stop } from "react-native-svg";
import { useThemeTokens } from "../src/ThemeExperience";
import { THEME_PALETTES, type ThemePalette } from "../src/theme";
export const BRAND_PURPLE = THEME_PALETTES.aurora.light.accent;
export const BRAND_PURPLE_DARK = THEME_PALETTES.aurora.dark.accent;
/** The original transparent master is the mask. No paths are traced or redrawn. */
export default function BrandMark({ size = 64, palette }: { size?: number; dark?: boolean; palette?: ThemePalette }) {
  const active = useThemeTokens();
  const theme = palette ?? active;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <Svg width={size} height={size} viewBox="0 0 288 288" style={{ flexShrink: 0 }} accessible={false}>
    <Defs>
      <Mask id={`${id}mask`} x={0} y={0} width={288} height={288} maskUnits="userSpaceOnUse" maskType="alpha">
        <Image href={require("../assets/images/splash-mark-dark.png")} x={0} y={0} width={288} height={288} preserveAspectRatio="xMidYMid meet" />
      </Mask>
      <LinearGradient id={`${id}ink`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={theme.logoStart} />
        <Stop offset=".42" stopColor={theme.logoMiddle} />
        <Stop offset="1" stopColor={theme.logoEnd} />
      </LinearGradient>
    </Defs>
    <Rect width={288} height={288} fill={`url(#${id}ink)`} mask={`url(#${id}mask)`} />
  </Svg>;
}
