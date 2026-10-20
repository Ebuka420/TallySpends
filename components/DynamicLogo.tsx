import { View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "../src/ThemeExperience";
import { type ThemePalette } from "../src/theme";
import BrandMark from "./BrandMark";
interface DynamicLogoProps {
  size?: number; rounded?: boolean; style?: StyleProp<ViewStyle>; imageStyle?: StyleProp<ImageStyle>; palette?: ThemePalette;
}
export default function DynamicLogo({ size = 76, rounded = true, style, imageStyle, palette }: DynamicLogoProps) {
  const active = useThemeTokens();
  const theme = palette ?? active;
  return <View style={[{ width: size, height: size, borderRadius: rounded ? Math.round(size * .28) : 0, borderWidth: 1,
    backgroundColor: theme.surface, borderColor: theme.border, alignItems: "center", justifyContent: "center",
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 5 }, shadowRadius: 12,
    shadowOpacity: theme.identity.glow, elevation: 2,
  }, style]}>
    <View style={[{ width: size * .78, height: size * .78 }, imageStyle]}><BrandMark size={size * .78} palette={theme} /></View>
  </View>;
}
