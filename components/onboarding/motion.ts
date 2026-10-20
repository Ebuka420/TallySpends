import { useEffect } from "react";
import { cancelAnimation, Easing, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { ONBOARDING_THEME } from "../../src/onboarding/brand";
export function useIntroColors() {
  const theme = ONBOARDING_THEME;
  return { mode: theme.mode, base: theme.background, brand: theme.onAccent, text: theme.textPrimary, muted: theme.textSecondary, lavender: theme.accent, subtle: theme.textSecondary, card: theme.surface, border: theme.border, button: theme.accent, soft: theme.accentSoft, danger: theme.danger, distance: theme.identity.motion.distance };
}
export type IntroColors = ReturnType<typeof useIntroColors>;
export function useAmbient(active: boolean, reduced: boolean, duration = 7000) {
  const theme = ONBOARDING_THEME;
  const period = duration * theme.identity.motion.ambient / 8500;
  const phase = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(phase);
    if (active && !reduced) phase.value = withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }), -1, true);
    else phase.value = 0;
    return () => cancelAnimation(phase);
  }, [active, reduced, period, phase]);
  return phase;
}


