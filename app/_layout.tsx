import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import RadialFloatingBot from "../components/RadialFloatingBot";
import { useAppStore } from "../src/store";

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  // Pull authentication status from the global store instead of hardcoding it to false
  const { isAuthenticated } = useAppStore();
  const hasPasscode = false;
  const isPasscodeVerified = false;

  useEffect(() => {
    // Wait until Expo Router segments are populated
    if (!segments || !segments.length) return;

    const topLevelGroup = String(segments[0]);
    const inAuthGroup = topLevelGroup === "auth";
    const inPasscodeScreen = topLevelGroup === "passcode";
    const inSetupGroup = topLevelGroup === "setup-profile";

    const navigationTask = setTimeout(() => {
      // 1. Unauthenticated user trying to access protected screens -> redirect to Auth
      if (!isAuthenticated && !inAuthGroup && !inSetupGroup) {
        router.replace("/auth" as any);
        return;
      }

      // 2. Authenticated user with active Passcode requirement
      if (
        isAuthenticated &&
        hasPasscode &&
        !isPasscodeVerified &&
        !inPasscodeScreen
      ) {
        router.replace("/passcode" as any);
        return;
      }

      // 3. Authenticated user sitting on Auth/Passcode screens -> redirect to Dashboard
      if (
        isAuthenticated &&
        (inAuthGroup || (hasPasscode && isPasscodeVerified && inPasscodeScreen))
      ) {
        router.replace("/(tabs)" as any);
        return;
      }
    }, 0);

    return () => clearTimeout(navigationTask);
  }, [isAuthenticated, hasPasscode, isPasscodeVerified, segments]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Primary Route Groups */}
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="setup-profile" />
        <Stack.Screen name="passcode" />

        {/* Standalone Sub-screens */}
        <Stack.Screen name="customerservice" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="invitation" />
        <Stack.Screen name="linkbank" />
        <Stack.Screen name="membership" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="rateus" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="SObreakdown" />
        <Stack.Screen name="support" />
        <Stack.Screen name="transaction-details" />
      </Stack>

      {/* Floating Global Bot Overlay */}
      <RadialFloatingBot />
    </View>
  );
}
