import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, AppState, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "./AuthBackdrop";
import type { ThemePalette } from "../src/theme";
import BrandMark from "./BrandMark";
import { SetupBackground } from "./onboarding/SetupFrame";
import { StatusBar } from "expo-status-bar";

export default function PinScreen({ theme, setup = false, transfer = false, biometric = false, onboarding = false, onBiometric, onSubmit, onRecover, onCancel, onSignOut }: {
  theme: ThemePalette; setup?: boolean; transfer?: boolean; biometric?: boolean; onboarding?: boolean;
  onBiometric?: () => Promise<void>; onSubmit: (pin: string, reset: boolean) => Promise<void>;
  onRecover?: (password: string) => Promise<void>; onCancel?: () => void; onSignOut?: () => void;
}) {
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState("");
  const [reset, setReset] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const reduced = useReducedMotion();
  const [entrance] = useState(() => new Animated.Value(0));
  const [shake] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const listener = AppState.addEventListener("change", state => {
      if (state === "background") { setPin(""); setFirst(""); setPassword(""); setReset(false); setRecovery(false); }
    });
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (reduced === null) return;
    if (reduced) { entrance.setValue(1); return; }
    const animation = Animated.spring(entrance, { toValue: 1, friction: 7, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [reduced, entrance]);
  const fail = (message: string) => {
    setError(message); setPin("");
    if (!reduced) Animated.sequence([-9, 9, -6, 6, 0].map(toValue => Animated.timing(shake, { toValue, duration: 65, useNativeDriver: true }))).start();
  };
  const run = async (work: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try { await work(); } catch (e) { fail(e instanceof Error ? e.message : "Couldn't verify. Please try again."); }
    finally { locked.current = false; setBusy(false); }
  };
  const submit = (value: string) => {
    if (busy || locked.current) return;
    setPin(value);
    if (value.length !== 6) return;
    if (setup || reset) {
      if (!first) { setFirst(value); setPin(""); return; }
      if (first !== value) { setFirst(""); fail("The PINs didn't match. Enter your new PIN again."); return; }
    }
    void run(async () => { await onSubmit(value, reset); setPin(""); setFirst(""); });
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    {onboarding && <><StatusBar style="dark" /><SetupBackground step={3} /></>}
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      {onboarding && <Text style={[s.brand, { color: theme.textSecondary, textAlign: "center" }]}>SETUP 3 OF 4</Text>}
      <Animated.View style={{ alignItems: "center", gap: 18, opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
        <View style={[s.mark, { backgroundColor: theme.accentSoft }]}>{onboarding ? <BrandMark size={56} palette={theme} /> : <Ionicons name="shield-checkmark-outline" size={40} color={theme.accent} />}</View>
        <Text style={[s.brand, { color: theme.accent }]}>TALLYSPENDS</Text>
        <Text style={[s.title, { color: theme.textPrimary }]}>{recovery ? "Forgot your PIN?" : setup || reset ? first ? "Confirm your PIN" : "Create your PIN" : transfer ? "Confirm it's you" : "Welcome back"}</Text>
        <Text style={[s.copy, { color: theme.textSecondary }]}>{recovery ? "Verify your account password to set a new six-digit app PIN." : setup || reset ? "Choose a six-digit PIN. You'll use it to unlock TallySpends on this device and confirm transfers." : transfer ? "Use your PIN or enabled biometrics to confirm this action." : "Enter your six-digit PIN to unlock your account."}</Text>
      </Animated.View>
      {recovery ? <View style={{ gap: 16 }}>
        <TextInput accessibilityLabel="Account password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" editable={!busy}
          placeholder="Account password" placeholderTextColor={theme.textSecondary} style={[s.password, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]} />
        <Pressable disabled={busy || !password} accessibilityRole="button" style={[s.primary, { backgroundColor: theme.accent }]} onPress={() => void run(async () => {
          const value = password; setPassword(""); await onRecover?.(value); setRecovery(false); setReset(true); setFirst(""); setPin("");
        })}><Text style={{ color: theme.onAccent, fontWeight: "700" }}>Verify password</Text></Pressable>
        <Pressable disabled={busy} onPress={() => { setRecovery(false); setPassword(""); setError(""); }}><Text style={[s.copy, { color: theme.accent }]}>Back to PIN</Text></Pressable>
      </View> : <>
        <Animated.View accessible accessibilityLabel={`${pin.length} of 6 PIN digits entered`} style={[s.dots, { transform: [{ translateX: shake }] }]}>
          {Array.from({ length: 6 }, (_, index) => <View key={index} style={[s.dot, { borderColor: theme.accent, backgroundColor: pin.length > index ? theme.accent : "transparent" }]} />)}
        </Animated.View>
        <View style={s.keypad}>{["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "delete"].map(value => <Pressable key={value} accessibilityRole="button"
          accessibilityLabel={value === "delete" ? "Delete last digit" : value === "bio" ? "Use Face ID or fingerprint" : value}
          disabled={busy || (value === "bio" && (!biometric || setup || reset))}
          onPress={() => value === "delete" ? setPin(pin.slice(0, -1)) : value === "bio" ? void run(async () => { await onBiometric?.(); }) : submit((pin + value).slice(0, 6))}
          style={({ pressed }) => [s.key, { backgroundColor: pressed ? theme.accentSoft : "transparent" }]}>
          {value === "delete" ? <Ionicons name="backspace-outline" size={25} color={theme.textPrimary} /> : value === "bio" ? biometric && !setup && !reset && <Ionicons name="finger-print" size={29} color={theme.accent} /> : <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: "500" }}>{value}</Text>}
        </Pressable>)}</View>
        {!setup && !reset && onRecover && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setRecovery(true); setPin(""); setError(""); }}><Text style={[s.copy, { color: theme.accent, fontWeight: "600" }]}>Forgot PIN?</Text></Pressable>}
        {(setup || reset) && !!first && <Pressable disabled={busy} onPress={() => { setFirst(""); setPin(""); }}><Text style={[s.copy, { color: theme.accent }]}>Choose a different PIN</Text></Pressable>}
      </>}
      {busy && <ActivityIndicator color={theme.accent} />}
      {!!error && <Text accessibilityLiveRegion="assertive" style={[s.copy, { color: theme.danger }]}>{error}</Text>}
      {onCancel && <Pressable disabled={busy} accessibilityRole="button" onPress={onCancel}><Text style={[s.copy, { color: theme.accent }]}>Cancel</Text></Pressable>}
      {onSignOut && <Pressable disabled={busy} accessibilityRole="button" onPress={onSignOut}><Text style={[s.copy, { color: theme.textSecondary }]}>Sign out</Text></Pressable>}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({ page: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 28, gap: 20, maxWidth: 460, width: "100%", alignSelf: "center" }, mark: { width: 82, height: 82, borderRadius: 28, alignItems: "center", justifyContent: "center" }, brand: { fontSize: 10, letterSpacing: 2, fontWeight: "700" }, title: { fontSize: 28, fontWeight: "700", textAlign: "center" }, copy: { fontSize: 13, lineHeight: 20, textAlign: "center" }, dots: { flexDirection: "row", gap: 17, justifyContent: "center", paddingVertical: 12 }, dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 }, keypad: { flexDirection: "row", flexWrap: "wrap" }, key: { width: "33.333%", height: 66, alignItems: "center", justifyContent: "center", borderRadius: 25 }, password: { borderWidth: 1, padding: 16, borderRadius: 16 }, primary: { padding: 16, borderRadius: 16, alignItems: "center" } });

