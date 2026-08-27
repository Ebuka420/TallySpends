import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";

const CATEGORY_META: Record<
  string,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    soft: string;
    darkColor: string;
    darkSoft: string;
  }
> = {
  "Food & Dining": {
    icon: "fast-food-outline",
    color: "#8B3A62",
    soft: "#F8EDF3",
    darkColor: "#E09ABF",
    darkSoft: "#3D2232",
  },
  Transport: {
    icon: "car-outline",
    color: "#5B4E91",
    soft: "#F0EEF9",
    darkColor: "#A397E0",
    darkSoft: "#2A2346",
  },
  Shopping: {
    icon: "bag-handle-outline",
    color: "#B45309",
    soft: "#FEF3C7",
    darkColor: "#FBBF24",
    darkSoft: "#422808",
  },
  "Bills & Utilities": {
    icon: "document-text-outline",
    color: "#15803D",
    soft: "#DCFCE7",
    darkColor: "#4ADE80",
    darkSoft: "#133E23",
  },
  Entertainment: {
    icon: "film-outline",
    color: "#7C3AED",
    soft: "#F3E8FF",
    darkColor: "#C084FC",
    darkSoft: "#36165F",
  },
  "Health & Wellness": {
    icon: "heart-outline",
    color: "#BE123C",
    soft: "#FFE4E6",
    darkColor: "#FB7185",
    darkSoft: "#4C101F",
  },
  Others: {
    icon: "grid-outline",
    color: "#475569",
    soft: "#F1F5F9",
    darkColor: "#94A3B8",
    darkSoft: "#1E293B",
  },
};

const AVAILABLE_MONTHS = [
  { id: "2026-08", label: "August 2026", year: 2026, month: 7 },
  { id: "2026-07", label: "July 2026", year: 2026, month: 6 },
  { id: "2026-06", label: "June 2026", year: 2026, month: 5 },
  { id: "2024-05", label: "May 2024", year: 2024, month: 4 },
  { id: "2024-04", label: "April 2024", year: 2024, month: 3 },
];

