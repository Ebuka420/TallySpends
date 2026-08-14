import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";

const MENU_ITEMS = [
  {
    id: "link-bank",
    title: "Link Bank Account",
    subtitle:
      "Connect your accounts to automatically sync and track your transactions.",
    icon: "card-outline",
    iconColor: "#2980B9",
    bgColor: "#EBF5FB",
    route: "/linkbank",
  },
  {
    id: "customer-service",
    title: "Customer Service Center",
    subtitle: "Get help, contact support and view common questions.",
    icon: "headset-outline",
    iconColor: "#3A3A3C",
    bgColor: "#F2F2F7",
    route: "/customerservice",
  },
  {
    id: "premium",
    title: "Premium Plan",
    subtitle: "Unlock exclusive features and enhance your banking experience.",
    icon: "crown-outline",
    iconColor: "#6B58A6",
    bgColor: "#F1EFF8",
    route: "/membership",
  },
  {
    id: "youngins",
    title: "Youngins",
    subtitle: "Open an account for someone below 18.",
    icon: "people-outline",
    iconColor: "#34A853",
    bgColor: "#EEF7F1",
    route: "/youngins",
  },
  {
    id: "invitation",
    title: "Invitation",
    subtitle: "Invite friends and family and earn exciting rewards.",
    icon: "gift-outline",
    iconColor: "#C47C49",
    bgColor: "#FAF2EC",
    route: "/invitation",
  },
  {
    id: "rate-us",
    title: "Rate Us",
    subtitle: "Enjoying the app? Rate us on the App Store.",
    icon: "star-outline",
    iconColor: "#D9537E",
    bgColor: "#FDF0F3",
    route: "/rateus",
  },
];

export default function MoreScreen() {
  const router = useRouter();

  const { username = "User", themePreference = "aurora", themeMode } = useAppStore();

  const theme = getThemePalette(themePreference, themeMode);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.profileInfoRow}
          onPress={() => router.push("/profile")}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.avatarPlaceholder,
              {
                backgroundColor: theme.surfaceSoft,
              },
            ]}
          >
            <Ionicons name="person" size={28} color={theme.textSecondary} />
          </View>

          <Text
            style={[
              styles.profileNameText,
              {
                color: theme.textPrimary,
              },
            ]}
          >
            {`HI ${(username || "User").toUpperCase()}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsIconButton}
          onPress={() => router.push("/settings" as any)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollListContainer}
        showsVerticalScrollIndicator={false}
      >
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuCardRow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircleWrapper,
                {
                  backgroundColor: item.bgColor,
                },
              ]}
            >
              <Ionicons
                name={
                  (item.icon === "crown-outline"
                    ? "ribbon-outline"
                    : item.icon) as any
                }
                size={22}
                color={item.iconColor}
              />
            </View>

            <View style={styles.textDetailsColumn}>
              <Text
                style={[
                  styles.itemTitleText,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                {item.title}
              </Text>

              <Text
                style={[
                  styles.itemSubtitleText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                {item.subtitle}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },

  profileNameText: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 16,
  },

  settingsIconButton: {
    padding: 8,
  },

  scrollListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  menuCardRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    marginBottom: 4,
  },

  itemSubtitleText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
