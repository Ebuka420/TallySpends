import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSharedValue } from "react-native-reanimated";
import { ONBOARDING_THEME as theme } from "../../src/onboarding/brand";
import { useReducedMotion } from "../AuthBackdrop";
import BrandMark from "../BrandMark";
import OnboardingReveal from "../OnboardingReveal";
import AnimatedBackground from "./AnimatedBackground";
import OnboardingVisual from "./OnboardingVisual";

function useSetupMotion() {
  const reduced = useReducedMotion() !== false;
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => { const listener = AppState.addEventListener("change", state => setForeground(state === "active")); return () => listener.remove(); }, []);
  return { active: focused && foreground && !reduced, reduced };
}

export function SetupBackground({ step }: { step: number }) {
  const progress = useSharedValue(Math.max(0, Math.min(3, step - 1)));
  const motion = useSetupMotion();
  return <AnimatedBackground progress={progress} {...motion} />;
}

export default function SetupFrame({ step, eyebrow, title, description, visual, children, button, onContinue, disabled = false, busy = false, error, onBack }: {
  step: number; eyebrow: string; title: string; description: string; visual: number; children?: ReactNode;
  button: string; onContinue: () => void; disabled?: boolean; busy?: boolean; error?: string; onBack?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const motion = useSetupMotion();
  const visualHeight = height < 750 ? 115 : 155;
  const scale = Math.min((width - 48) / 320, visualHeight / 310);
  return <SafeAreaView style={s.screen}>
    <StatusBar style="dark" />
    <SetupBackground step={step} />
    <View style={s.header}><View style={s.brand}><BrandMark size={23} palette={theme} /><Text style={s.brandName}>TallySpends</Text></View><Text style={s.step}>SETUP {step} OF 4</Text></View>
    <View style={s.progress} accessibilityLabel={`Account setup, step ${step} of 4`}>{[1, 2, 3, 4].map(value => <View key={value} style={[s.segment, { backgroundColor: value <= step ? theme.accent : theme.border }]} />)}</View>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={{ height: visualHeight, alignItems: "center", justifyContent: "center" }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><View style={{ width: 320, height: 310, transform: [{ scale }] }}><OnboardingVisual index={visual} {...motion} /></View></View>
      <OnboardingReveal order={0}><Text style={s.eyebrow}>{eyebrow}</Text></OnboardingReveal>
      <OnboardingReveal order={1}><Text accessibilityRole="header" style={s.title}>{title}</Text></OnboardingReveal>
      <OnboardingReveal order={2}><Text style={s.description}>{description}</Text></OnboardingReveal>
      <View style={s.options}>{children}</View>
    </ScrollView>
    <View style={s.footer}>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onContinue} style={({ pressed }) => [s.button, { opacity: disabled || busy ? .5 : pressed ? .85 : 1 }]}>
        {busy && <ActivityIndicator color={theme.onAccent} />}<Text style={s.buttonText}>{button}</Text>{!busy && <Ionicons name="arrow-forward" size={19} color={theme.onAccent} />}
      </Pressable>
      {onBack && <Pressable accessibilityRole="button" disabled={busy} onPress={onBack} style={s.back}><Text style={s.backText}>Back</Text></Pressable>}
    </View>
  </SafeAreaView>;
}

export function SetupOption({ title, subtitle, icon, selected, disabled, onPress, multiple = false }: {
  title: string; subtitle?: string; icon: keyof typeof Ionicons.glyphMap; selected: boolean; disabled?: boolean; onPress: () => void; multiple?: boolean;
}) {
  return <Pressable accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.option, { backgroundColor: selected ? theme.accentSoft : theme.surface, borderColor: selected ? theme.accent : theme.border, opacity: pressed ? .8 : 1 }]}>
    <View style={s.optionIcon}><Ionicons name={icon} size={21} color={theme.accent} /></View>
    <View style={{ flex: 1, gap: 4 }}><Text style={s.optionTitle}>{title}</Text>{!!subtitle && <Text style={s.optionSubtitle}>{subtitle}</Text>}</View>
    <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? theme.accent : theme.border} />
  </Pressable>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 18 }, brand: { flexDirection: "row", alignItems: "center", gap: 9 }, brandName: { color: theme.textPrimary, fontSize: 14, fontWeight: "600", letterSpacing: -.3 }, step: { color: theme.textSecondary, fontSize: 9, letterSpacing: 1.4 },
  progress: { flexDirection: "row", gap: 6, marginHorizontal: 24 }, segment: { height: 3, flex: 1, borderRadius: 3 }, content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 }, eyebrow: { color: theme.textSecondary, fontSize: 9, fontWeight: "600", letterSpacing: 2, marginTop: 12, marginBottom: 12 }, title: { color: theme.textPrimary, fontSize: 32, lineHeight: 38, letterSpacing: -1.1, fontWeight: "500" }, description: { color: theme.textSecondary, fontSize: 13, lineHeight: 21, marginTop: 12 }, options: { gap: 10, marginTop: 24 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, padding: 15 }, optionIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" }, optionTitle: { color: theme.textPrimary, fontSize: 13, fontWeight: "600" }, optionSubtitle: { color: theme.textSecondary, fontSize: 11, lineHeight: 17 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, gap: 10 }, button: { minHeight: 56, borderRadius: 21, backgroundColor: theme.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 16 }, buttonText: { color: theme.onAccent, fontSize: 14, fontWeight: "600" }, back: { minHeight: 40, alignItems: "center", justifyContent: "center" }, backText: { color: theme.textSecondary, fontSize: 12 }, error: { color: theme.danger, fontSize: 12, lineHeight: 18 },
});
