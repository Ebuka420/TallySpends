import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const SETTINGS_ITEMS = [
  {
    id: "login",
    title: "Login Settings",
    subtitle: "Manage PIN and biometric login",
    icon: "person-outline",
    iconColor: "#5B4E91",
    bgColor: "#F0EEFA",
  },
  {
    id: "saving",
    title: "Saving Settings",
    subtitle: "Configure savings goals and preferences",
    icon: "wallet-outline", // Clean alternative matching the green savings theme
    iconColor: "#34A853",
    bgColor: "#EEF7F1",
  },
  {
    id: "dashboard",
    title: "Dashboard Settings",
    subtitle: "Customize what appears on your dashboard",
    icon: "grid-outline",
    iconColor: "#5B4E91",
    bgColor: "#F0EEFA",
  },
  {
    id: "themes",
    title: "Themes",
    subtitle: "Choose your app appearance",
    icon: "color-palette-outline",
    iconColor: "#C47C49",
    bgColor: "#FAF2EC",
  },
  {
    id: "security",
    title: "Security Center",
    subtitle: "Security, verification and privacy",
    icon: "shield-checkmark-outline",
    iconColor: "#34A853",
    bgColor: "#EEF7F1",
  },
  {
    id: "feedback",
    title: "Feedback & Suggestions",
    subtitle: "Help us improve the app",
    icon: "chatbubble-outline",
    iconColor: "#3A3A3C",
    bgColor: "#F2F2F7",
  },
  {
    id: "close-account",
    title: "Close Account",
    subtitle: "Permanently close your account",
    icon: "person-remove-outline",
    iconColor: "#D9537E",
    bgColor: "#FDF0F3",
  },
  {
    id: "about",
    title: "About",
    subtitle: "Version information and legal details",
    icon: "information-circle-outline",
    iconColor: "#C47C49",
    bgColor: "#FAF2EC",
    hasVersion: true,
  },
];

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header Group */}
      <View style={styles.headerContainer}>
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

      {/* Main Settings Menu List Items */}
      <ScrollView
        contentContainerStyle={styles.scrollListContainer}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCardRow}
            activeOpacity={0.9} // Keeping static/inactive for now as requested
          >
            {/* Left Decorative Circular Vector Area */}
            <View
              style={[
                styles.iconCircleWrapper,
                { backgroundColor: item.bgColor },
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.iconColor}
              />
            </View>

            {/* Middle Label Blocks */}
            <View style={styles.textDetailsColumn}>
              <Text style={styles.itemTitleText}>{item.title}</Text>
              <Text style={styles.itemSubtitleText}>{item.subtitle}</Text>
            </View>

            {/* Right Meta Data / Navigation Pointer */}
            <View style={styles.rightActionWrapper}>
              {item.hasVersion && (
                <Text style={styles.versionText}>Version 1.0.0</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Bottom Danger Action Card */}
        <TouchableOpacity style={styles.logOutButtonCard} activeOpacity={0.8}>
          <Text style={styles.logOutText}>Log Out</Text>
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
    width: 32, // Perfect offset to center the heading title text balancing back button
  },
  scrollListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  menuCardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
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
    paddingHorizontal: 16,
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
  logOutButtonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  logOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D9537E",
  },
});
