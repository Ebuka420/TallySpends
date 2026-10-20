import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { useAppStore } from "../src/store";
import { useSecurity } from "../components/SecurityGate";


const options = [
  {
    id: "biometric",
    title: "Face / Fingerprint",
    subtitle: "Use biometrics when available",
  },
];

export default function SettingsLoginScreen() {
  const router = useRouter();
  const { theme } = useAppStore();
  const security = useSecurity();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (saving) return;
    setSaving(true);
    try { await security.setBiometrics(!security.biometrics); }
    catch (error) { Alert.alert("Biometric access", error instanceof Error ? error.message : "Couldn't update biometric access."); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Login Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="lock-closed-outline" size={22} color={theme.accent} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Secure access</Text>
            <Text style={styles.heroSubtitle}>
              Set a login setup that feels quick, safe, and comfortable for you.
            </Text>
          </View>
        </View>

        <View style={styles.card}><View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle}>Six-digit app PIN</Text>
          <Text style={styles.cardSubtitle}>Required when opening the app. Saved securely on this device.</Text>
        </View><Ionicons name="shield-checkmark-outline" size={24} color={theme.accent} /></View>
        <Pressable accessibilityRole="button" style={styles.card} onPress={() => router.push("/settings-password" as any)}>
          <View style={styles.cardTextWrap}><Text style={styles.cardTitle}>Reset Password</Text><Text style={styles.cardSubtitle}>Change your password using your current password</Text></View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.card} onPress={() => security.lock()}>
          <View style={styles.cardTextWrap}><Text style={styles.cardTitle}>Reset app PIN</Text><Text style={styles.cardSubtitle}>On the lock screen, choose Forgot PIN and verify your account password</Text></View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Pressable>
        {options.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{security.biometricIssue || "Use Face ID or fingerprint to open the app and confirm transfers. Your six-digit PIN remains available."}</Text>
            </View>
            <Switch
              value={security.biometrics}
              accessibilityLabel="Use Face ID or fingerprint for app access and transfers"
              disabled={saving || (!!security.biometricIssue && !security.biometrics)}
              onValueChange={() => void toggle()}
              thumbColor={theme.surface}
              trackColor={{ false: theme.border, true: theme.accent }}
            />
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && styles.primaryActionPressed,
          ]}
          onPress={() => security.lock()}
        >
          <Text style={styles.primaryActionText}>Lock app now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: theme.textPrimary },
    headerSpacer: { width: 32 },
    scrollContent: { paddingBottom: 28, paddingHorizontal: 20 },
    heroCard: {
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 1,
    },
    heroIconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    heroTextWrap: { flex: 1 },
    heroTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 4,
    },
    heroSubtitle: { fontSize: 12.5, color: theme.textSecondary, lineHeight: 18 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    cardPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
    cardTextWrap: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: theme.textPrimary },
    cardSubtitle: { fontSize: 12.5, color: theme.textSecondary, marginTop: 4 },
    primaryAction: {
      backgroundColor: theme.accent,
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 10,
      alignItems: "center",
    },
    primaryActionPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
    primaryActionText: { color: theme.onAccent, fontWeight: "700" },
  });
