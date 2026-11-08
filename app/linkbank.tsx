import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../src/store";
import { BankRequestError, bankBackend, createBankRequest, getBankSetupIssue, getMonoAuthCode, monoPublicKey } from "../src/banking/backend";
import type { LinkedBankAccount } from "../src/banking/backend";
import MonoSession from "../components/MonoSession";
import BankLogo from "../components/BankLogo";
import { useDashboardAccounts } from "../src/banking/useDashboardAccounts";
import { getProfileSnapshot, subscribeProfile } from "../src/profile/repository";

type Stage = "opening" | "connecting" | "confirming" | "refreshing" | "success" | "cancelled" | "error";
const BRAND = "#20142A";

export default function LinkBankScreen() {
  const router = useRouter();
  const { theme, token, refreshToken, login, profileFullName, profileEmail } = useAppStore();
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const savedAccounts = useDashboardAccounts(profile.scope || "", { token, refreshToken, saveTokens: async (next, refresh) => { await login(next, refresh); } });
  const [accounts, setAccounts] = useState<LinkedBankAccount[]>([]);
  const [stage, setStage] = useState<Stage>("opening");
  const [message, setMessage] = useState("");
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const inFlight = useRef(false);
  const confirmed = useRef(false);
  const handledSuccess = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const generation = useRef(0);
  const setupIssue = getBankSetupIssue();
  const customer = { name: profileFullName?.trim(), email: profileEmail?.trim() };
  const issue = setupIssue || (Platform.OS === "web" ? "Mono Connect is available in the iOS and Android app." : !token && !refreshToken ? "Sign in again to link your bank account." : !customer.name || !customer.email ? "Add your full name and email to your profile before linking." : null);

  useEffect(() => {
    mounted.current = true;
    generation.current++;
    confirmed.current = false; handledSuccess.current = false; inFlight.current = false;
    setAccounts([]); setUncertain(false); setMessage(""); setStage("opening");
    setAttempt(value => value + 1); setWidgetOpen(!issue);
    return () => { mounted.current = false; generation.current++; controller.current?.abort(); };
  }, [issue, profile.scope]);

  function retry() {
    if (issue || inFlight.current) return;
    confirmed.current = false;
    handledSuccess.current = false;
    setUncertain(false);
    setMessage("");
    setStage("opening");
    setAttempt(value => value + 1);
    setWidgetOpen(true);
  }

  async function finish(code?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    const started = generation.current;
    const requestController = new AbortController();
    controller.current = requestController;
    const timeout = setTimeout(() => requestController.abort(), 30000);
    const request = createBankRequest({
      token, refreshToken,
      saveTokens: async (nextToken, nextRefreshToken) => { await login(nextToken, nextRefreshToken); },
    }, requestController.signal);
    try {
      if (!confirmed.current) {
        if (!code) throw new Error("Please complete Mono authorization again.");
        setStage("confirming");
        await bankBackend.confirmConnection(code, request);
        if (!mounted.current || started !== generation.current) return;
        confirmed.current = true;
      }
      if (!mounted.current || started !== generation.current) return;
      setStage("refreshing");
      const nextAccounts = await bankBackend.listAccounts(request);
      if (!mounted.current || started !== generation.current) return;
      setAccounts(nextAccounts);
      if (nextAccounts.length === 0) {
        setStage("error");
        setMessage("Mono authorization finished, but the backend returned no linked accounts. Refresh linked accounts before treating this bank as connected.");
        return;
      }
      setStage("success");
      setMessage("Your bank account is linked successfully.");
    } catch (error) {
      if (!mounted.current || started !== generation.current) return;
      setStage("error");
      setUncertain(error instanceof BankRequestError && error.uncertain);
      setMessage(confirmed.current
        ? "The backend confirmed bank linking. " + (error instanceof Error ? error.message : "We couldn't refresh your accounts. Try refreshing again.")
        : requestController.signal.aborted
          ? "The request timed out. The result is unconfirmed. Check your accounts before linking again."
          : error instanceof TypeError
            ? "Couldn't reach the bank service. Check your connection and try again."
            : error instanceof Error ? error.message : "Couldn't link your bank account. Please try again.");
    } finally {
      clearTimeout(timeout);
      if (started === generation.current) inFlight.current = false;
    }
  }

  async function checkAccounts() {
    if (inFlight.current) return;
    inFlight.current = true;
    const started = generation.current;
    setStage("refreshing");
    const readController = new AbortController(); controller.current = readController;
    const timer = setTimeout(() => readController.abort(), 30000);
    try {
      const nextAccounts = await bankBackend.listAccounts(createBankRequest({ token, refreshToken,
        saveTokens: async (next, refresh) => { await login(next, refresh); } }, readController.signal));
      if (!mounted.current || started !== generation.current) return;
      setAccounts(nextAccounts); setUncertain(false); setStage("error");
      setMessage("Review your linked accounts before starting a new connection. The previous link request is still unconfirmed.");
    } catch (error) {
      if (mounted.current && started === generation.current) { setStage("error"); setMessage(error instanceof Error ? error.message : "Couldn't refresh your accounts. Try again."); }
    } finally { clearTimeout(timer); if (started === generation.current) inFlight.current = false; }
  }

  function onSuccess(data: unknown) {
    if (!mounted.current || getProfileSnapshot().scope !== profile.scope || inFlight.current || confirmed.current || handledSuccess.current) return;
    handledSuccess.current = true;
    setWidgetOpen(false);
    try { void finish(getMonoAuthCode(data)); }
    catch (error) {
      setStage("error");
      setMessage(error instanceof Error ? error.message : "Mono authorization failed.");
    }
  }

  const busy = !issue && ["opening", "connecting", "confirming", "refreshing"].includes(stage);
  const status = issue || message || ({
    opening: "Opening Mono Connect…", connecting: "Complete authorization in Mono Connect.",
    confirming: "Confirming your connection…", refreshing: "Refreshing linked accounts…",
    success: "Bank account linked.", cancelled: "Bank linking cancelled.", error: "Couldn't connect your bank.",
  })[stage];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Link Bank Account</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name={stage === "success" ? "checkmark-circle" : "shield-checkmark-outline"} size={40} color={theme.accent} />
          <Text accessibilityLiveRegion="polite" style={[styles.status, { color: theme.textPrimary }]}>{status}</Text>
          {busy && <ActivityIndicator color={theme.accent} />}
          {!issue && (!busy || stage === "opening" || stage === "connecting") && (
            <Pressable accessibilityRole="button" style={styles.button} onPress={stage === "success" ? () => router.back() : confirmed.current ? () => void finish() : uncertain ? () => void checkAccounts() : retry}>
              <Text style={styles.buttonText}>{stage === "success" ? "Done" : confirmed.current ? "Refresh accounts" : uncertain ? "Check linked accounts" : busy ? "Continue linking" : "Try again"}</Text>
            </Pressable>
          )}
          <Text style={[styles.helper, { color: theme.textSecondary }]}>Sandbox connection. Use Mono's test bank details to try linking an account.</Text>
        </View>
        {savedAccounts.loading && <ActivityIndicator color={theme.accent} />}
        {savedAccounts.error && <Text accessibilityLiveRegion="polite" style={[styles.helper, { color: theme.textSecondary, marginBottom: 12 }]}>{savedAccounts.error}</Text>}
        {(accounts.length > 0 || savedAccounts.accounts.length > 0) && (
          <>
            <Text style={[styles.title, { color: theme.textPrimary, marginBottom: 12 }]}>Linked bank accounts</Text>
            {(accounts.length ? accounts : savedAccounts.accounts).map(account => (
              <View key={account.id} style={[styles.account, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <BankLogo bank={account} size={18} color={theme.accent} />
                  <Text style={[styles.accountTitle, { color: theme.textPrimary, flex: 1 }]}>{account.bankName}</Text>
                </View>
                <Text style={{ color: theme.textSecondary }}>{account.accountName}{account.maskedAccountNumber ? " · " + account.maskedAccountNumber : ""}</Text>
                {account.currency && <Text style={{ color: theme.textSecondary }}>{account.currency}{typeof account.availableBalance === "number" ? " " + account.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : " · Balance unavailable"}</Text>}
              </View>
            ))}
          </>
        )}
      </ScrollView>
      {!issue && widgetOpen && (
        <MonoSession
          key={attempt}
          publicKey={monoPublicKey}
          customer={customer}
          onSuccess={onSuccess}
          onClose={() => {
            setWidgetOpen(false);
            if (!inFlight.current && !confirmed.current && !handledSuccess.current) setStage("cancelled");
          }}
          onEvent={event => {
            if (handledSuccess.current) return;
            if (event === "OPENED") setStage("connecting");
            if (event === "ERROR") {
              setWidgetOpen(false);
              setStage("error");
              setMessage("Couldn't complete authorization. Please try again.");
            }
            if (event === "EXIT" && !inFlight.current && !confirmed.current && !handledSuccess.current) {
              setWidgetOpen(false); setStage("cancelled");
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 58, paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 40 },
  panel: { borderRadius: 18, borderWidth: 1, padding: 24, alignItems: "center", gap: 18, marginBottom: 24 },
  status: { fontSize: 17, fontWeight: "600", textAlign: "center", lineHeight: 25 },
  helper: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  button: { alignSelf: "stretch", backgroundColor: BRAND, borderRadius: 12, padding: 15, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  account: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 6, marginBottom: 10 },
  accountTitle: { fontSize: 15, fontWeight: "600" },
});
