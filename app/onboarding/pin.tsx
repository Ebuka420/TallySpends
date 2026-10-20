import { readPendingSignup } from "../../src/security/signup";
import { useRouter } from "expo-router";
import PinScreen from "../../components/PinScreen";
import { createPin } from "../../src/security/pin";
import { ONBOARDING_THEME } from "../../src/onboarding/brand";
export default function OnboardingPin() {
  const router = useRouter();
  return <PinScreen theme={ONBOARDING_THEME} setup onboarding onSubmit={async pin => {
    const pending = await readPendingSignup();
    const email = pending?.email;
    if (typeof email !== "string" || !email.trim()) throw new Error("Restart account setup to create your PIN.");
    await createPin("email:" + email.trim().toLowerCase(), pin);
    router.push("/onboarding/complete");
  }} onCancel={() => router.back()} />;
}
