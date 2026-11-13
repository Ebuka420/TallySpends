import { StyleSheet } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { ONBOARDING_THEME } from "../../src/onboarding/brand";
import { useAmbient } from "./motion";
export default function AnimatedBackground({ progress, active, reduced }: { progress: SharedValue<number>; active: boolean; reduced: boolean }) {
  const theme = ONBOARDING_THEME;
  const light = useAmbient(active, reduced, 12000);
  const distance = theme.identity.motion.distance;
  const background = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(progress.value, [0, 1, 2, 3], [theme.background, theme.background, theme.surfaceSoft, theme.background]) }));
  const illumination = useAnimatedStyle(() => ({ opacity: .70 + light.value * .12, transform: [{ translateX: reduced ? 0 : light.value * distance }, { translateY: reduced ? 0 : light.value * distance }] }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, background]}>
    <Animated.View style={[StyleSheet.absoluteFill, illumination]}><Svg width="100%" height="100%" viewBox="0 0 400 850" preserveAspectRatio="xMidYMin slice" accessible={false}>
      <Defs><RadialGradient id="intro-atmosphere" cx="50%" cy="40%" rx="50%" ry="50%"><Stop offset="0" stopColor={theme.accentSecondary} stopOpacity={theme.identity.glow} /><Stop offset="1" stopColor={theme.background} stopOpacity={0} /></RadialGradient></Defs>
      <Ellipse cx="220" cy="210" rx="305" ry="370" fill="url(#intro-atmosphere)" /><Ellipse cx="25" cy="760" rx="280" ry="300" fill="url(#intro-atmosphere)" />
    </Svg></Animated.View>
  </Animated.View>;
}
