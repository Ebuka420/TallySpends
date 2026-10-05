import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RadialFloatingBot from "../components/RadialFloatingBot";
import StartupScreen from "../components/StartupScreen";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { useAppStore } from "../src/store";

// Hold the native launch screen until the branded React loading screen has laid out.
void SplashScreen.preventAutoHideAsync().catch(() => {});

const authenticatedScreens = [
  "(tabs)",
  "add-budget",
  "add-savings",
  "ajo-create",
  "ajo-create_from_git",
  "ajo-details",
  "ajo",
  "ajo_from_head",
  "budget-details",
  "budgetspending",
  "customerservice",
  "deposit",
  "insights",
  "insightssum",
  "invitation",
  "joint-savings-details",
  "joint-savings",
  "linkbank",
  "linkedcards",
  "membership",
  "notifications",
  "profile",
  "rateus",
  "request",
  "savings-details",
  "savings-lock",
  "savingsprogress",
  "settings-about",
  "settings-dashboard",
  "settings-feedback",
  "settings-login",
  "settings-savings",
  "settings-security",
  "settings-themes",
  "settings",
  "SObreakdown",
  "support",
  "transaction-details",
  "transaction-history",
  "transfer",
  "withdraw",
  "youngins",
] as const;

function PushNotifications() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const segments = useSegments();
  const { isAuthenticated, loading, themeMode } = useAppStore();
  const [introComplete, setIntroComplete] = useState(false);
  const finishIntro = useCallback(() => setIntroComplete(true), []);
  const showLaunchScreen = useCallback(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);
  const topLevelGroup = String(segments[0] || "");

  // Do not mount any destination until startup data and the brand reveal are ready.
  // Protected routes then select auth directly, without ever rendering the dashboard.
  if (loading || !introComplete) {
    return <StartupScreen dark={themeMode === "dark"} onReady={finishIntro} onLayout={showLaunchScreen} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="auth" options={{ animation: "none", gestureEnabled: false }} />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated}>
            {authenticatedScreens.map(name => <Stack.Screen key={name} name={name} />)}
          </Stack.Protected>
          <Stack.Screen name="onboarding" />
        </Stack>
        <PushNotifications />
        {isAuthenticated && topLevelGroup !== "onboarding" && <RadialFloatingBot />}
      </View>
    </GestureHandlerRootView>
  );
}