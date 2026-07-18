import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Import custom chart components
import GaugeChart from "../src/components/GaugeChart";
import TrendsChart from "../src/components/TrendsChart";
import BreakdownChart from "../src/components/BreakdownChart";
import BarChart from "../src/components/BarChart";
import HeatMap from "../src/components/HeatMap";

// Import store and mockData
import { useAppStore } from "../src/store";
import { mockData } from "../src/mockData";

export default function AnalyticsScreen() {
  const router = useRouter();
  const { transactions: transactionsRaw, budgets: budgetsRaw } = useAppStore();
  const transactions = (transactionsRaw || []) as any[];
  const budgets = (budgetsRaw || {}) as any;
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "yearly">(
    "monthly",
  );

  // State for controlling calendar dropdown visibility and selections
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("W2 May (May 08 - May 14)");
  const [selectedMonth, setSelectedMonth] = useState("May 2026");
  const [selectedYear, setSelectedYear] = useState("2026");

  // Dynamic label based on chosen timeframe
  const getCurrentDateLabel = () => {
    if (timeframe === "weekly")
      return selectedWeek.split(" ")[0] + " " + selectedWeek.split(" ")[1]; // Short display like "W2 May"
    if (timeframe === "monthly") return selectedMonth;
    return selectedYear;
  };

  // Mock choices for the bottom sheet selector
  const calendarOptions = {
    weekly: [
      "W1 May (May 01 - May 07)",
      "W2 May (May 08 - May 14)",
      "W3 May (May 15 - May 21)",
      "W4 May (May 22 - May 28)",
      "W5 May (May 29 - Jun 04)",
    ],
    monthly: ["March 2026", "April 2026", "May 2026", "June 2026", "July 2026"],
    yearly: ["2024", "2025", "2026"],
  };

  const handleSelectDate = (item: string) => {
    if (timeframe === "weekly") setSelectedWeek(item);
    else if (timeframe === "monthly") setSelectedMonth(item);
    else setSelectedYear(item);
    setIsCalendarOpen(false);
  };

  // Dynamic calculations similar to previous work
  const statistics = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpending: { [key: string]: number } = {
      "Food & Dining": 0,
      "Transport": 0,
      "Shopping": 0,
      "Bills & Utilities": 0,
      "Entertainment": 0,
      "Others": 0,
    };

    transactions.forEach((tx) => {
      if (tx.type === "income") {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        if (categorySpending[tx.category] !== undefined) {
          categorySpending[tx.category] += tx.amount;
        } else {
          categorySpending["Others"] += tx.amount;
        }
      }
    });

    const totalSavings = totalIncome - totalExpenses;

    // Financial health score calculation
    let score = 75;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
    if (savingsRate > 20) score += 5;
    if (savingsRate > 35) score += 5;

    let budgetBreaches = 0;
    Object.keys(budgets).forEach((cat) => {
      if (categorySpending[cat] > budgets[cat]) {
        budgetBreaches++;
      }
    });
    score -= budgetBreaches * 3;
    score = Math.max(40, Math.min(100, score));

    let statusText = "Good";
    let statusMessage = "You're on the right track!";
    if (score >= 85) {
      statusText = "Excellent";
      statusMessage = "Superb financial discipline!";
    } else if (score < 65) {
      statusText = "Warning";
      statusMessage = "Try to curb non-essential bills.";
    }

    // Category Breakdown percentages
    const breakdown = Object.keys(categorySpending)
      .map((cat) => {
        const value = categorySpending[cat];
        const percentage =
          totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0;

        let color = "#ece6eb";
        if (cat === "Food & Dining") color = "#3d2e3c";
        else if (cat === "Transport") color = "#6c536a";
        else if (cat === "Shopping") color = "#957793";
        else if (cat === "Bills & Utilities") color = "#c1a4bf";
        else if (cat === "Entertainment") color = "#cab7c8";

        return { name: cat, percentage, value, color };
      })
      .sort((a, b) => b.value - a.value);

    // Update Monthly dataset details inside mock trends and graphs
    const monthlyDataOverride = JSON.parse(JSON.stringify(mockData.Monthly));

    monthlyDataOverride.totals.income.value = totalIncome;
    monthlyDataOverride.totals.expenses.value = totalExpenses;
    monthlyDataOverride.totals.savings.value = totalSavings;
    monthlyDataOverride.healthScore = score;
    monthlyDataOverride.healthScoreText =
      score >= 75
        ? "Spending efficiency improved this month"
        : "Curb expenses to improve score";

    const expensesDS = monthlyDataOverride.trends.datasets.find(
      (d: any) => d.name === "Expenses",
    );
    const savingsDS = monthlyDataOverride.trends.datasets.find(
      (d: any) => d.name === "Savings",
    );
    const incomeDS = monthlyDataOverride.trends.datasets.find(
      (d: any) => d.name === "Income",
    );

    if (expensesDS) expensesDS.data[4] = totalExpenses;
    if (savingsDS) savingsDS.data[4] = totalSavings;
    if (incomeDS) incomeDS.data[4] = totalIncome;

    const lastHoverIdx = monthlyDataOverride.trends.hoverDetails.length - 1;
    if (monthlyDataOverride.trends.hoverDetails[lastHoverIdx]) {
      monthlyDataOverride.trends.hoverDetails[lastHoverIdx].Expenses = totalExpenses;
      monthlyDataOverride.trends.hoverDetails[lastHoverIdx].Savings = totalSavings;
      monthlyDataOverride.trends.hoverDetails[lastHoverIdx].Income = totalIncome;
    }

    monthlyDataOverride.barChart.income[4] = totalIncome;
    monthlyDataOverride.barChart.expenses[4] = totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      healthScore: score,
      statusText,
      statusMessage,
      breakdown,
      categorySpending,
      monthlyDataOverride,
    };
  }, [transactions, budgets]);

  const activeDashboardData = useMemo(() => {
    if (timeframe === "weekly") return mockData.Weekly;
    if (timeframe === "yearly") return mockData.Yearly;
    return statistics.monthlyDataOverride;
  }, [timeframe, statistics]);

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER BAR (No Hamburger Menu) --- */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- TIMEFRAME & CALENDAR SELECTOR --- */}
        <View style={styles.selectorRow}>
          <View style={styles.pillContainer}>
            <TouchableOpacity
              style={[styles.pill, timeframe === "weekly" && styles.activePill]}
              onPress={() => setTimeframe("weekly")}
            >
              <Text
                style={[
                  styles.pillText,
                  timeframe === "weekly" && styles.activePillText,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pill,
                timeframe === "monthly" && styles.activePill,
              ]}
              onPress={() => setTimeframe("monthly")}
            >
              <Text
                style={[
                  styles.pillText,
                  timeframe === "monthly" && styles.activePillText,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, timeframe === "yearly" && styles.activePill]}
              onPress={() => setTimeframe("yearly")}
            >
              <Text
                style={[
                  styles.pillText,
                  timeframe === "yearly" && styles.activePillText,
                ]}
              >
                Yearly
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.dateDropdown}
            onPress={() => setIsCalendarOpen(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={13}
              color="#4A4A4A"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.dateDropdownText}>{getCurrentDateLabel()}</Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color="#4A4A4A"
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        {/* --- FINANCIAL HEALTH SCORE --- */}
        <View style={styles.analyticsCard}>
          <Text style={styles.cardLabel}>Financial Health Score</Text>
          <View style={styles.healthScoreRow}>
            <View style={styles.scoreSummaryBox}>
              <View style={styles.scoreSummaryTop}>
                <View style={styles.scoreLeft}>
                  <Text style={styles.scoreMainText}>
                    {activeDashboardData.healthScore}
                    <Text style={styles.scoreSubText}> /100</Text>
                  </Text>
                  <Text style={styles.scoreDesc}>
                    {activeDashboardData.healthScoreText}
                  </Text>
                  <View style={[
                    styles.trendBadge,
                    { backgroundColor: activeDashboardData.healthScoreDiffPositive ? "#EAFAF1" : "#FDEDEC" }
                  ]}>
                    <Ionicons
                      name={activeDashboardData.healthScoreDiffPositive ? "trending-up" : "trending-down"}
                      size={12}
                      color={activeDashboardData.healthScoreDiffPositive ? "#27AE60" : "#E74C3C"}
                      style={{ marginRight: 2 }}
                    />
                    <Text style={[
                      styles.trendText,
                      { color: activeDashboardData.healthScoreDiffPositive ? "#27AE60" : "#E74C3C" }
                    ]}>
                      {activeDashboardData.healthScoreDiff.split(" ")[0]}
                    </Text>
                    <Text style={styles.trendSubText}> vs Last Period</Text>
                  </View>
                </View>

                <View style={styles.scoreCenter}>
                  <GaugeChart score={activeDashboardData.healthScore} />
                  <View style={styles.gaugeStatusLabel}>
                    <Text style={styles.gaugeStatusTitle}>{statistics.statusText}</Text>
                    <Text style={styles.gaugeStatusSub}>{statistics.statusMessage}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.scoreMetricsGrid}>
                <View style={styles.scoreMetricCard}>
                  <View style={[styles.miniIndicatorCircle, { backgroundColor: "#EBF5FB" }]}> 
                    <Ionicons name="arrow-up" size={10} color="#27AE60" />
                  </View>
                  <Text style={styles.scoreMetricLabel}>Income</Text>
                  <Text style={styles.scoreMetricValue}>{formatCurrency(activeDashboardData.totals.income.value)}</Text>
                  <Text style={styles.scoreMetricFoot}>{activeDashboardData.totals.income.change}</Text>
                </View>

                <View style={styles.scoreMetricCard}>
                  <View style={[styles.miniIndicatorCircle, { backgroundColor: "#FDEDEC" }]}> 
                    <Ionicons name="arrow-down" size={10} color="#E74C3C" />
                  </View>
                  <Text style={styles.scoreMetricLabel}>Expenses</Text>
                  <Text style={styles.scoreMetricValue}>{formatCurrency(activeDashboardData.totals.expenses.value)}</Text>
                  <Text style={[styles.scoreMetricFoot, { color: "#E74C3C" }]}> {activeDashboardData.totals.expenses.change}</Text>
                </View>

                <View style={styles.scoreMetricCard}>
                  <View style={[styles.miniIndicatorCircle, { backgroundColor: "#E8F8F5" }]}> 
                    <Ionicons name="shuffle-outline" size={10} color="#1ABC9C" />
                  </View>
                  <Text style={styles.scoreMetricLabel}>Savings</Text>
                  <Text style={styles.scoreMetricValue}>{formatCurrency(activeDashboardData.totals.savings.value)}</Text>
                  <Text style={[styles.scoreMetricFoot, { color: "#1ABC9C" }]}> {activeDashboardData.totals.savings.change}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* --- SPENDING TRENDS LINE CHART --- */}
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelBold}>Spending Trends</Text>
            <TouchableOpacity style={styles.miniInlineDropdown}>
              <Text style={styles.miniDropdownText}>All Accounts</Text>
              <Ionicons
                name="chevron-down"
                size={10}
                color="#666"
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>

          <TrendsChart data={activeDashboardData.trends} />

          <View style={styles.chartLegendRow}>
            {activeDashboardData.trends.datasets.map((ds: any) => (
              <View key={ds.name} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: ds.color }]}
                />
                <Text style={styles.legendText}>{ds.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.cardLabelBold}>Category Breakdown</Text>
          <BreakdownChart
            breakdown={timeframe === "monthly" ? statistics.breakdown : activeDashboardData.breakdown}
            totalExpenses={activeDashboardData.totals.expenses.value}
          />
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelBold}>Income vs Expenses</Text>
          </View>

          <BarChart
            labels={activeDashboardData.barChart.labels}
            income={activeDashboardData.barChart.income}
            expenses={activeDashboardData.barChart.expenses}
          />
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.cardLabelBold}>Spending Heat Map</Text>
          <Text style={styles.cardLabelSub}>When you spend the most</Text>
          <HeatMap heatmapData={activeDashboardData.heatmap} />
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.cardLabelBold}>Smart Trends</Text>
          <View style={styles.smartTrendsList}>
            <TouchableOpacity style={styles.smartTrendRowItem}>
              <View style={[styles.trendIconBox, { backgroundColor: "#F5EEF8" }]}>
                <Ionicons name="car-outline" size={14} color="#8E44AD" />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 6 }}>
                <Text style={styles.trendItemContentText} numberOfLines={2}>
                  Transport items increased by 15%.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.smartTrendRowItem}>
              <View style={[styles.trendIconBox, { backgroundColor: "#E8F8F5" }]}>
                <FontAwesome5 name="piggy-bank" size={11} color="#1ABC9C" />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 6 }}>
                <Text style={styles.trendItemContentText} numberOfLines={2}>
                  Savings rate grew by 8% this period.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- BOTTOM SHEET DROPDOWN MODAL --- */}
      <Modal
        visible={isCalendarOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsCalendarOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderKnob} />
                  <Text style={styles.modalTitle}>
                    Select{" "}
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}{" "}
                    Period
                  </Text>
                </View>
                <ScrollView contentContainerStyle={styles.modalList}>
                  {calendarOptions[timeframe].map((item) => {
                    const isSelected =
                      (timeframe === "weekly" && selectedWeek === item) ||
                      (timeframe === "monthly" && selectedMonth === item) ||
                      (timeframe === "yearly" && selectedYear === item);

                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.modalItem,
                          isSelected && styles.modalItemSelected,
                        ]}
                        onPress={() => handleSelectDate(item)}
                      >
                        <Text
                          style={[
                            styles.modalItemText,
                            isSelected && styles.modalItemTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#4B2C40"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- SYSTEM FOOTER NAV --- */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/")}
        >
          <Ionicons name="home-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/expenses")}
        >
          <Ionicons name="document-text-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/budget")}
        >
          <Ionicons name="wallet-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/analytics")}
        >
          <Ionicons name="bar-chart" size={22} color="#4B2C40" />
          <Text style={[styles.footerText, styles.activeFooterText]}>
            Analytics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/more")}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#666666" />
          <Text style={styles.footerText}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  shareButton: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  pillContainer: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: 10,
    padding: 3,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activePill: {
    backgroundColor: "#4B2C40",
  },
  pillText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activePillText: {
    color: "#FFF",
    fontWeight: "600",
  },
  dateDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateDropdownText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  analyticsCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  cardLabelBold: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  cardLabelSub: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  miniInlineDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  miniDropdownText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  healthScoreRow: {
    marginTop: 12,
  },
  scoreTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreBottomRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
  },
  scoreSummaryBox: {
    width: "100%",
  },
  scoreSummaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreMetricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  scoreMetricCard: {
    flex: 1,
    minWidth: 96,
    marginBottom: 8,
    backgroundColor: "#FCFCFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3EDF0",
    padding: 10,
  },
  scoreMetricLabel: {
    fontSize: 9,
    color: "#888",
  },
  scoreMetricValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 3,
  },
  scoreMetricFoot: {
    fontSize: 8,
    fontWeight: "600",
    marginTop: 2,
  },
  scoreLeft: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  scoreMainText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  scoreSubText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  scoreDesc: {
    fontSize: 11,
    color: "#666",
    marginTop: 6,
    lineHeight: 14,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAFAF1",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#27AE60",
  },
  trendSubText: {
    fontSize: 9,
    color: "#777",
  },
  scoreCenter: {
    width: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeMock: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#4B2C40",
    borderRadius: 45,
    width: 86,
    height: 86,
    backgroundColor: "#FCFCFC",
  },
  gaugeStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 2,
  },
  gaugeSubTextText: {
    fontSize: 7,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 4,
    marginTop: 1,
  },
  scoreRight: {
    flex: 0.35,
    justifyContent: "center",
  },
  rightIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  miniIndicatorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  indLabel: {
    fontSize: 9,
    color: "#888",
  },
  indValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  indSub: {
    fontSize: 8,
    color: "#27AE60",
    fontWeight: "500",
  },
  chartContainerMock: {
    flexDirection: "row",
    height: 140,
    marginTop: 12,
  },
  yAxisLabels: {
    justifyContent: "space-between",
    height: "100%",
    paddingRight: 8,
    width: 28,
  },
  axisLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
  },
  chartCanvas: {
    flex: 1,
    height: "100%",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
    justifyContent: "space-between",
    position: "relative",
  },
  gridLine: {
    height: 1,
    backgroundColor: "#F5F5F5",
    width: "100%",
  },
  chartTooltipPointerLine: {
    position: "absolute",
    left: "52%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#DDD",
    borderStyle: "dashed",
    alignItems: "center",
  },
  pointerDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    left: -2,
  },
  chartTooltipCard: {
    position: "absolute",
    top: 15,
    left: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 8,
    padding: 8,
    width: 105,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tooltipDate: {
    fontSize: 9,
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
  },
  tooltipRowText: {
    fontSize: 9,
    color: "#333",
    marginVertical: 1,
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 28,
    marginTop: 8,
  },
  chartLegendRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingLeft: 28,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  splitCardsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginTop: 16,
  },
  splitCard: {
    flex: 0.485,
    marginHorizontal: 0,
    padding: 12,
  },
  donutChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  donutMockCircle: {
    width: 95,
    height: 95,
    borderRadius: 48,
    borderWidth: 10,
    borderColor: "#4B2C40",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  donutInnerValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  donutInnerLabel: {
    fontSize: 7,
    color: "#888",
    textAlign: "center",
    marginTop: 2,
  },
  categoryListBreakdown: {
    marginTop: 4,
  },
  catBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  catBreakdownName: {
    fontSize: 11,
    color: "#555",
    flex: 1,
    marginLeft: 6,
  },
  catBreakdownPercent: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  barChartContainerMock: {
    flexDirection: "row",
    height: 110,
    marginTop: 12,
  },
  yAxisLabelsMini: {
    justifyContent: "space-between",
    paddingRight: 4,
  },
  axisLabelMini: {
    fontSize: 9,
    color: "#999",
  },
  barCanvasMini: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
    paddingHorizontal: 4,
  },
  barGroupColumn: {
    alignItems: "center",
  },
  doubleBarFrame: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 80,
    width: 16,
    justifyContent: "space-between",
  },
  verticalBarUnit: {
    width: 7,
    borderRadius: 2,
  },
  miniMonthLabel: {
    fontSize: 8,
    color: "#999",
    marginTop: 4,
  },
  heatmapWrapper: {
    marginTop: 12,
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  heatmapDayLabel: {
    fontSize: 10,
    color: "#777",
    width: 24,
  },
  heatmapBlocksContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
  },
  heatmapBlock: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatmapXAxisTimeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 24,
    marginTop: 4,
  },
  heatmapTimeText: {
    fontSize: 8,
    color: "#999",
  },
  smartTrendsList: {
    marginTop: 8,
  },
  smartTrendRowItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  trendIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  trendItemContentText: {
    fontSize: 10,
    color: "#4A4A4A",
    lineHeight: 13,
  },
  footerNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 14 : 0,
  },
  footerItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  activeFooterText: {
    color: "#4B2C40",
    fontWeight: "600",
  },

  /* --- NEW CALENDAR MODAL STYLES --- */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: "50%",
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalHeaderKnob: {
    width: 36,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  modalList: {
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  modalItemSelected: {
    backgroundColor: "#F4F2F4",
  },
  modalItemText: {
    fontSize: 14,
    color: "#4A4A4A",
    fontWeight: "500",
  },
  modalItemTextSelected: {
    color: "#4B2C40",
    fontWeight: "700",
  },
  gaugeStatusLabel: {
    alignItems: "center",
    marginTop: 8,
  },
  gaugeStatusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D232E",
  },
  gaugeStatusSub: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
    textAlign: "center",
  },
});
