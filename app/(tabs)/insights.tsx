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
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
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

const SUGGESTED_PROMPTS = [
  "Where did most of my money go?",
  "Why did I spend more this month?",
  "How can I save ₦50,000 next month?",
  "What category am I spending the most on?",
];

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
    updateBudget,
    themePreference,
    themeMode,
  } = useAppStore();

  const transactions = rawTransactions as any[];
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  // Selected Month
  const [selectedMonthId, setSelectedMonthId] = useState("2026-08");
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Adjust Budget Modal State
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [customBudgetInput, setCustomBudgetInput] = useState("");

  // Ask AI Assistant State
  const [aiQuestion, setAiQuestion] = useState("");
  const [activeAiAnswer, setActiveAiAnswer] = useState<{
    query: string;
    summary: string;
    details: string[];
    actionableTip: string;
  } | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  const currentMonthLabel = useMemo(() => {
    const found = AVAILABLE_MONTHS.find((m) => m.id === selectedMonthId);
    return found ? found.label : "August 2026";
  }, [selectedMonthId]);

  // Derived financial computations based on transactions and selected month
  const analyticsData = useMemo(() => {
    const isMay2024 = selectedMonthId === "2024-05";

    // Filter transactions
    const monthTxns = transactions.filter((tx) => {
      if (isMay2024) {
        return tx.date && tx.date.startsWith("2024-05") && tx.type === "expense";
      }
      return tx.type === "expense";
    });

    // Total Spent
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

    // Fallback baseline for realistic numbers
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
    const diffPercent = ((totalSpent - previousMonthSpend) / previousMonthSpend) * 100;
    const isSpendUp = diffPercent >= 0;

    // AI recommended limits: base on current spend + 20-30% buffer, or store values
    const categoriesList = Object.keys(CATEGORY_META).map((catName) => {
      const spent = catTotals[catName]?.total || 0;
      const count = catTotals[catName]?.count || 0;
      const aiDefaultLimit =
        budgets[catName] ||
        (spent > 0 ? Math.ceil((spent * 1.25) / 1000) * 1000 : 30000);

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
        percentageOfTotal: totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0,
      };
    }).sort((a, b) => b.spent - a.spent);

    const topCategory = categoriesList[0] || { name: "Food & Dining", spent: 0 };

    return {
      totalSpent,
      previousMonthSpend,
      diffPercent: Math.abs(diffPercent).toFixed(1),
      isSpendUp,
      categoriesList,
      topCategory,
      dailyAverage: Math.round(totalSpent / 24),
      projectedMonthEnd: Math.round(totalSpent * 1.08),
    };
  }, [transactions, budgets, selectedMonthId]);

  // AI Personalized Insights calculation
  const aiInsights = useMemo(() => {
    const topCat = analyticsData.topCategory;

    return [
      {
        id: "insight-1",
        title: "Category Alert",
        text: `You're spending more on ${topCat.name} this month than your usual average (₦${topCat.spent.toLocaleString()}).`,
        badge: "Higher Spend",
        icon: "trending-up-outline" as const,
        color: isDark ? "#FB7185" : "#BE123C",
        bg: isDark ? "#4C101F" : "#FFE4E6",
      },
      {
        id: "insight-2",
        title: "Monthly Trajectory",
        text: `At your current spending rate, you're on track to spend approximately ₦${analyticsData.projectedMonthEnd.toLocaleString()} this month.`,
        badge: "AI Prediction",
        icon: "sparkles-outline" as const,
        color: isDark ? "#A397E0" : "#5B4E91",
        bg: isDark ? "#2A2346" : "#F0EEF9",
      },
      {
        id: "insight-3",
        title: "Transport Optimization",
        text: "Your transportation spending is 7.2% lower than last month. You saved ~₦8,500 on commute.",
        badge: "Positive Win",
        icon: "checkmark-circle-outline" as const,
        color: isDark ? "#4ADE80" : "#15803D",
        bg: isDark ? "#133E23" : "#DCFCE7",
      },
      {
        id: "insight-4",
        title: "Smart Recommendation",
        text: `Setting a ₦${Math.round(topCat.spent * 0.9).toLocaleString()} cap on ${topCat.name} can free up ₦15,000 for your emergency fund.`,
        badge: "Actionable Plan",
        icon: "bulb-outline" as const,
        color: isDark ? "#FBBF24" : "#B45309",
        bg: isDark ? "#422808" : "#FEF3C7",
      },
    ];
  }, [analyticsData, isDark]);

  // Handle Ask AI question
  const handleAskAi = (questionText: string) => {
    const q = questionText.trim();
    if (!q) return;

    setIsAskingAi(true);
    const lower = q.toLowerCase();

    setTimeout(() => {
      let summary = "";
      let details: string[] = [];
      let actionableTip = "";

      if (lower.includes("where") || lower.includes("most") || lower.includes("category")) {
        summary = `Your biggest expense this month is ${analyticsData.topCategory.name}, taking up ${analyticsData.topCategory.percentageOfTotal}% of total spend.`;
        details = [
          `Total spent in ${analyticsData.topCategory.name}: ₦${analyticsData.topCategory.spent.toLocaleString()}`,
          `Second highest: ${analyticsData.categoriesList[1]?.name || "Transport"} (₦${(analyticsData.categoriesList[1]?.spent || 0).toLocaleString()})`,
          `Number of recorded transactions: ${analyticsData.topCategory.count} purchases`,
        ];
        actionableTip = "Consider batching grocery orders or dining out twice a week to trim ₦18,000 from this category.";
      } else if (lower.includes("why") || lower.includes("more") || lower.includes("increase")) {
        summary = `Your spending is up ${analyticsData.diffPercent}% compared to last month primarily due to ${analyticsData.topCategory.name} and Shopping.`;
        details = [
          `Food & Dining purchases increased by ₦16,200`,
          `Shopping had 3 large one-off purchases`,
          `Utilities and recurring bills stayed steady`,
        ];
        actionableTip = "Review recent weekend dining transactions and set auto-alerts when category hits 80% limit.";
      } else if (lower.includes("save") || lower.includes("50,000") || lower.includes("50000") || lower.includes("budget")) {
        summary = `Here is your AI tailored plan to save ₦50,000 next month without compromising essentials:`;
        details = [
          `Trim ${analyticsData.topCategory.name} by 15% (Save ~₦22,000)`,
          `Limit Shopping impulse buys to essentials (Save ~₦18,000)`,
          `Audit inactive streaming/app subscriptions (Save ~₦10,000)`,
        ];
        actionableTip = "Enable Auto-Save on your TallySpends balance right when your income hits.";
      } else {
        summary = `Based on your ${currentMonthLabel} analysis, your total outgoing is ₦${analyticsData.totalSpent.toLocaleString()} across ${analyticsData.categoriesList.length} categories.`;
        details = [
          `Daily average burn rate: ₦${analyticsData.dailyAverage.toLocaleString()}/day`,
          `Categories on track: ${analyticsData.categoriesList.filter((c) => c.status === "on_track").length}`,
          `Categories near or over limit: ${analyticsData.categoriesList.filter((c) => c.status !== "on_track").length}`,
        ];
        actionableTip = "You can adjust your AI spending plan limits anytime using the 'Adjust Limits' button.";
      }

      setActiveAiAnswer({
        query: q,
        summary,
        details,
        actionableTip,
      });
      setIsAskingAi(false);
      setAiQuestion("");
    }, 300);
  };

  // Save budget override
  const handleSaveBudgetLimit = () => {
    if (!editingCategory) return;
    const num = parseFloat(customBudgetInput.replace(/[^0-9.]/g, ""));
    if (!isNaN(num) && num > 0) {
      updateBudget(editingCategory, num);
    }
    setEditingCategory(null);
    setCustomBudgetInput("");
  };

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

          {/* Month Selector Dropdown Trigger (Shifted inward from right screen edge) */}
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

        {/* 2. Insights Summary Section */}
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="pie-chart-outline"
                size={16}
                color={theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: theme.textPrimary,
                }}
              >
                Insights Summary
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: theme.accent,
                  marginRight: 2,
                }}
              >
                View Full Summary
              </Text>
              <Ionicons name="chevron-forward" size={12} color={theme.accent} />
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
                adjustsFontSizeToFit
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
                adjustsFontSizeToFit
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
                adjustsFontSizeToFit
              >
                ₦{analyticsData.projectedMonthEnd.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Banner link */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: theme.textSecondary,
                }}
              >
                Weekly heatmap, custom calendar & tips
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={13} color={theme.accent} />
          </View>
        </TouchableOpacity>

        {/* 3. AJO CIRCLE ENTRY (PLACED AS THE SECOND SECTION AFTER SUMMARY AS REQUESTED) */}
        <TouchableOpacity
          activeOpacity={0.82}
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

      {/* Adjust Budget Modal ("AI Recommends. User Controls.") */}
      <Modal
        visible={!!editingCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCategory(null)}
      >
        <TouchableWithoutFeedback onPress={() => setEditingCategory(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.editBudgetModalCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                      Adjust Spending Limit
                    </Text>
                    <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                      {editingCategory}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setEditingCategory(null)}>
                    <Ionicons name="close" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Recommended Limit (₦)
                </Text>
                <View
                  style={[
                    styles.amountInputRow,
                    {
                      backgroundColor: isDark ? theme.surfaceSoft : "#F9F7FA",
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.currencyPrefix, { color: theme.textPrimary }]}>₦</Text>
                  <TextInput
                    style={[styles.budgetNumberInput, { color: theme.textPrimary }]}
                    keyboardType="numeric"
                    value={customBudgetInput}
                    onChangeText={setCustomBudgetInput}
                    placeholder="Enter limit"
                    placeholderTextColor={theme.textSecondary}
                    autoFocus
                  />
                </View>

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.cancelModalBtn,
                      {
                        backgroundColor: isDark ? theme.surfaceSoft : "#F3F0F4",
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setEditingCategory(null)}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveModalBtn, { backgroundColor: theme.accent }]}
                    onPress={handleSaveBudgetLimit}
                  >
                    <Text style={styles.saveBtnText}>Save Limit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Ask AI Response Modal */}
      <Modal
        visible={!!activeAiAnswer}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveAiAnswer(null)}
      >
        <TouchableWithoutFeedback onPress={() => setActiveAiAnswer(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.aiAnswerModalCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.aiModalHeader}>
                  <View style={[styles.aiIconBadge, { backgroundColor: isDark ? "#342630" : "#F3EBF1" }]}>
                    <Ionicons name="sparkles" size={17} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
                    <Text style={[styles.aiModalTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      Smart AI Analysis
                    </Text>
                    <Text
                      style={[styles.aiModalQuery, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      &quot;{activeAiAnswer?.query}&quot;
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setActiveAiAnswer(null)}>
                    <Ionicons name="close" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Summary */}
                <View
                  style={[
                    styles.aiSummaryBox,
                    {
                      backgroundColor: isDark ? theme.surfaceSoft : "#F9F6FA",
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.aiSummaryText, { color: theme.textPrimary }]}>
                    {activeAiAnswer?.summary}
                  </Text>
                </View>

                {/* Breakdown Bullets */}
                <View style={styles.aiBulletsContainer}>
                  {activeAiAnswer?.details.map((detail, idx) => (
                    <View key={idx} style={styles.aiBulletRow}>
                      <Ionicons name="checkmark-circle" size={15} color={theme.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                      <Text style={[styles.aiBulletText, { color: theme.textPrimary }]}>
                        {detail}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Actionable Tip */}
                {activeAiAnswer?.actionableTip ? (
                  <View
                    style={[
                      styles.aiTipBox,
                      {
                        backgroundColor: isDark ? "#30261A" : "#FEF3C7",
                        borderColor: isDark ? "#4D381F" : "#FDE68A",
                      },
                    ]}
                  >
                    <Ionicons name="bulb-outline" size={16} color="#B45309" style={{ marginTop: 1, flexShrink: 0 }} />
                    <Text style={[styles.aiTipText, { color: isDark ? "#FDE68A" : "#92400E" }]}>
                      {activeAiAnswer.actionableTip}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.aiCloseModalBtn, { backgroundColor: theme.accent }]}
                  onPress={() => setActiveAiAnswer(null)}
                >
                  <Text style={styles.aiCloseModalText}>Got it</Text>
                </TouchableOpacity>
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
  aiSparklePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  aiSparkleText: {
    fontSize: 10,
    fontWeight: "700",
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

  // Ajo Entry (Second Section)
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

  // Section Cards
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionMargin: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderTitleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  headerTitleInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  miniTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  miniTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    width: "100%",
  },
  chartXAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 6,
    marginTop: 6,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  chartFooterNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150, 150, 150, 0.2)",
  },
  chartFooterText: {
    fontSize: 10.5,
    flex: 1,
  },

  // Spending Plan
  aiBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeSmallText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  philosophyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  philosophyText: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  spendingPlanList: {
    gap: 10,
  },
  planItemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  planCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  planIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  planCategoryName: {
    fontSize: 13.5,
    fontWeight: "700",
    flex: 1,
  },
  planStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    flexShrink: 0,
  },
  planStatusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  planAmountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  planAmountSpent: {
    fontSize: 14.5,
    fontWeight: "800",
  },
  planAmountSub: {
    fontSize: 11,
    fontWeight: "500",
  },
  planAmountLimit: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  planProgressBarBg: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
    marginBottom: 6,
  },
  planProgressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  planFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planFooterMeta: {
    fontSize: 10.5,
    fontWeight: "500",
  },
  planFooterRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  planPercentText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3.5,
  },

  // Insights Cards Grid
  insightsGrid: {
    gap: 8,
  },
  insightCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
  },
  insightCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  insightIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  insightBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  insightBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  insightCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  insightCardBody: {
    fontSize: 11.5,
    lineHeight: 16.5,
  },

  // Category Breakdown
  segmentedBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    width: "100%",
    marginBottom: 12,
  },
  breakdownRows: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  breakdownDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  breakdownName: {
    fontSize: 13,
    fontWeight: "600",
  },
  breakdownRight: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: "700",
  },
  breakdownShare: {
    fontSize: 10.5,
    marginTop: 1,
  },

  // Ask AI Card
  askAiCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  askAiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  askAiIconFrame: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  askAiTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  askAiTitle: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  askAiSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  promptChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  promptChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 11,
    borderWidth: 1,
    maxWidth: "100%",
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },
  askAiInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  askAiInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 6,
  },
  askAiSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  monthModalCard: {
    width: "100%",
    maxWidth: 330,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
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
  modalSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  monthOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 5,
  },
  monthOptionLabel: {
    fontSize: 13.5,
  },

  // Edit Budget Modal
  editBudgetModalCard: {
    width: "100%",
    maxWidth: 330,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    marginBottom: 5,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 4,
  },
  budgetNumberInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  saveModalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // AI Answer Modal
  aiAnswerModalCard: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  aiModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  aiIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  aiModalTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  aiModalQuery: {
    fontSize: 11.5,
    marginTop: 1,
  },
  aiSummaryBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  aiSummaryText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  aiBulletsContainer: {
    gap: 6,
    marginBottom: 12,
  },
  aiBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  aiBulletText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  aiTipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 14,
  },
  aiTipText: {
    fontSize: 11.5,
    fontWeight: "600",
    flex: 1,
    lineHeight: 16,
  },
  aiCloseModalBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  aiCloseModalText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
