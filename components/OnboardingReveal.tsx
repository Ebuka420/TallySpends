import { ONBOARDING_THEME } from "../src/onboarding/brand";
import { useFocusEffect } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import { useReducedMotion } from "./AuthBackdrop";

/** A top-to-bottom stagger; the final layout stays fixed throughout the entrance. */
export default function OnboardingReveal({ children, order = 0, style }: {
  children: ReactNode;
  order?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = ONBOARDING_THEME;
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useFocusEffect(useCallback(() => {
    if (reduced === null) return;
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: theme.identity.motion.duration + 180,
      delay: 80 + order * 85,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [reduced, progress, order, theme.identity.motion.duration]));

  return (
    <Animated.View style={[style, {
      opacity: progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0, 1, 1] }),
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [theme.identity.motion.distance * 3, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}
