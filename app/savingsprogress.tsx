import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const SAVINGS_GOALS_DATA = [
  {
    id: "goal-1",
    name: "MacBook Pro M3 Max",
    current: 450000,
    target: 900000,
    targetDate: "December 2026",
    category: "Gadgets & Work",
    monthlyContribution: "₦50,000 / mo",
    color: "#2ECC71",
    icon: "laptop-outline" as const,
  },
  {
    id: "goal-2",
    name: "Emergency Reserve (6 Months)",
    current: 820000,
    target: 1200000,
    targetDate: "Ongoing Stash",
    category: "Financial Safety",
    monthlyContribution: "₦60,000 / mo",
    color: "#3498DB",
    icon: "shield-checkmark-outline" as const,
  },
  {
    id: "goal-3",
    name: "December Holiday & Travel",
    current: 180000,
    target: 300000,
    targetDate: "November 2026",
    category: "Vacation",
    monthlyContribution: "₦40,000 / mo",
    color: "#E67E22",
    icon: "airplane-outline" as const,
  },
  {
    id: "goal-4",
    name: "Vehicle Maintenance Fund",
    current: 95000,
    target: 200000,
    targetDate: "October 2026",
    category: "Automobile",
    monthlyContribution: "₦25,000 / mo",
    color: "#9B59B6",
    icon: "car-sport-outline" as const,
  },
];

