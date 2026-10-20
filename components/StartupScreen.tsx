import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { THEME_PALETTES } from "../src/theme";
import { useReducedMotion } from "./AuthBackdrop";
import BrandMark from "./BrandMark";
import { useThemeTokens } from "../src/ThemeExperience";

export const LAUNCH_BACKGROUND = THEME_PALETTES.aurora.light.surfaceSoft;
export const LAUNCH_BACKGROUND_DARK = THEME_PALETTES.aurora.dark.background;

export default function StartupScreen({ dark, onReady, onLayout }: {
  dark: boolean;
  onReady: () => void;
  onLayout: () => void;
}) {
  const theme = useThemeTokens();
  const reduced = useReducedMotion();
  const [reveal] = useState(() => new Animated.Value(0));
  const [loading] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced === null) return;
    if (reduced) {
      reveal.setValue(1);
      onReady();
      return;
    }
    const intro = Animated.sequence([
      Animated.timing(reveal, {
        toValue: 1, duration: theme.identity.motion.duration + 240, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.delay(300),
    ]);
    intro.start(({ finished }) => { if (finished) onReady(); });
    return () => intro.stop();
  }, [reduced, reveal, onReady, theme.identity.motion.duration]);

  useEffect(() => {
    if (reduced !== false) return;
    const loop = Animated.loop(Animated.timing(loading, {
      toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin),
      useNativeDriver: true, isInteraction: false,
    }));
    loop.start();
    return () => loop.stop();
  }, [reduced, loading]);

  const purple = theme.accent;
  return (
    <View onLayout={onLayout} style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={dark ? "light" : "dark"} />
      <Animated.View style={[styles.brand, {
        opacity: reveal,
        transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
      }]}>
        <View style={styles.wordmark}>
          <BrandMark size={54} dark={dark} />
          <Text style={[styles.name, { color: purple }]}>TallySpends</Text>
        </View>
        <Text style={[styles.tagline, { color: purple }]}>YOUR MONEY, IN BALANCE</Text>
      </Animated.View>
      <View style={styles.footer}>
        <View style={[styles.track, { backgroundColor: theme.accentSoft }]} accessibilityRole="progressbar" accessibilityLabel="Loading TallySpends">
          <Animated.View style={[styles.progress, {
            backgroundColor: purple,
            transform: [{ translateX: loading.interpolate({ inputRange: [0, 1], outputRange: [-48, 144] }) }],
          }]} />
        </View>
        <Text style={[styles.footerText, { color: purple }]}>BUDGET · SAVE · GROW</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center" },
  brand: { alignItems: "center", marginBottom: 30 },
  wordmark: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  tagline: { marginTop: 16, fontSize: 9, fontWeight: "600", letterSpacing: 3 },
  footer: { position: "absolute", bottom: 64, alignItems: "center" },
  track: { width: 144, height: 2, borderRadius: 2, overflow: "hidden", marginBottom: 20 },
  progress: { width: 48, height: 2, borderRadius: 2 },
  footerText: { fontSize: 9, fontWeight: "600", letterSpacing: 2 },
});
