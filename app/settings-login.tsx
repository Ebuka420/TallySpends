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


const options = [
  {
    id: "pin",
    title: "Passcode Lock",
    subtitle: "Require a passcode to open the app",
  },
  {
    id: "biometric",
    title: "Face / Fingerprint",
    subtitle: "Use biometrics when available",
  },
  {
    id: "auto",
    title: "Auto Sign-In",
    subtitle: "Stay signed in on this device",
  },
  {
    id: "reminders",
    title: "Lock reminders",
    subtitle: "Get a gentle prompt to re-secure the app",
  },
  {
    id: "recovery",
    title: "Recovery hints",
    subtitle: "Show support hints for sign-in recovery",
  },
];

export default function SettingsLoginScreen() {
  const router = useRouter();
  const { theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [values, setValues] = useState({
    pin: true,
    biometric: true,
    auto: false,
    reminders: true,
    recovery: false,
  });

  const toggle = (key: string) => {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
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
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Switch
              value={values[item.id as keyof typeof values]}
              onValueChange={() => toggle(item.id)}
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
          onPress={() => Alert.alert("Saved", "Login preferences updated.")}
        >
          <Text style={styles.primaryActionText}>Save Changes</Text>
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
      shadowColor: "#000",
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
    primaryActionText: { color: theme.surface, fontWeight: "700" },
  });
