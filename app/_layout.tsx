import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { loadAsync } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RadialFloatingBot from "../components/RadialFloatingBot";
import StartupScreen from "../components/StartupScreen";
import QrIntentResume from "../components/QrIntentResume";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { useAppStore } from "../src/store";
import SecurityGate, { useSecurity } from "../components/SecurityGate";
import { useIntroStatus } from "../src/onboarding/intro";
import ThemeExperience from "../src/ThemeExperience";
import { ONBOARDING_THEME } from "../src/onboarding/brand";

// Hold the native launch screen until the branded React loading screen has laid out.
void SplashScreen.preventAutoHideAsync().catch(() => {});

const authenticatedScreens = [
  "(tabs)",
  "add-budget",
  "add-savings",
  "automatic-tracking",
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
  "intro-preview",
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
  "settings-login",
  "settings-password",
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
  "youngins-create",
  "youngins-overview",
  "youngins-edit",
] as const;

function PushNotifications() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  return <ThemeExperience><RootLayoutContent /></ThemeExperience>;
}
function RootLayoutContent() {
  const segments = useSegments();
  const { isAuthenticated, loading, themeMode, theme } = useAppStore();
  const productIntro = useIntroStatus();
  const [iconsReady, setIconsReady] = useState(false);
  const [iconError, setIconError] = useState(false);
  const [fontAttempt, setFontAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    // Vector icons render an empty Text until their font is loaded. Preload both
    // families used by app screens before mounting navigation in Expo Go too.
    const timeout = setTimeout(() => { if (active) setIconError(true); }, 30000);
    void Promise.resolve().then(() => loadAsync({ ...Ionicons.font, ...MaterialCommunityIcons.font }))
      .then(() => { if (active) { setIconsReady(true); setIconError(false); } })
      .catch(() => { if (active) setIconError(true); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); };
  }, [fontAttempt]);
  const [introComplete, setIntroComplete] = useState(false);
  const finishIntro = useCallback(() => setIntroComplete(true), []);
  const showLaunchScreen = useCallback(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);
  const topLevelGroup = String(segments[0] || "");

  // Do not mount any destination until startup data and the brand reveal are ready.
  // New visitors must finish or skip the introduction before auth is available.
  // Returning accounts retain the existing authentication and PIN routing.
  if (iconError) {
    return <View onLayout={showLaunchScreen} style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center", padding: 28, gap: 16 }}>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.textPrimary, textAlign: "center" }}>Couldn&apos;t load the app icons. Check your connection to the development server and try again.</Text>
      <Pressable accessibilityRole="button" onPress={() => { setIconError(false); setFontAttempt(value => value + 1); }} style={{ padding: 14, backgroundColor: theme.accent, borderRadius: 12 }}>
        <Text style={{ color: theme.background, fontWeight: "700" }}>Try again</Text>
      </Pressable>
    </View>;
  }
  if (loading || !introComplete || !iconsReady || (!isAuthenticated && !productIntro.ready)) {
    return <StartupScreen dark={themeMode === "dark"} onReady={finishIntro} onLayout={showLaunchScreen} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SecurityGate authenticated={isAuthenticated}>
        <AppNavigation isAuthenticated={isAuthenticated} topLevelGroup={topLevelGroup} introSeen={productIntro.seen} />
      </SecurityGate>
    </GestureHandlerRootView>
  );
}
function AppNavigation({ isAuthenticated, topLevelGroup, introSeen }: { isAuthenticated: boolean; topLevelGroup: string; introSeen: boolean }) {
  const security = useSecurity();
  const { theme } = useAppStore();
  return (
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          <Stack.Protected guard={!isAuthenticated && (!introSeen || topLevelGroup === "intro")}>
            <Stack.Screen name="intro" options={{ animation: "fade", gestureEnabled: false, contentStyle: { backgroundColor: ONBOARDING_THEME.background } }} />
          </Stack.Protected>
          <Stack.Protected guard={!isAuthenticated && introSeen}>
            <Stack.Screen name="auth" options={{ animation: "none", gestureEnabled: false }} />
            <Stack.Screen name="onboarding" options={{ contentStyle: { backgroundColor: ONBOARDING_THEME.background } }} />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated && !security.unlocked}>
            <Stack.Screen name="unlock" options={{ animation: "none", gestureEnabled: false }} />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated && security.unlocked}>
            {authenticatedScreens.map(name => <Stack.Screen key={name} name={name} />)}
          </Stack.Protected>
        </Stack>
        <PushNotifications />
        <QrIntentResume authenticated={isAuthenticated && security.unlocked} />
        {isAuthenticated && security.unlocked && topLevelGroup !== "onboarding" && topLevelGroup !== "intro-preview" && <RadialFloatingBot />}
      </View>
  );
}
