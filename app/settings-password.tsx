import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../src/store";
import { getProfileSnapshot } from "../src/profile/repository";
import { changePassword } from "../src/security/api";
export default function PasswordSettings() {
  const { theme, logout, login } = useAppStore(); const router = useRouter();
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null); const lock = useRef(false);
  useEffect(() => () => { request.current?.abort(); }, []);
  const submit = async () => {
    if (lock.current) return;
    if (!current || next.length < 8 || next !== confirm || current === next) { setError("Enter your current password and matching new passwords of at least 8 characters. Choose a different password."); return; }
    const session = getProfileSnapshot();
    if (!session.token || !session.scope) { setError("Sign in again before changing your password."); return; }
    lock.current = true; setBusy(true); setError("");
    const controller = new AbortController(); request.current = controller; const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      await changePassword(session.token, current, next, controller.signal, fetch, { refreshToken: session.refreshToken, saveTokens: async (access, refresh) => {
        if (getProfileSnapshot().scope !== session.scope) throw new Error("Your account changed. Please sign in again.");
        await login(access, refresh);
      } });
      if (getProfileSnapshot().scope !== session.scope || controller.signal.aborted) return;
      setCurrent(""); setNext(""); setConfirm("");
      // End the old local session; don't assume which remote tokens were revoked.
      await logout();
      Alert.alert("Password changed", "Sign in again with your new password.");
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Couldn't change your password."); else setError("The request timed out. Your password may have changed. Try signing in with your new password before retrying."); }
    finally { clearTimeout(timeout); request.current = null; lock.current = false; setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
      <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={theme.textPrimary} /></Pressable>
      <Text style={{ fontSize: 25, fontWeight: "700", color: theme.textPrimary }}>Reset Password</Text>
      <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>Enter your current password to choose a new one. You will sign in again after the change.</Text>
      {([{ label: "Current password", value: current, update: setCurrent }, { label: "New password", value: next, update: setNext }, { label: "Confirm new password", value: confirm, update: setConfirm }]).map(field => <TextInput key={field.label} accessibilityLabel={field.label} placeholder={field.label} placeholderTextColor={theme.textSecondary} value={field.value} onChangeText={field.update} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy} style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }} />)}
      {!!error && <Text accessibilityLiveRegion="polite" style={{ color: theme.danger }}>{error}</Text>}
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={{ padding: 17, alignItems: "center", backgroundColor: theme.accent, borderRadius: 16 }}><Text style={{ color: theme.background, fontWeight: "700" }}>{busy ? "Changing password…" : "Change password"}</Text></Pressable>
      <Text style={{ color: theme.textSecondary, lineHeight: 21 }}>Forgot your account password? Email tallyspends@gmail.com for account recovery help. Automated email or OTP recovery is not available yet.</Text>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}
