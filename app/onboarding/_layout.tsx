import { Stack } from "expo-router";
import { ONBOARDING_THEME } from "../../src/onboarding/brand";
import { useReducedMotion } from "../../components/AuthBackdrop";

export const unstable_settings = { initialRouteName: "goals" };

export default function AccountSetupLayout() {
  const reduced = useReducedMotion();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ONBOARDING_THEME.background }, animation: reduced !== false ? "none" : "fade" }}>
    <Stack.Screen name="goals" />
    <Stack.Screen name="job" />
    <Stack.Screen name="pin" />
    <Stack.Screen name="complete" options={{ gestureEnabled: false }} />
  </Stack>;
}
