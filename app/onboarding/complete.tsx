import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import SetupFrame from "../../components/onboarding/SetupFrame";
import OnboardingReveal from "../../components/OnboardingReveal";
import { ONBOARDING_THEME as theme } from "../../src/onboarding/brand";
import { createCompletionAction } from "../../src/onboarding/completion";
import { useAppStore } from "../../src/store";

export default function CompleteScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submit] = useState(createCompletionAction);
  const finish = async () => {
    setError("");
    await submit(completeOnboarding, () => router.replace("/(tabs)"), setIsSubmitting, setError);
  };
  return <SetupFrame step={4} visual={0} eyebrow="YOU'RE ALL SET" title={"Make every naira\ncount."} description="Your money, your goals, and your spending, all in one place. Your TallySpends journey starts here."
    button={isSubmitting ? "Setting up your account..." : error ? "Try again" : "Get Started"} busy={isSubmitting} error={error} onContinue={() => void finish()}>
    <OnboardingReveal order={3}><View style={s.summary}>{["Your goals and preferences are ready", "Your six-digit app PIN is set", "Unlock the app and confirm transfers with your PIN"].map(text => <View key={text} style={s.row}><Ionicons name="checkmark-circle-outline" size={21} color={theme.accent} /><Text style={s.text}>{text}</Text></View>)}</View></OnboardingReveal>
  </SetupFrame>;
}
const s = StyleSheet.create({ summary: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 23, padding: 20, gap: 18 }, row: { flexDirection: "row", alignItems: "center", gap: 12 }, text: { flex: 1, color: theme.textSecondary, fontSize: 12, lineHeight: 19 } });