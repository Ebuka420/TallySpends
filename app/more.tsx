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

const MENU_ITEMS = [
  {
    id: "security",
    title: "Security Center",
    subtitle: "Manage your PIN, biometric login, and account security.",
    icon: "shield-checkmark-outline",
    iconColor: "#5B4E91",
    bgColor: "#F0EEFA",
    route: "/profile",
  },
  {
    id: "customer-service",
    title: "Customer Service Center",
    subtitle: "Get help, contact support and view common questions.",
    icon: "headset-outline",
    iconColor: "#3A3A3C",
    bgColor: "#F2F2F7",
    route: "/support",
  },
  {
    id: "premium",
    title: "Premium Plan",
    subtitle: "Unlock exclusive features and enhance your banking experience.",
    icon: "crown-outline",
    iconColor: "#6B58A6",
    bgColor: "#F1EFF8",
    route: "/more", // Dynamic catch placeholders
  },
  {
    id: "youngins",
    title: "Youngins",
    subtitle: "Open an account for someone below 18.",
    icon: "people-outline",
    iconColor: "#34A853",
    bgColor: "#EEF7F1",
    route: "/more",
  },
  {
    id: "invitation",
    title: "Invitation",
    subtitle: "Invite friends and family and earn exciting rewards.",
    icon: "gift-outline",
    iconColor: "#C47C49",
    bgColor: "#FAF2EC",
    route: "/more",
  },
  {
    id: "rate-us",
    title: "Rate Us",
    subtitle: "Enjoying the app? Rate us on the App Store.",
    icon: "star-outline",
    iconColor: "#D9537E",
    bgColor: "#FDF0F3",
    route: "/more",
  },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header Profile Segment */}
      <View style={styles.headerContainer}>
        {/* Tapping here takes the user to profile.tsx */}
        <TouchableOpacity
          style={styles.profileInfoRow}
          onPress={() => router.push("/profile")}
          activeOpacity={0.7}
        >
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={28} color="#9BA3AF" />
          </View>
          <Text style={styles.profileNameText}>User</Text>
        </TouchableOpacity>

        {/* Tapping the gear icon takes the user to settings.tsx */}
        <TouchableOpacity
          style={styles.settingsIconButton}
          onPress={() => router.push("/settings" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#2C2C2E" />
        </TouchableOpacity>
      </View>

      {/* 2. Scrollable Menu Card Options */}
      <ScrollView
        contentContainerStyle={styles.scrollListContainer}
        showsVerticalScrollIndicator={false}
      >
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCardRow}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            {/* Left Circular Decorative Icon Area */}
            <View
              style={[
                styles.iconCircleWrapper,
                { backgroundColor: item.bgColor },
              ]}
            >
              <Ionicons
                name={
                  item.icon === "crown-outline"
                    ? "ribbon-outline"
                    : (item.icon as any)
                }
                size={22}
                color={item.iconColor}
              />
            </View>

            {/* Middle Label Layout Area */}
            <View style={styles.textDetailsColumn}>
              <Text style={styles.itemTitleText}>{item.title}</Text>
              <Text style={styles.itemSubtitleText}>{item.subtitle}</Text>
            </View>

            {/* Right Chevron Pointer Link indicator */}
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EBE9F5",
    alignItems: "center",
    justifyContent: "center",
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginLeft: 16,
  },
  settingsIconButton: {
    padding: 8,
  },
  scrollListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
});
