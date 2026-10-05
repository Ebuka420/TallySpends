import { useFocusEffect } from "expo-router";
import { useCallback, useRef, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import { useReducedMotion } from "./AuthBackdrop";

/** A top-to-bottom stagger; the final layout stays fixed throughout the entrance. */
export default function OnboardingReveal({ children, order = 0, style }: {
  children: ReactNode;
  order?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    if (reduced === null) return;
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 500,
      delay: 80 + order * 85,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [reduced, progress, order]));

  return (
    <Animated.View style={[style, {
      opacity: progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0, 1, 1] }),
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}