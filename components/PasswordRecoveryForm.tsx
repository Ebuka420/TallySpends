import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ThemePalette } from "../src/theme";
import { requestPasswordReset, resetPassword } from "../src/security/passwordRecovery";

export default function PasswordRecoveryForm({ theme, initialEmail = "", onCancel, onSuccess, successLabel = "Continue" }: {
  theme: ThemePalette; initialEmail?: string; onCancel: () => void; onSuccess: () => void; successLabel?: string;
}) {
  const [email, setEmail] = useState(initialEmail.includes("@") ? initialEmail : "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fieldStyle = [styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceSoft, borderColor: theme.border }];

  const run = async (work: (signal: AbortSignal) => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try { await work(controller.signal); }
    catch (caught) {
      setError(controller.signal.aborted ? "The request timed out. Please try again." : caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally { clearTimeout(timeout); setBusy(false); }
  };

  if (done) return <View style={styles.container}>
    <Text style={[styles.title, { color: theme.textPrimary }]}>Password updated</Text>
    <Text style={[styles.body, { color: theme.textSecondary }]}>Your account password has been changed. Sign in using your new password.</Text>
    <Pressable accessibilityRole="button" onPress={onSuccess} style={[styles.button, { backgroundColor: theme.accent }]}><Text style={{ color: theme.onAccent, fontWeight: "700" }}>{successLabel}</Text></Pressable>
  </View>;

  return <View style={styles.container}>
    <Text style={[styles.title, { color: theme.textPrimary }]}>Forgot password?</Text>
    <Text style={[styles.body, { color: theme.textSecondary }]}>{sent ? "If an account uses this email, a reset code has been sent. Enter it below to set a new password." : "Enter your account email and we’ll send a six-digit reset code."}</Text>
    <TextInput accessibilityLabel="Account email" value={email} onChangeText={setEmail} editable={!busy && !sent} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" placeholder="Email address" placeholderTextColor={theme.textSecondary} style={fieldStyle} />
    {sent && <>
      <TextInput accessibilityLabel="Six-digit reset code" value={code} onChangeText={value => setCode(value.replace(/\D/g, "").slice(0, 6))} editable={!busy} keyboardType="number-pad" maxLength={6} placeholder="6-digit reset code" placeholderTextColor={theme.textSecondary} style={fieldStyle} />
      <TextInput accessibilityLabel="New password" value={password} onChangeText={setPassword} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" placeholder="New password (at least 6 characters)" placeholderTextColor={theme.textSecondary} style={fieldStyle} />
      <TextInput accessibilityLabel="Confirm new password" value={confirmation} onChangeText={setConfirmation} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" placeholder="Confirm new password" placeholderTextColor={theme.textSecondary} style={fieldStyle} />
    </>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={[styles.body, { color: theme.textSecondary }]}>{notice}</Text>}
    {!!error && <Text accessibilityLiveRegion="assertive" style={[styles.body, { color: theme.danger }]}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => {
      if (!sent) void run(async signal => { await requestPasswordReset(email, signal); setSent(true); setNotice("If the address is registered, you’ll receive a reset code shortly."); });
      else if (password !== confirmation) setError("Your new passwords do not match.");
      else void run(async signal => { await resetPassword(email, code, password, signal); setPassword(""); setConfirmation(""); setCode(""); setDone(true); });
    }} style={[styles.button, { backgroundColor: theme.accent, opacity: busy ? 0.7 : 1 }]}>
      {busy ? <ActivityIndicator color={theme.onAccent} /> : <Text style={{ color: theme.onAccent, fontWeight: "700" }}>{sent ? "Reset password" : "Send reset code"}</Text>}
    </Pressable>
    {sent && !busy && <Pressable accessibilityRole="button" onPress={() => void run(async signal => { await requestPasswordReset(email, signal); setNotice("If the address is registered, a new reset code has been requested."); })}><Text style={[styles.link, { color: theme.accent }]}>Resend code</Text></Pressable>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={onCancel}><Text style={[styles.link, { color: theme.accent }]}>{done ? "Back to sign in" : "Cancel"}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({ container: { gap: 14 }, title: { fontSize: 22, fontWeight: "700", textAlign: "center" }, body: { fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 4 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 14 }, button: { minHeight: 48, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 4 }, link: { textAlign: "center", fontWeight: "600", paddingVertical: 8 } });