export default function SavingsProgressScreen() {
  const router = useRouter();
  const { themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const totalSaved = useMemo(() => {
    return SAVINGS_GOALS_DATA.reduce((acc, g) => acc + g.current, 0);
  }, []);

  const totalTarget = useMemo(() => {
    return SAVINGS_GOALS_DATA.reduce((acc, g) => acc + g.target, 0);
  }, []);

  const overallPercent = useMemo(() => {
    return totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  }, [totalSaved, totalTarget]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Savings Progress
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/deposit")}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Savings Accumulation Hero */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.heroMetaLabel, { color: theme.textSecondary }]}>
            TOTAL SAVINGS ACCUMULATION
          </Text>
          <View style={styles.heroAmountRow}>
            <Text style={[styles.heroBigAmount, { color: theme.textPrimary }]}>
              ₦{totalSaved.toLocaleString()}
            </Text>
            <Text style={[styles.heroTargetAmount, { color: theme.textSecondary }]}>
              / ₦{totalTarget.toLocaleString()}
            </Text>
          </View>

          {/* Progress Bar */}
          <View
            style={[
              styles.overallProgressBarBg,
              { backgroundColor: isDark ? theme.surfaceSoft : "#EAE6EC" },
            ]}
          >
            <View
              style={[
                styles.overallProgressBarFill,
                {
                  width: `${Math.min(overallPercent, 100)}%`,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          </View>

          <View style={styles.heroFooterRow}>
            <Text style={[styles.heroFooterText, { color: theme.textSecondary }]}>
              {overallPercent}% towards total targets
            </Text>
            <Text style={[styles.heroFooterRemaining, { color: theme.accent }]}>
              ₦{(totalTarget - totalSaved).toLocaleString()} left to fund
            </Text>
          </View>
        </View>

        {/* Quick Deposit Action Banner */}
        <TouchableOpacity
          style={[styles.depositActionBtn, { backgroundColor: theme.accent }]}
          onPress={() => router.push("/deposit")}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up-circle-outline" size={19} color="#FFFFFF" />
          <Text style={styles.depositActionBtnText}>Deposit to Savings Goal</Text>
        </TouchableOpacity>

        {/* Active Savings Goals Section */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Active Savings Targets ({SAVINGS_GOALS_DATA.length})
        </Text>

        <View style={{ gap: 12 }}>
          {SAVINGS_GOALS_DATA.map((goal) => {
            const goalPercent = Math.round((goal.current / goal.target) * 100);
            return (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.goalTopRow}>
                  <View style={styles.goalTopLeft}>
                    <View
                      style={[
                        styles.goalIconBox,
                        { backgroundColor: isDark ? "#1E2B24" : "#E8F8F0" },
                      ]}
                    >
                      <Ionicons name={goal.icon} size={18} color={goal.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[styles.goalNameTitle, { color: theme.textPrimary }]}
                        numberOfLines={1}
                      >
                        {goal.name}
                      </Text>
                      <Text style={[styles.goalCategorySub, { color: theme.textSecondary }]}>
                        {goal.category} · Target: {goal.targetDate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.goalPercentBadge}>
                    <Text style={[styles.goalPercentText, { color: theme.accent }]}>
                      {goalPercent}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View
                  style={[
                    styles.goalProgressBarBg,
                    { backgroundColor: isDark ? theme.surfaceSoft : "#EAE6EC" },
                  ]}
                >
                  <View
                    style={[
                      styles.goalProgressBarFill,
                      {
                        width: `${Math.min(goalPercent, 100)}%`,
                        backgroundColor: goal.color,
                      },
                    ]}
                  />
                </View>

                {/* Bottom Row */}
                <View style={styles.goalBottomRow}>
                  <View>
                    <Text style={[styles.goalSavedNumber, { color: theme.textPrimary }]}>
                      ₦{goal.current.toLocaleString()}
                    </Text>
                    <Text style={[styles.goalSubAmount, { color: theme.textSecondary }]}>
                      of ₦{goal.target.toLocaleString()}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.goalRunRateLabel, { color: theme.textSecondary }]}>
                      Monthly Pace
                    </Text>
                    <Text style={[styles.goalRunRateValue, { color: theme.accent }]}>
                      {goal.monthlyContribution}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Ajo Circles Community Savings Section */}
        <View style={{ marginTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 2 }]}>
                Ajo Community Circles
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                Collaborative rotational savings with family & circles
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/ajo")}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: theme.accent }}>
                View All
              </Text>
              <Ionicons name="chevron-forward" size={13} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {/* Ajo Circle Interactive Card */}
          <TouchableOpacity
            style={[
              styles.goalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => router.push("/ajo")}
            activeOpacity={0.85}
          >
            <View style={styles.goalTopRow}>
              <View style={styles.goalTopLeft}>
                <View
                  style={[
                    styles.goalIconBox,
                    { backgroundColor: isDark ? "#322338" : "#F3EBF1" },
                  ]}
                >
                  <Ionicons name="people" size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text
                      style={[styles.goalNameTitle, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      Tech Founders Circle
                    </Text>
                    <View
                      style={{
                        backgroundColor: isDark ? "#133E23" : "#DCFCE7",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 9.5, fontWeight: "700", color: "#15803D" }}>
                        Active
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.goalCategorySub, { color: theme.textSecondary }]}>
                    8 members · Monthly contribution
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color={theme.accent} />
            </View>

            {/* Payout Details */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: isDark ? theme.surfaceSoft : "#FAF7FA",
                borderRadius: 10,
                padding: 10,
                marginTop: 8,
              }}
            >
              <View>
                <Text style={{ fontSize: 10.5, color: theme.textSecondary, fontWeight: "500" }}>
                  Your Payout Position
                </Text>
                <Text style={{ fontSize: 13.5, color: theme.textPrimary, fontWeight: "800", marginTop: 1 }}>
                  Position #3 (₦400,000)
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 10.5, color: theme.textSecondary, fontWeight: "500" }}>
                  Next Payout
                </Text>
                <Text style={{ fontSize: 12, color: theme.accent, fontWeight: "700", marginTop: 1 }}>
                  15th of next month
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  heroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  heroMetaLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  heroBigAmount: {
    fontSize: 27,
    fontWeight: "800",
  },
  heroTargetAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  overallProgressBarBg: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
    marginBottom: 8,
  },
  overallProgressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  heroFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroFooterText: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  heroFooterRemaining: {
    fontSize: 12,
    fontWeight: "700",
  },
  depositActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 18,
  },
  depositActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  goalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  goalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  goalTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  goalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  goalNameTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  goalCategorySub: {
    fontSize: 11,
    marginTop: 2,
  },
  goalPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  goalPercentText: {
    fontSize: 13,
    fontWeight: "800",
  },
  goalProgressBarBg: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
    marginBottom: 10,
  },
  goalProgressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  goalBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalSavedNumber: {
    fontSize: 14.5,
    fontWeight: "800",
  },
  goalSubAmount: {
    fontSize: 11,
    fontWeight: "500",
  },
  goalRunRateLabel: {
    fontSize: 10.5,
    fontWeight: "500",
    marginBottom: 1,
  },
  goalRunRateValue: {
    fontSize: 12,
    fontWeight: "700",
  },
});