export default function SmartInsightsScreen() {
  const router = useRouter();
  const {
    transactions: rawTransactions = [],
    budgets = {},
    themePreference,
    themeMode,
  } = useAppStore();

  const transactions = rawTransactions as any[];
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  // Selected Month
  const [selectedMonthId, setSelectedMonthId] = useState("2026-08");
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const currentMonthLabel = useMemo(() => {
    const found = AVAILABLE_MONTHS.find((m) => m.id === selectedMonthId);
    return found ? found.label : "August 2026";
  }, [selectedMonthId]);

  // Derived financial computations
  const analyticsData = useMemo(() => {
    const isMay2024 = selectedMonthId === "2024-05";

    const monthTxns = transactions.filter((tx) => {
      if (isMay2024) {
        return tx.date && tx.date.startsWith("2024-05") && tx.type === "expense";
      }
      return tx.type === "expense";
    });

    let totalSpent = 0;
    const catTotals: Record<string, { total: number; count: number }> = {};

    monthTxns.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      totalSpent += amt;
      const cat = tx.category || "Others";
      const normalizedCat = CATEGORY_META[cat] ? cat : "Others";
      if (!catTotals[normalizedCat]) {
        catTotals[normalizedCat] = { total: 0, count: 0 };
      }
      catTotals[normalizedCat].total += amt;
      catTotals[normalizedCat].count += 1;
    });

    if (totalSpent === 0 || (!isMay2024 && totalSpent < 1000)) {
      totalSpent = 228540;
      catTotals["Food & Dining"] = { total: 72400, count: 18 };
      catTotals["Transport"] = { total: 31200, count: 12 };
      catTotals["Shopping"] = { total: 44800, count: 8 };
      catTotals["Bills & Utilities"] = { total: 46200, count: 5 };
      catTotals["Entertainment"] = { total: 21940, count: 6 };
      catTotals["Others"] = { total: 12000, count: 3 };
    }

    const previousMonthSpend = Math.round(totalSpent / 1.124);
    const diffPercent = Math.round(
      ((totalSpent - previousMonthSpend) / previousMonthSpend) * 100
    );
    const isSpendUp = diffPercent >= 0;

    let totalBudgetCap = 0;
    const categoriesList = Object.keys(CATEGORY_META).map((catName) => {
      const spent = catTotals[catName]?.total || 0;
      const count = catTotals[catName]?.count || 0;
      const aiDefaultLimit =
        budgets[catName] ||
        (spent > 0 ? Math.ceil((spent * 1.25) / 1000) * 1000 : 30000);

      totalBudgetCap += aiDefaultLimit;
      const ratio = aiDefaultLimit > 0 ? spent / aiDefaultLimit : 0;
      let status: "on_track" | "near_limit" | "exceeded" = "on_track";
      if (ratio > 1) status = "exceeded";
      else if (ratio >= 0.8) status = "near_limit";

      return {
        name: catName,
        spent,
        count,
        limit: aiDefaultLimit,
        ratio: Math.min(ratio, 1.5),
        percent: Math.round(ratio * 100),
        status,
      };
    });

    const topCategoryItem = categoriesList.reduce(
      (max, c) => (c.spent > max.spent ? c : max),
      categoriesList[0]
    );

    const dailyAverage = Math.round(totalSpent / 26);
    const projectedMonthEnd = Math.round(dailyAverage * 31);
    const budgetPercent = totalBudgetCap > 0 ? Math.round((totalSpent / totalBudgetCap) * 100) : 74;

    return {
      totalSpent,
      previousMonthSpend,
      diffPercent: Math.abs(diffPercent),
      isSpendUp,
      dailyAverage,
      projectedMonthEnd,
      totalBudgetCap,
      budgetPercent,
      topCategory: {
        name: topCategoryItem.name,
        spent: topCategoryItem.spent,
        percentageOfTotal:
          totalSpent > 0
            ? Math.round((topCategoryItem.spent / totalSpent) * 100)
            : 0,
        count: topCategoryItem.count,
      },
      categoriesList,
    };
  }, [transactions, selectedMonthId, budgets]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header with Month Selector */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeftCol}>
            <View style={styles.headerBadgeRow}>
              <Text
                style={[styles.headerTitle, { color: theme.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Smart Insights
              </Text>
            </View>
            <Text
              style={[styles.headerSubtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              Intelligent spending analysis & plan
            </Text>
          </View>

          {/* Month Selector Dropdown Trigger */}
          <TouchableOpacity
            style={[
              styles.monthSelectorBtn,
              {
                backgroundColor: isDark ? theme.surfaceSoft : "#FFFFFF",
                borderColor: theme.border,
              },
            ]}
            onPress={() => setShowMonthPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={13} color={theme.accent} />
            <Text
              style={[styles.monthSelectorText, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {currentMonthLabel}
            </Text>
            <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 2. Insights Summary Section Card -> Leads to /insightssum */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/insightssum")}
          style={[
            styles.summaryHeroCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeaderTop}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="pie-chart-outline"
                size={17}
                color={theme.accent}
                style={{ marginRight: 7 }}
              />
              <Text style={[styles.sectionCardTitle, { color: theme.textPrimary }]}>
                Insights Summary
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.viewAllText, { color: theme.accent }]}>
                View Full Page
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.accent} />
            </View>
          </View>

          <View style={styles.summaryTopRow}>
            <View style={styles.summaryTopLeft}>
              <Text style={[styles.summaryMetaLabel, { color: theme.textSecondary }]}>
                TOTAL SPENT THIS MONTH
              </Text>
              <Text
                style={[styles.summaryBigAmount, { color: theme.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ₦{analyticsData.totalSpent.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.comparisonBadge,
                {
                  backgroundColor: analyticsData.isSpendUp
                    ? isDark ? "#4C101F" : "#FFE4E6"
                    : isDark ? "#133E23" : "#DCFCE7",
                },
              ]}
            >
              <Ionicons
                name={analyticsData.isSpendUp ? "arrow-up" : "arrow-down"}
                size={11}
                color={
                  analyticsData.isSpendUp
                    ? isDark ? "#FB7185" : "#BE123C"
                    : isDark ? "#4ADE80" : "#15803D"
                }
              />
              <Text
                style={[
                  styles.comparisonText,
                  {
                    color: analyticsData.isSpendUp
                      ? isDark ? "#FB7185" : "#BE123C"
                      : isDark ? "#4ADE80" : "#15803D",
                  },
                ]}
                numberOfLines={1}
              >
                {analyticsData.diffPercent}% vs last month
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View
            style={[
              styles.metricsBarRow,
              {
                backgroundColor: isDark ? theme.surfaceSoft : "#F9F7FA",
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.metricItem}>
              <Text style={[styles.metricItemLabel, { color: theme.textSecondary }]}>
                Daily Avg
              </Text>
              <Text
                style={[styles.metricItemValue, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                ₦{analyticsData.dailyAverage.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricItemLabel, { color: theme.textSecondary }]}>
                Top Category
              </Text>
              <Text
                style={[styles.metricItemValue, { color: theme.accent }]}
                numberOfLines={1}
              >
                {analyticsData.topCategory.name}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricItemLabel, { color: theme.textSecondary }]}>
                Projected Total
              </Text>
              <Text
                style={[styles.metricItemValue, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                ₦{analyticsData.projectedMonthEnd.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Banner bottom link */}
          <View
            style={[
              styles.cardBottomNavBanner,
              { borderTopColor: theme.border },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.cardBottomNavText, { color: theme.textSecondary }]}>
                Weekly intensity heatmap, calendar & ask AI
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={13} color={theme.accent} />
          </View>
        </TouchableOpacity>

        {/* 3. AJO CIRCLES ENTRY -> Leads to /ajo */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/ajo")}
          style={[
            styles.ajoEntry,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.ajoEntryIcon,
              {
                backgroundColor: isDark ? theme.surfaceSoft : "#F3EBF1",
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="people-outline" size={20} color={theme.accent} />
          </View>
          <View style={styles.ajoEntryCopy}>
            <View style={styles.headerTitleInlineRow}>
              <Text style={[styles.ajoEntryTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                Ajo Circles
              </Text>
              <View
                style={[
                  styles.ajoPill,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#F0EEF9" },
                ]}
              >
                <Text style={[styles.ajoPillText, { color: theme.accent }]}>
                  Community Savings
                </Text>
              </View>
            </View>
            <Text style={[styles.ajoEntrySub, { color: theme.textSecondary }]} numberOfLines={1}>
              Save together with family and circles (separate feature)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={theme.accent} style={{ flexShrink: 0 }} />
        </TouchableOpacity>

        {/* 4. BUDGET BASED ON SPENDING -> Leads to /budgetspending */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/budgetspending" as any)}
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeaderTop}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="wallet-outline"
                size={17}
                color={theme.accent}
                style={{ marginRight: 7 }}
              />
              <Text style={[styles.sectionCardTitle, { color: theme.textPrimary }]}>
                Budget Based on Spending
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.viewAllText, { color: theme.accent }]}>
                View Details
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.accent} />
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Dynamic limits adjusted to your monthly pace
          </Text>

          {/* Utilization Bar */}
          <View
            style={[
              styles.overviewBarWrapper,
              { backgroundColor: isDark ? theme.surfaceSoft : "#FAF7FA", borderColor: theme.border },
            ]}
          >
            <View style={styles.overviewBarHeader}>
              <Text style={[styles.overviewBarLabel, { color: theme.textSecondary }]}>
                Overall Budget Cap
              </Text>
              <Text style={[styles.overviewBarAmount, { color: theme.textPrimary }]}>
                ₦{analyticsData.totalSpent.toLocaleString()} / ₦{analyticsData.totalBudgetCap.toLocaleString()} ({analyticsData.budgetPercent}%)
              </Text>
            </View>

            <View
              style={[
                styles.miniProgressBarBg,
                { backgroundColor: isDark ? theme.background : "#E8E4EC" },
              ]}
            >
              <View
                style={[
                  styles.miniProgressBarFill,
                  {
                    width: `${Math.min(analyticsData.budgetPercent, 100)}%`,
                    backgroundColor:
                      analyticsData.budgetPercent > 100
                        ? "#BE123C"
                        : analyticsData.budgetPercent > 80
                        ? "#B45309"
                        : theme.accent,
                  },
                ]}
              />
            </View>
          </View>

          {/* Bottom link preview */}
          <View style={[styles.cardBottomNavBanner, { borderTopColor: theme.border }]}>
            <Text style={[styles.cardBottomNavText, { color: theme.textSecondary }]}>
              {analyticsData.categoriesList.length} categories tracked · Tap to adjust limits
            </Text>
            <Ionicons name="arrow-forward" size={13} color={theme.accent} />
          </View>
        </TouchableOpacity>

        {/* 5. LINKED CARDS ACTIVITY -> Leads to /linkedcards */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/linkedcards" as any)}
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeaderTop}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="card-outline"
                size={17}
                color={theme.accent}
                style={{ marginRight: 7 }}
              />
              <Text style={[styles.sectionCardTitle, { color: theme.textPrimary }]}>
                Linked Cards Activity
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.viewAllText, { color: theme.accent }]}>
                View Cards
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.accent} />
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Real-time card spending & transaction volume
          </Text>

          {/* Mini Cards Row */}
          <View style={styles.miniCardsPreviewRow}>
            <View
              style={[
                styles.miniCardChip,
                {
                  backgroundColor: isDark ? "#3A1A0C" : "#FFF1EB",
                  borderColor: isDark ? "#5C2812" : "#FFD5C2",
                },
              ]}
            >
              <Ionicons name="card-outline" size={13} color="#DD4F05" />
              <Text style={[styles.miniCardChipText, { color: isDark ? "#FFB18A" : "#DD4F05" }]}>
                GTBank (•• 4821)
              </Text>
            </View>

            <View
              style={[
                styles.miniCardChip,
                {
                  backgroundColor: isDark ? "#3D0C13" : "#FDE8EB",
                  borderColor: isDark ? "#631620" : "#F8B4BD",
                },
              ]}
            >
              <Ionicons name="card-outline" size={13} color="#C8102E" />
              <Text style={[styles.miniCardChipText, { color: isDark ? "#FFA2AD" : "#C8102E" }]}>
                Zenith (•• 8912)
              </Text>
            </View>

            <View
              style={[
                styles.miniCardChip,
                {
                  backgroundColor: isDark ? "#25103F" : "#F3EDFA",
                  borderColor: isDark ? "#48207A" : "#D7BEF3",
                },
              ]}
            >
              <Ionicons name="phone-portrait-outline" size={13} color="#8E44AD" />
              <Text style={[styles.miniCardChipText, { color: isDark ? "#D2A2F9" : "#6C3483" }]}>
                Kuda (•• 1044)
              </Text>
            </View>
          </View>

          {/* Bottom link preview */}
          <View style={[styles.cardBottomNavBanner, { borderTopColor: theme.border }]}>
            <Text style={[styles.cardBottomNavText, { color: theme.textSecondary }]}>
              ₦235,500 total card spend this month · 3 active cards
            </Text>
            <Ionicons name="arrow-forward" size={13} color={theme.accent} />
          </View>
        </TouchableOpacity>

        {/* 6. SAVINGS PROGRESS -> Leads to /savingsprogress */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/savingsprogress" as any)}
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeaderTop}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="trending-up-outline"
                size={17}
                color={theme.accent}
                style={{ marginRight: 7 }}
              />
              <Text style={[styles.sectionCardTitle, { color: theme.textPrimary }]}>
                Savings Progress
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.viewAllText, { color: theme.accent }]}>
                View Goals
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.accent} />
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Track progress towards your target goals & auto-save
          </Text>

          {/* Savings bar preview */}
          <View
            style={[
              styles.overviewBarWrapper,
              { backgroundColor: isDark ? theme.surfaceSoft : "#FAF7FA", borderColor: theme.border },
            ]}
          >
            <View style={styles.overviewBarHeader}>
              <Text style={[styles.overviewBarLabel, { color: theme.textSecondary }]}>
                Goals Funded
              </Text>
              <Text style={[styles.overviewBarAmount, { color: theme.textPrimary }]}>
                ₦1,450,000 / ₦2,400,000 (60%)
              </Text>
            </View>

            <View
              style={[
                styles.miniProgressBarBg,
                { backgroundColor: isDark ? theme.background : "#E8E4EC" },
              ]}
            >
              <View
                style={[
                  styles.miniProgressBarFill,
                  {
                    width: "60%",
                    backgroundColor: "#2ECC71",
                  },
                ]}
              />
            </View>
          </View>

          {/* Bottom link preview */}
          <View style={[styles.cardBottomNavBanner, { borderTopColor: theme.border }]}>
            <Text style={[styles.cardBottomNavText, { color: theme.textSecondary }]}>
              3 active targets (MacBook, Emergency, Holiday)
            </Text>
            <Ionicons name="arrow-forward" size={13} color={theme.accent} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Month Selector Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.monthModalCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.modalHeaderRow}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    Select Month
                  </Text>
                  <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                    <Ionicons name="close" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {AVAILABLE_MONTHS.map((m) => {
                  const isSelected = m.id === selectedMonthId;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.monthOptionRow,
                        {
                          backgroundColor: isSelected
                            ? isDark ? theme.surfaceSoft : "#F3EBF1"
                            : "transparent",
                          borderColor: isSelected ? theme.accent : "transparent",
                        },
                      ]}
                      onPress={() => {
                        setSelectedMonthId(m.id);
                        setShowMonthPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthOptionLabel,
                          {
                            color: isSelected ? theme.accent : theme.textPrimary,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {m.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeftCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  headerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  monthSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
    marginRight: 2,
  },
  monthSelectorText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  // Monthly Spending Summary Card
  summaryHeroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionCardTitle: {
    fontSize: 15.5,
    fontWeight: "700",
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 2,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryTopLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  summaryMetaLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  summaryBigAmount: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 2,
  },
  comparisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: 9,
    flexShrink: 0,
  },
  comparisonText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  metricsBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2,
    minWidth: 0,
  },
  metricItemLabel: {
    fontSize: 9.5,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
  },
  metricItemValue: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  metricDivider: {
    width: 1,
    height: 20,
  },
  cardBottomNavBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cardBottomNavText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Ajo Entry
  ajoEntry: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  ajoEntryIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  ajoEntryCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },
  headerTitleInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  ajoEntryTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  ajoPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  ajoPillText: {
    fontSize: 8.5,
    fontWeight: "700",
  },
  ajoEntrySub: {
    fontSize: 11,
    marginTop: 2,
  },

  // Overview Section Cards
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardSubtitle: {
    fontSize: 11.5,
    marginBottom: 12,
  },
  overviewBarWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  overviewBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  overviewBarLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  overviewBarAmount: {
    fontSize: 12,
    fontWeight: "700",
  },
  miniProgressBarBg: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
  },
  miniProgressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  miniCardsPreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  miniCardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniCardChipText: {
    fontSize: 10.5,
    fontWeight: "700",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  monthModalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  monthOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  monthOptionLabel: {
    fontSize: 13.5,
  },
});
