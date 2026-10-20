import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import SetupFrame, { SetupOption } from "../../components/onboarding/SetupFrame";
import OnboardingReveal from "../../components/OnboardingReveal";
import { useAppStore } from "../../src/store";

const GOALS = [
  { id: "track_spending", title: "Track my spending", icon: "analytics-outline" },
  { id: "save_money", title: "Save more money", icon: "wallet-outline" },
  { id: "stick_to_budget", title: "Stick to a budget", icon: "pie-chart-outline" },
  { id: "manage_expenses", title: "Manage my expenses", icon: "receipt-outline" },
] as const;
export default function GoalsOnboardingScreen() {
  const router = useRouter();
  const { onboardingGoals, setOnboardingGoals } = useAppStore();
  const selected = onboardingGoals ?? [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const toggle = async (id: string) => {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try { await setOnboardingGoals(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]); }
    catch { setError("Couldn't save your goals. Please try again."); }
    finally { saving.current = false; setBusy(false); }
  };
  return <SetupFrame step={1} visual={2} eyebrow="MAKE ROOM FOR WHAT MATTERS" title={"Your goals.\nYour next chapter."} description="Choose what matters to you. We'll use your goals to personalize your TallySpends experience. You can choose more than one."
    button={busy ? "Saving your choice..." : "Continue"} busy={busy} disabled={!selected.length || !!error} error={error} onContinue={() => router.push("/onboarding/job")}>
    {GOALS.map((goal, index) => <OnboardingReveal key={goal.id} order={3 + index}><SetupOption {...goal} multiple selected={selected.includes(goal.id)} disabled={busy} onPress={() => void toggle(goal.id)} /></OnboardingReveal>)}
  </SetupFrame>;
}
