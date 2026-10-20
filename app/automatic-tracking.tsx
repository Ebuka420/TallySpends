import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBankRequest } from "../src/banking/backend";
import { useAppStore } from "../src/store";
import { checkTransactionFeed } from "../src/transactions/tracking";

export default function AutomaticTrackingScreen() {
  const router = useRouter();
  const { theme, token, refreshToken, login } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  const retry = async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setError(null);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try { await checkTransactionFeed(createBankRequest({ token, refreshToken, saveTokens: async (next, refresh) => { await login(next, refresh); } }, controller.signal)); }
    catch (failure) { if (active.current === controller && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Couldn't check transaction services. Please try again."); }
    finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
        if (controller.signal.aborted) setError("The check timed out. Check your connection and try again.");
      }
    }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 20 }}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/transaction-history")}><Ionicons name="chevron-back" size={24} color={theme.textPrimary} /></Pressable><Text style={{ fontSize: 21, fontWeight: "800", color: theme.textPrimary }}>Automatic tracking</Text></View>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
      <View style={{ padding: 20, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, gap: 12 }}>
        <Ionicons name="sync-outline" size={27} color={theme.accent} />
        <Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: "700" }}>Not active yet</Text>
        <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>Bank linking is available in sandbox. Automatic transaction imports are awaiting confirmation of the bank account and transaction response formats.</Text>
        <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>Last successful transaction sync: none confirmed. Your manual transactions remain available.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/linkedcards")}><Text style={{ color: theme.accent, fontWeight: "700" }}>View linked accounts</Text></Pressable>
      </View>
      <View style={{ padding: 20, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, gap: 10 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: "700" }}>SMS import</Text>
        <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>{Platform.OS === "ios" ? "SMS inbox import is unavailable on iPhone. Bank linking will provide automatic tracking once integration is confirmed." : "SMS import is unavailable in this build. Android inbox access requires an approved native implementation and your explicit consent before any bank alerts are read."}</Text>
      </View>
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.textSecondary, lineHeight: 21 }}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void retry()} style={{ backgroundColor: theme.accent, borderRadius: 16, padding: 16, alignItems: "center" }}>{busy ? <ActivityIndicator color={theme.onAccent} /> : <Text style={{ color: theme.onAccent, fontWeight: "700" }}>Check transaction service</Text>}</Pressable>
      <Text style={{ color: theme.textSecondary, lineHeight: 20, fontSize: 12 }}>This checks service availability. It does not request a bank sync or import transactions.</Text>
    </ScrollView>
  </SafeAreaView>;
}
