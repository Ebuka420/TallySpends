import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const SETTINGS_ITEMS = [
  {
    id: "login",
    title: "Login Settings",
    subtitle: "Manage sign-in, passcodes, and biometric access",
    icon: "person-outline",
    route: "/settings-login",
  },
  {
    id: "saving",
    title: "Saving Settings",
    subtitle: "Fine-tune goals, transfers, and savings habits",
    icon: "wallet-outline",
    route: "/settings-savings",
  },
  {
    id: "dashboard",
    title: "Dashboard Settings",
    subtitle: "Choose what shows up on your dashboard",
    icon: "grid-outline",
    route: "/settings-dashboard",
  },
  {
    id: "themes",
    title: "Themes",
    subtitle: "Switch between polished app looks",
    icon: "color-palette-outline",
    route: "/settings-themes",
  },
  {
    id: "security",
    title: "Security Center",
    subtitle: "Protect your data and privacy with more control",
    icon: "shield-checkmark-outline",
    route: "/settings-security",
  },
  {
    id: "feedback",
    title: "Feedback & Suggestions",
    subtitle: "Share ideas, issues, and feature requests",
    icon: "chatbubble-outline",
    route: "/settings-feedback",
  },
  {
    id: "about",
    title: "About",
    subtitle: "App version, credits, and support details",
    icon: "information-circle-outline",
    route: "/settings-about",
    hasVersion: true,
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, themePreference } = useAppStore();
  const colorScheme = useColorScheme() || "light";
  const theme = getThemePalette(themePreference, colorScheme);
  const accent = theme.accent;
  const soft = theme.accentSoft;

  const handleLogout = () => {
    Alert.alert("Log out", "You’ll be returned to the sign-in flow.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/auth" as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[styles.headerContainer, { backgroundColor: theme.background }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollListContainer}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.heroIconCircle}>
            <Ionicons name="options-outline" size={22} color="#5B4E91" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Make TallySpends yours</Text>
            <Text style={styles.heroSubtitle}>
              Tweak the details that make the app feel calm, useful, and truly
              personal.
            </Text>
          </View>
        </View>

        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCardRow}
            activeOpacity={0.9}
            onPress={() => router.push(item.route as any)}
          >
            <View
              style={[styles.iconCircleWrapper, { backgroundColor: "#F0EEFA" }]}
            >
              <Ionicons name={item.icon as any} size={22} color="#5B4E91" />
            </View>

            <View style={styles.textDetailsColumn}>
              <Text style={styles.itemTitleText}>{item.title}</Text>
              <Text style={styles.itemSubtitleText}>{item.subtitle}</Text>
            </View>

            <View style={styles.rightActionWrapper}>
              {item.hasVersion && (
                <Text style={styles.versionText}>Version 1.0.0</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.actionCard, styles.secondaryActionCard]}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#5B4E91" />
          <Text style={styles.actionCardText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9FB",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FAF9FB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  headerSpacer: {
    width: 32,
  },
  scrollListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
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
  heroTextWrap: {
    flex: 1,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: "#8E8E93",
    lineHeight: 18,
  },
  menuCardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconCircleWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textDetailsColumn: {
    flex: 1,
    paddingHorizontal: 14,
  },
  itemTitleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  itemSubtitleText: {
    fontSize: 12,
    color: "#8E8E93",
    lineHeight: 16,
  },
  rightActionWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  versionText: {
    fontSize: 13,
    color: "#8E8E93",
    marginRight: 8,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "#F7DAD9",
  },
  secondaryActionCard: {
    marginBottom: 12,
  },
  actionCardText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#5B4E91",
  },
  actionCardTextDanger: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#C0392B",
  },
});
