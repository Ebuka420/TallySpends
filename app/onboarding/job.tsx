import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import SetupFrame, { SetupOption } from "../../components/onboarding/SetupFrame";
import OnboardingReveal from "../../components/OnboardingReveal";
import { useAppStore } from "../../src/store";

const OPTIONS = [
  { id: "employed", title: "Employed", subtitle: "I currently have a job", icon: "briefcase-outline" },
  { id: "unemployed", title: "Unemployed", subtitle: "I'm currently not working", icon: "time-outline" },
  { id: "student", title: "Student", subtitle: "I'm currently studying", icon: "school-outline" },
] as const;
export default function JobScreen() {
  const router = useRouter();
  const { employmentStatus, setEmploymentStatus } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const choose = async (id: string) => {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try { await setEmploymentStatus(id); }
    catch { setError("Couldn't save your status. Select it again to retry."); }
    finally { saving.current = false; setBusy(false); }
  };
  return <SetupFrame step={2} visual={3} eyebrow="A LITTLE ABOUT YOU" title={"A clearer picture\nof your everyday."} description="What best describes your current status? This helps us make your experience more relevant to you."
    button={busy ? "Saving your choice..." : "Continue"} busy={busy} disabled={!employmentStatus || !!error} error={error} onContinue={() => router.push("/onboarding/pin")} onBack={() => router.back()}>
    {OPTIONS.map((option, index) => <OnboardingReveal key={option.id} order={3 + index}><SetupOption {...option} selected={employmentStatus === option.id} disabled={busy} onPress={() => void choose(option.id)} /></OnboardingReveal>)}
  </SetupFrame>;
}