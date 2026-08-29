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
import { useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";

interface InsightItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const INSIGHT_ITEMS: InsightItem[] = [
  {
    id: "item-1",
    title: "Budgeting Based on Spending",
    subtitle: "Get AI-generated budgets based on your habits.",
    icon: "pie-chart-outline",
    route: "/budgetspending",
  },
  {
    id: "item-2",
    title: "Savings Progress",
    subtitle: "Monitor your savings goals and achievements.",
    icon: "wallet-outline",
    route: "/savingsprogress",
  },
  {
    id: "item-3",
    title: "Ajo Circles",
    subtitle: "Save together with family and community circles.",
    icon: "people-outline",
    route: "/ajo",
  },
];

export default function BudgetScreen() {
  const router = useRouter();
  const { themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header Section */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Budget
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Smart insights to help you save and grow.
            </Text>
          </View>
        </View>

        {/* Clean Action Cards List */}
        <View style={styles.cardsList}>
          {INSIGHT_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.actionCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.78}
            >
              {/* Left Large Icon Box */}
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark ? theme.surfaceSoft : "#F4EBF8",
                  },
                ]}
              >
                <Ionicons name={item.icon} size={24} color={theme.accent} />
              </View>

              {/* Middle Content */}
              <View style={styles.cardContentCol}>
                <Text
                  style={[styles.cardTitle, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                <Text
                  style={[styles.cardSubtitle, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.subtitle}
                </Text>
              </View>

              {/* Right Chevron */}
              <View style={styles.chevronCol}>
                <Ionicons name="chevron-forward" size={18} color={theme.accent} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    marginTop: 6,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  cardsList: {
    gap: 16,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    flexShrink: 0,
  },
  cardContentCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "400",
  },
  chevronCol: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    flexShrink: 0,
  },
});
