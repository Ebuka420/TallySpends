import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, PermissionsAndroid, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clearPendingSms, configureSmsReader, smsQueueStatus, smsReaderAvailable } from "../modules/tally-sms-reader";
import { createBankRequest } from "../src/banking/backend";
import { useAppStore } from "../src/store";
import { formatSmsImportResult } from "../src/transactions/tracking";
import { drainQueuedBankAlerts, SMS_CONSENT_KEY, SMS_ENABLED_KEY, SMS_LAST_RESULT_KEY, SMS_SENDERS_KEY } from "../src/transactions/smsSync";

export default function AutomaticTrackingScreen() {
  const router = useRouter();
  const { theme, token, refreshToken, login, refreshTransactions } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [sendersText, setSendersText] = useState("");
  const [pending, setPending] = useState(0);
  const [notQueued, setNotQueued] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const supported = Platform.OS === "android" && smsReaderAvailable();

  const makeRequest = useCallback((signal: AbortSignal) => createBankRequest({ token, refreshToken,
    saveTokens: async (next, refresh) => { await login(next, refresh); } }, signal), [token, refreshToken, login]);

  const updatePending = useCallback(async () => { try { const status = await smsQueueStatus(); setPending(status.pending); setNotQueued(status.notQueued); } catch { setPending(0); setNotQueued(0); } }, []);
  useEffect(() => {
    let alive = true;
    void Promise.all([AsyncStorage.getItem(SMS_CONSENT_KEY), AsyncStorage.getItem(SMS_SENDERS_KEY), AsyncStorage.getItem(SMS_ENABLED_KEY), AsyncStorage.getItem(SMS_LAST_RESULT_KEY)]).then(async ([accepted, senders, active, lastResult]) => {
      if (!alive) return;
      setConsentAccepted(accepted === "true");
      setSendersText(senders || "");
      if (lastResult) setResult(lastResult);
      if (active === "true" && accepted === "true" && Platform.OS === "android" && await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS)) {
        try { await configureSmsReader(true, true, (senders || "").split(/\r?\n/)); if (alive) setEnabled(true); } catch { /* Native module may need a rebuilt development client. */ }
      }
    });
    void updatePending();
    const sub = AppState.addEventListener("change", state => { if (state === "active") void updatePending(); });
    return () => { alive = false; sub.remove(); active.current?.abort(); active.current = null; };
  }, [updatePending]);

  const retry = async () => {
    if (active.current) return;
    const controller = new AbortController(); active.current = controller;
    setBusy(true); setError(null); setServiceAvailable(false);
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const records = await refreshTransactions(true, controller.signal);
      if (active.current === controller) {
        setServiceAvailable(true);
        setResult(`${records.length} backend transactions loaded into history and analytics.`);
      }
    } catch (failure) {
      if (active.current === controller && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Couldn't check transaction services. Please try again.");
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null; setBusy(false);
        if (controller.signal.aborted) setError("The check timed out. Check your connection and try again.");
      }
    }
  };

  const sendPending = async () => {
    if (busy || !enabled || !consentAccepted || !supported) return;
    const controller = new AbortController(); active.current = controller;
    setBusy(true); setError(null); setResult(null);
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const request = makeRequest(controller.signal);
      const imported = await drainQueuedBankAlerts(request, sendersText.split(/\r?\n/), () => refreshTransactions(true, controller.signal), async summary => {
        const formatted = formatSmsImportResult(summary);
        setResult(formatted);
        await AsyncStorage.setItem(SMS_LAST_RESULT_KEY, formatted);
      });
      if (!imported.submitted) setResult("There are no eligible bank alerts waiting to import.");
      else {
        const summary = formatSmsImportResult(imported.summary);
        setResult(summary); await AsyncStorage.setItem(SMS_LAST_RESULT_KEY, summary);
      }
      await updatePending();
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Couldn't import bank alerts. They remain encrypted on this device for retry.");
      else setError("The import timed out. Eligible alerts remain queued for a safe retry.");
    } finally { clearTimeout(timeout); active.current = null; setBusy(false); await updatePending(); }
  };

  const enable = async () => {
    setError(null); setResult(null);
    const senders = sendersText.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    if (!senders.length) { setError("Add the exact sender names or short codes used by your bank alerts before enabling import."); return; }
    if (!consentAccepted) { setError("Review and explicitly accept the SMS import disclosure first."); return; }
    if (Platform.OS !== "android") { setError("SMS inbox import is available only on Android. iPhone behavior is unchanged."); return; }
    if (!smsReaderAvailable()) { setError("Install an Android development or production build to use the SMS receiver. Expo Go does not include native SMS modules."); return; }
    try {
      const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS, {
        title: "Allow bank alert import?",
        message: "TallySpends uses incoming SMS permission only to capture bank transaction alerts from the senders you specify. Matching alerts are encrypted on this device and sent to your authenticated TallySpends account. OTP and unrelated messages are discarded before storage. Existing texts are never read.",
        buttonPositive: "Allow", buttonNegative: "Not now",
      });
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) { setError("SMS permission was not granted. Automatic import remains off."); return; }
      await AsyncStorage.setItem(SMS_CONSENT_KEY, "true");
      await AsyncStorage.setItem(SMS_SENDERS_KEY, senders.join("\n"));
      await configureSmsReader(true, true, senders);
      await AsyncStorage.setItem(SMS_ENABLED_KEY, "true");
      setEnabled(true); await updatePending();
      setResult("SMS alert import is enabled. Alerts are filtered locally and queued encrypted until the app can send them securely.");
    } catch { setError("Could not enable the Android SMS receiver. Rebuild the Android app and try again."); }
  };

  const disable = async () => {
    try { await configureSmsReader(false, false, []); await clearPendingSms(); } catch { /* Expo Go has no native module. */ }
    await AsyncStorage.removeItem(SMS_CONSENT_KEY); await AsyncStorage.removeItem(SMS_SENDERS_KEY);
    await AsyncStorage.removeItem(SMS_ENABLED_KEY);
    setConsentAccepted(false); setEnabled(false); setPending(0); setResult("SMS import is off. Consent and any queued message content have been cleared.");
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 20 }}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/transaction-history")}><Ionicons name="chevron-back" size={24} color={theme.textPrimary} /></Pressable><Text style={{ fontSize: 21, fontWeight: "800", color: theme.textPrimary }}>Automatic tracking</Text></View>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
      <View style={{ padding: 20, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, gap: 12 }}>
        <Ionicons name="sync-outline" size={27} color={theme.accent} />
        <Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: "700" }}>Bank transaction sync</Text>
        <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>Transactions returned by your account service appear in history, dashboard activity and analytics. The app refreshes this feed on sign-in, when reopened, and after SMS imports.</Text>
        <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>Device-only manual entries are preserved alongside backend records; they are never silently deleted during sync.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/linkedcards")}><Text style={{ color: theme.accent, fontWeight: "700" }}>View linked accounts</Text></Pressable>
      </View>
      {serviceAvailable && <Text accessibilityRole="alert" style={{ color: theme.textSecondary, lineHeight: 21 }}>Backend transactions have been refreshed into your history, dashboard activity and analytics.</Text>}
      <View style={{ padding: 20, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, gap: 12 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: "700" }}>Android SMS import</Text>
        {Platform.OS === "ios" ? <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>SMS inbox import is unavailable on iPhone. Existing iOS behavior is unchanged.</Text> : <>
          <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>When enabled, Android listens only for new incoming SMS. It does not read your message history. Exact bank senders and transaction-like debit/credit messages are checked locally; OTPs and unrelated messages are discarded. Eligible full message text is encrypted on this device while waiting to be sent to your authenticated TallySpends account.</Text>
          <Text style={{ color: pending >= 200 || notQueued > 0 ? theme.accent : theme.textSecondary, lineHeight: 21 }}>Pending alerts: {pending}. Android may start the receiver while the app is closed; eligible alerts remain encrypted and are uploaded when the app is foregrounded with a valid signed-in session. They are retained for up to seven days and are not removed when the network or server fails. {pending >= 200 ? "The local queue is full; import pending alerts now." : ""}{notQueued > 0 ? ` ${notQueued} eligible alert${notQueued === 1 ? " was" : "s were"} not queued because the queue was full or local encryption/storage failed.` : ""}</Text>
          <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Bank alert sender names or short codes</Text>
          <TextInput accessibilityLabel="Allowed bank SMS senders" multiline value={sendersText} onChangeText={setSendersText} editable={!enabled} placeholder="One exact sender per line" placeholderTextColor={theme.textSecondary} autoCapitalize="none" style={{ minHeight: 78, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.textPrimary, textAlignVertical: "top" }} />
          <Pressable disabled={enabled} accessibilityRole="checkbox" accessibilityState={{ checked: consentAccepted, disabled: enabled }} onPress={() => { const next = !consentAccepted; setConsentAccepted(next); void AsyncStorage.setItem(SMS_CONSENT_KEY, String(next)); }} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 4 }}><Ionicons name={consentAccepted ? "checkbox" : "square-outline"} size={22} color={theme.accent} /><Text style={{ flex: 1, color: theme.textSecondary, lineHeight: 20 }}>I agree that TallySpends may receive new incoming SMS, locally filter the senders listed above, temporarily encrypt eligible bank transaction alerts on this device, and send those alerts to my authenticated account for transaction tracking. I understand I can turn this off and clear pending alerts at any time.</Text></Pressable>
          <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>Android RECEIVE_SMS is a sensitive Google Play permission. The “SMS-based money management” exception requires declaration and review; this project has not confirmed Play approval. Production distribution must wait for the Play Console decision.</Text>
          {enabled ? <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable accessibilityRole="button" onPress={() => void sendPending()} disabled={busy} style={{ flex: 1, backgroundColor: theme.accent, borderRadius: 14, padding: 14, alignItems: "center" }}>{busy ? <ActivityIndicator color={theme.onAccent} /> : <Text style={{ color: theme.onAccent, fontWeight: "700" }}>Import pending alerts</Text>}</Pressable>
            <Pressable accessibilityRole="button" onPress={() => void disable()} style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, alignItems: "center" }}><Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Turn off</Text></Pressable>
          </View> : <Pressable accessibilityRole="button" onPress={() => void enable()} style={{ backgroundColor: theme.accent, borderRadius: 14, padding: 15, alignItems: "center" }}><Text style={{ color: theme.onAccent, fontWeight: "700" }}>Accept and enable SMS import</Text></Pressable>}
        </>}
      </View>
      {!!result && <Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary, lineHeight: 21 }}>{result}</Text>}
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.textSecondary, lineHeight: 21 }}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void retry()} style={{ backgroundColor: theme.accent, borderRadius: 16, padding: 16, alignItems: "center" }}>{busy ? <ActivityIndicator color={theme.onAccent} /> : <Text style={{ color: theme.onAccent, fontWeight: "700" }}>Check transaction service</Text>}</Pressable>
    </ScrollView>
  </SafeAreaView>;
}
