import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState, useRef } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type DimensionValue,
} from "react-native";
// view-shot and expo-sharing are imported dynamically at runtime
import Svg, { Path } from "react-native-svg";
import { useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";

type Timeframe = "weekly" | "monthly" | "yearly";
const options: Record<Timeframe, string[]> = {
  weekly: ["W1", "W2", "W3", "W4"],
  monthly: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  yearly: ["2024", "2025", "2026"],
};
const categoryMeta: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; tint: string }
> = {
  "Food & Dining": { icon: "fast-food-outline", tint: "#F3EBF1" },
  Transport: { icon: "car-outline", tint: "#EEE5F2" },
  Shopping: { icon: "bag-handle-outline", tint: "#F7F0F8" },
  "Bills & Utilities": { icon: "document-text-outline", tint: "#EEF7EE" },
  Entertainment: { icon: "film-outline", tint: "#F7F0F8" },
  Others: { icon: "ellipsis-horizontal", tint: "#EFEFEB" },
  Income: { icon: "cash-outline", tint: "#E9F5EE" },
};

export default function AnalyticsScreen() {
  const { transactions: rawTransactions = [], themePreference } = useAppStore();
  const transactions = rawTransactions as any[];
  const theme = getThemePalette(themePreference);
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const [period, setPeriod] = useState("May");
  const [showPeriods, setShowPeriods] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const shareRef = useRef<any>(null);

  const chooseTimeframe = (next: Timeframe) => {
    setTimeframe(next);
    setPeriod(options[next][0]);
  };

  const selectedPeriod = useMemo(() => {
    if (timeframe === "yearly") {
      const year = parseInt(period, 10);
      return isNaN(year) ? new Date().getFullYear() : year;
    }
    return period;
  }, [period, timeframe]);

  const filteredTransactions = useMemo(() => {
    if (timeframe === "yearly") {
      return transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === selectedPeriod;
      });
    }

    if (timeframe === "monthly") {
      const monthIndex = options.monthly.indexOf(period);
      return transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === monthIndex;
      });
    }

    const weekIndex = options.weekly.indexOf(period);
    if (weekIndex < 0) return transactions;

    const baseDate = new Date();
    const month = baseDate.getMonth();
    const year = baseDate.getFullYear();
    const weekStart = weekIndex * 7 + 1;
    const weekEnd = Math.min(
      weekStart + 6,
      new Date(year, month + 1, 0).getDate(),
    );

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        txDate.getFullYear() === year &&
        txDate.getMonth() === month &&
        txDate.getDate() >= weekStart &&
        txDate.getDate() <= weekEnd
      );
    });
  }, [period, timeframe, selectedPeriod, transactions]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") acc.income += Number(tx.amount || 0);
        else if (tx.type === "expense") acc.spent += Number(tx.amount || 0);
        else acc.saved += Number(tx.amount || 0);
        return acc;
      },
      { income: 0, spent: 0, saved: 0 },
    );
  }, [filteredTransactions]);

  const formatCurrency = (value: number) =>
    `₦${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    let expenseTotal = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        totals[tx.category] =
          (totals[tx.category] || 0) + Number(tx.amount || 0);
        expenseTotal += Number(tx.amount || 0);
      }
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, amount]) => ({
        name,
        amount,
        share: expenseTotal
          ? `${Math.round((amount / expenseTotal) * 100)}%`
          : "0%",
        icon: categoryMeta[name]?.icon ?? "ellipsis-horizontal",
        tint: categoryMeta[name]?.tint ?? "#EFEFEB",
      }));
  }, [filteredTransactions]);

  const chartPoints = useMemo(() => {
    if (timeframe === "yearly") {
      return Array.from({ length: 12 }, (_, idx) => {
        const label = options.monthly[idx];
        const value = filteredTransactions.reduce((sum, tx) => {
          const txDate = new Date(tx.date);
          return txDate.getMonth() === idx ? sum + Number(tx.amount || 0) : sum;
        }, 0);
        return { label, value };
      });
    }

    if (timeframe === "monthly") {
      return Array.from({ length: 4 }, (_, idx) => {
        const start = idx * 7 + 1;
        const end = idx === 3 ? 31 : start + 6;
        const value = filteredTransactions.reduce((sum, tx) => {
          const day = new Date(tx.date).getDate();
          return day >= start && day <= end
            ? sum + Number(tx.amount || 0)
            : sum;
        }, 0);
        return { label: `W${idx + 1}`, value };
      });
    }

    return options.weekly.map((label, idx) => ({
      label,
      value: filteredTransactions
        .filter((tx) => {
          const txDate = new Date(tx.date);
          const day = txDate.getDate();
          return day >= idx * 7 + 1 && day <= idx * 7 + 7;
        })
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    }));
  }, [filteredTransactions, timeframe]);

  const maxPoint = Math.max(...chartPoints.map((point) => point.value), 1);

  const linePath = useMemo(() => {
    const chartHeight = 80;
    const spacing = chartPoints.length > 1 ? 280 / (chartPoints.length - 1) : 0;
    const points = chartPoints.map((point, index) => ({
      x: 20 + index * spacing,
      y: 92 - (point.value / maxPoint) * chartHeight,
    }));

    if (!points.length) return "";
    if (points.length === 1) return `M${points[0].x} ${points[0].y}`;

    return points.reduce((path, point, index, arr) => {
      if (index === 0) return `M${point.x} ${point.y}`;
      const prev = arr[index - 1];
      const controlX = (prev.x + point.x) / 2;
      return `${path} C ${controlX} ${prev.y} ${controlX} ${point.y} ${point.x} ${point.y}`;
    }, "");
  }, [chartPoints, maxPoint]);

  const chartLabel = timeframe === "yearly" ? `${selectedPeriod}` : `${period}`;

  const reportTitle = `TallySpends ${chartLabel} analytics report`;
  const financialScore = 82;

  const reportSummary = `${formatCurrency(totals.spent)} spent, ${formatCurrency(totals.income)} earned, and ${formatCurrency(totals.saved)} saved during ${chartLabel}.`;

  const insightText =
    "Food spending was higher this week than last month. A ₦35 weekly cap could keep your budget on track.";

  const shareBody = `${reportTitle}

Financial score: ${financialScore}/100
${reportSummary}

Top categories:
${categoryTotals
  .slice(0, 3)
  .map(
    (item) => `• ${item.name}: ${item.share} (${formatCurrency(item.amount)})`,
  )
  .join("\n")}

Insight:
${insightText}`;

  const handleShareReport = async () => {
    try {
      if (shareRef.current) {
        // Try to dynamically load capture + sharing modules (optional deps)
        let capture: any = null;
        let SharingModule: any = null;
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - optional dependency, require at runtime if installed
          const vs: any = require("react-native-view-shot");
          capture = vs?.captureRef || vs?.captureScreen || null;
        } catch (e) {
          // view-shot not available
        }

        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - optional dependency, require at runtime if installed
          SharingModule = require("expo-sharing");
        } catch (e) {
          // expo-sharing not available
        }

        if (capture) {
          const uri = await capture(shareRef.current, {
            format: "png",
            quality: 0.9,
          });

          if (SharingModule && SharingModule.isAvailableAsync) {
            try {
              const available = await SharingModule.isAvailableAsync();
              if (available && SharingModule.shareAsync) {
                await SharingModule.shareAsync(uri, { dialogTitle: reportTitle });
                return;
              }
            } catch (e) {
              // fall back
            }
          }

          // Fallback to native Share API with file URL
          try {
            await Share.share({ url: uri, title: reportTitle } as any);
            return;
          } catch (e) {
            // fall through to text share
          }
        }
      }

      // Final fallback: share as text
      await Share.share({ title: reportTitle, message: shareBody });
    } catch (error) {
      console.error("Error sharing analytics report:", error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity
            style={styles.share}
            onPress={() => setShowSharePreview(true)}
          >
            <Ionicons name="share-outline" size={19} color="#20142A" />
          </TouchableOpacity>
        </View>
        <View style={styles.controls}>
          <View style={styles.segment}>
            {(["weekly", "monthly", "yearly"] as Timeframe[]).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => chooseTimeframe(item)}
                style={[
                  styles.segmentOption,
                  timeframe === item && styles.segmentActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    timeframe === item && styles.segmentTextActive,
                  ]}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.periodButton}
            onPress={() => setShowPeriods(true)}
          >
            <Text style={styles.periodText}>{period}</Text>
            <Ionicons name="chevron-down" size={14} color="#624B6A" />
          </TouchableOpacity>
        </View>

        <View style={[styles.hero, { backgroundColor: theme.background }]}>
          <Text style={styles.overline}>FINANCIAL HEALTH</Text>
          <View style={styles.heroRow}>
            <Text style={styles.score}>82</Text>
            <Text style={styles.outOf}>/100</Text>
            <View style={styles.scoreBadge}>
              <Ionicons name="arrow-up" size={12} color="#624B6A" />
              <Text style={styles.scoreBadgeText}>8%</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>You’re building healthy habits.</Text>
          <Text style={styles.heroSubtitle}>
            Your spending efficiency improved compared with last month.
          </Text>
        </View>

        <View
          style={[
            styles.trendCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>SPENDING OVERVIEW</Text>
              <Text style={styles.cardTitle}>Your {chartLabel} flow</Text>
            </View>
            <Text style={styles.cardAmount}>
              {formatCurrency(totals.spent)}
            </Text>
          </View>
          <View style={styles.chart}>
            <View style={[styles.chartGuide, { top: 31 }]} />
            <View style={[styles.chartGuide, { top: 72 }]} />
            <Svg
              width="100%"
              height="112"
              viewBox="0 0 320 112"
              preserveAspectRatio="none"
            >
              <Path
                d={`${linePath} L300 92 L20 92 Z`}
                fill="#EEE5F0"
                opacity={0.72}
              />
              <Path
                d={linePath}
                fill="none"
                stroke="#E74C3C"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            </Svg>
          </View>
          <View style={styles.chartAxis}>
            <Text style={styles.chartAxisText}>
              {chartPoints[0]?.label ?? "Start"}
            </Text>
            <Text style={styles.chartAxisText}>
              {chartPoints[chartPoints.length - 1]?.label ?? "End"}
            </Text>
          </View>
          <View style={styles.legend}>
            <Legend label="Spent" color="#E74C3C" />
            <Legend label="Income" color="#8E44AD" />
            <Legend label="Saved" color="#2ECC71" />
          </View>
        </View>

        <View style={styles.metrics}>
          <Metric
            label="INCOME"
            value={formatCurrency(totals.income)}
            icon="arrow-down-outline"
          />
          <View style={styles.metricDivider} />
          <Metric
            label="SPENT"
            value={formatCurrency(totals.spent)}
            icon="arrow-up-outline"
          />
          <View style={styles.metricDivider} />
          <Metric
            label="SAVED"
            value={formatCurrency(totals.saved)}
            icon="leaf-outline"
          />
        </View>

        <Heading title="Where your money went." action="See details" />
        <View style={styles.surface}>
          {categoryTotals.length > 0 ? (
            categoryTotals.map(({ name, amount, share, icon, tint }) => (
              <TouchableOpacity key={name} style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: tint as string },
                  ]}
                >
                  <Ionicons name={icon as any} size={18} color="#624B6A" />
                </View>
                <View style={styles.categoryCopy}>
                  <Text style={styles.categoryName}>{name}</Text>
                  <View style={styles.categoryTrack}>
                    <View
                      style={[
                        styles.categoryFill,
                        { width: share as DimensionValue },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryEnd}>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(amount)}
                  </Text>
                  <Text style={styles.categoryShare}>{share}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No expenses found for this period.
              </Text>
            </View>
          )}
        </View>

        <Heading title="Smart observations." action="View all" />
        <View style={styles.insight}>
          <View style={styles.insightIcon}>
            <Ionicons name="sparkles-outline" size={19} color="#624B6A" />
          </View>
          <View style={styles.insightCopy}>
            <Text style={styles.insightTitle}>A small shift to notice</Text>
            <Text style={styles.insightText}>
              Food spending was higher this week than it was last month. A ₦35
              weekly cap could keep you on track.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#8E7B95" />
        </View>

        <Heading title="Spending rhythm." action="This month" />
        <View style={styles.surface}>
          <Text style={styles.rhythmCaption}>
            Your busiest spending time is between 12 PM and 6 PM.
          </Text>
          <View style={styles.heatmap}>
            {[
              1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2,
              1, 0,
            ].map((intensity, index) => (
              <View
                key={index}
                style={[
                  styles.heatCell,
                  {
                    backgroundColor: [
                      "#F5F0F6",
                      "#E7DDE9",
                      "#CDBBD3",
                      "#8F729A",
                      "#624B6A",
                    ][intensity],
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.heatLabels}>
            <Text style={styles.heatLabelsText}>6 AM</Text>
            <Text style={styles.heatLabelsText}>12 PM</Text>
            <Text style={styles.heatLabelsText}>6 PM</Text>
          </View>
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={showPeriods}
        animationType="fade"
        onRequestClose={() => setShowPeriods(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPeriods(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menu}>
                <Text style={styles.menuTitle}>Select period</Text>
                {options[timeframe].map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => {
                      setPeriod(item);
                      setShowPeriods(false);
                    }}
                    style={styles.menuItem}
                  >
                    <Text
                      style={[
                        styles.menuText,
                        period === item && styles.menuActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {period === item && (
                      <Ionicons name="checkmark" size={17} color="#20142A" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        transparent
        visible={showSharePreview}
        animationType="slide"
        onRequestClose={() => setShowSharePreview(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSharePreview(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menu, styles.shareModal]}>
                <View style={styles.shareHeader}>
                  <Text style={styles.menuTitle}>Monthly Insights</Text>
                  <TouchableOpacity onPress={() => setShowSharePreview(false)}>
                    <Ionicons name="close" size={22} color="#20142A" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.shareSubtitle}>
                  {chartLabel} financial summary
                </Text>

                <View ref={shareRef} collapsable={false} style={styles.sharePreviewCard}>
                  <View style={styles.sharePreviewTop}>
                    <View style={styles.sharePreviewLogo}>
                      <Text style={styles.sharePreviewScore}>
                        {financialScore}
                      </Text>
                      <Text style={styles.sharePreviewScoreSuffix}>/100</Text>
                    </View>
                    <View style={styles.sharePreviewMeta}>
                      <Text style={styles.sharePreviewMetaLabel}>
                        Financial health
                      </Text>
                      <Text style={styles.sharePreviewMetaValue}>
                        {chartLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sharePreviewBody}>
                    <Text style={styles.sharePreviewTitle}>{reportTitle}</Text>
                    <Text style={styles.sharePreviewSubtitle}>
                      {reportSummary}
                    </Text>
                  </View>

                  <View style={styles.shareStats}>
                    <View style={styles.shareStatCard}>
                      <Text style={styles.shareStatLabel}>Spent</Text>
                      <Text style={styles.shareStatValue}>
                        {formatCurrency(totals.spent)}
                      </Text>
                    </View>
                    <View style={styles.shareStatCard}>
                      <Text style={styles.shareStatLabel}>Income</Text>
                      <Text style={styles.shareStatValue}>
                        {formatCurrency(totals.income)}
                      </Text>
                    </View>
                    <View style={styles.shareStatCard}>
                      <Text style={styles.shareStatLabel}>Saved</Text>
                      <Text style={styles.shareStatValue}>
                        {formatCurrency(totals.saved)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.shareDivider} />

                  <Text style={styles.sectionLabel}>Top categories</Text>
                  {categoryTotals.slice(0, 3).map((item) => (
                    <View key={item.name} style={styles.shareCategoryRow}>
                      <Text style={styles.shareCategoryName}>{item.name}</Text>
                      <Text style={styles.shareCategoryValue}>
                        {item.share}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.shareInsightCard}>
                    <Text style={styles.shareInsightLabel}>Insight</Text>
                    <Text style={styles.shareInsightText}>{insightText}</Text>
                  </View>
                </View>

                <View style={styles.shareFooter}>
                  <TouchableOpacity
                    style={styles.shareActionButton}
                    onPress={handleShareReport}
                  >
                    <Text style={styles.shareActionText}>Share report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
function Heading({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingTitle}>{title}</Text>
      <Text style={styles.headingAction}>{action}</Text>
    </View>
  );
}
function Legend({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={14} color="#20142A" />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  content: { padding: 20, paddingBottom: 120 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  title: {
    color: "#251A2B",
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  share: {
    alignItems: "center",
    backgroundColor: "#F3EBF1",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  segment: {
    backgroundColor: "#F3F0F4",
    borderRadius: 14,
    flexDirection: "row",
    padding: 3,
  },
  segmentOption: {
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  segmentActive: { backgroundColor: "#20142A" },
  segmentText: { color: "#82778A", fontSize: 11, fontWeight: "600" },
  segmentTextActive: { color: "#FFF" },
  periodButton: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#E9E1EB",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  periodText: { color: "#513C5B", fontSize: 11, fontWeight: "700" },
  hero: { paddingBottom: 29, paddingTop: 40 },
  overline: {
    color: "#8C7D93",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.15,
  },
  heroRow: { alignItems: "baseline", flexDirection: "row", marginTop: 4 },
  score: {
    color: "#20142A",
    fontSize: 50,
    fontWeight: "700",
    letterSpacing: -2,
  },
  outOf: { color: "#968A9B", fontSize: 16, fontWeight: "600", marginLeft: 3 },
  scoreBadge: {
    alignItems: "center",
    backgroundColor: "#F0E8F2",
    borderRadius: 13,
    flexDirection: "row",
    gap: 3,
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  scoreBadgeText: { color: "#624B6A", fontSize: 11, fontWeight: "700" },
  heroTitle: {
    color: "#302437",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  heroSubtitle: {
    color: "#817687",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  trendCard: {
    backgroundColor: "#FFF",
    borderColor: "#E9E1EB",
    borderRadius: 23,
    borderWidth: 1,
    padding: 18,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: {
    color: "#94899A",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: "#33273A",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  cardAmount: { color: "#33273A", fontSize: 14, fontWeight: "700" },
  chart: {
    borderBottomColor: "#EFE9F0",
    borderBottomWidth: 1,
    height: 112,
    marginTop: 19,
    position: "relative",
  },
  chartGuide: {
    backgroundColor: "#F0EBF1",
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
  },
  chartAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  chartAxisText: { color: "#A399A6", fontSize: 10 },
  legend: { flexDirection: "row", gap: 15, marginTop: 15 },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 5 },
  legendDot: { borderRadius: 4, height: 7, width: 7 },
  legendText: { color: "#817687", fontSize: 10 },
  metrics: {
    backgroundColor: "#F5F1F6",
    borderRadius: 20,
    flexDirection: "row",
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 17,
  },
  metric: { alignItems: "center", flex: 1 },
  metricIcon: {
    alignItems: "center",
    backgroundColor: "#E9DDEB",
    borderRadius: 11,
    height: 25,
    justifyContent: "center",
    width: 25,
  },
  metricDivider: { backgroundColor: "#DDD4E0", marginVertical: 3, width: 1 },
  metricLabel: {
    color: "#887C8D",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.65,
    marginTop: 7,
  },
  metricValue: {
    color: "#20142A",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.35,
    marginTop: 4,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 31,
  },
  headingTitle: {
    color: "#2C2033",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  headingAction: { color: "#6C4C7A", fontSize: 12, fontWeight: "600" },
  surface: {
    backgroundColor: "#FFF",
    borderColor: "#E9E1EB",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoryRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 72,
    paddingHorizontal: 15,
  },
  categoryIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  categoryCopy: { flex: 1, marginLeft: 12 },
  categoryName: { color: "#362B3D", fontSize: 14, fontWeight: "600" },
  categoryTrack: {
    backgroundColor: "#F0EBF1",
    borderRadius: 2,
    height: 4,
    marginTop: 8,
    overflow: "hidden",
    width: "88%",
  },
  categoryFill: { backgroundColor: "#624B6A", borderRadius: 2, height: "100%" },
  categoryEnd: { alignItems: "flex-end" },
  categoryAmount: { color: "#382C3F", fontSize: 13, fontWeight: "700" },
  categoryShare: { color: "#9A8FA0", fontSize: 10, marginTop: 3 },
  insight: {
    alignItems: "center",
    backgroundColor: "#F3EBF1",
    borderRadius: 21,
    flexDirection: "row",
    padding: 16,
  },
  insightIcon: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },
  insightCopy: { flex: 1, paddingRight: 8 },
  insightTitle: { color: "#34273B", fontSize: 14, fontWeight: "700" },
  insightText: { color: "#736779", fontSize: 12, lineHeight: 17, marginTop: 5 },
  rhythmCaption: {
    color: "#817687",
    fontSize: 12,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  heatmap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 15,
    paddingBottom: 10,
  },
  heatCell: { borderRadius: 5, height: 23, width: "14%" },
  heatLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  heatLabelsText: { color: "#A097A4", fontSize: 10 },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
  },
  overlay: {
    backgroundColor: "rgba(31,20,38,.18)",
    flex: 1,
    justifyContent: "flex-end",
  },
  menu: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 35,
  },
  menuTitle: {
    color: "#302437",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  menuText: { color: "#7E7284", fontSize: 14 },
  menuActive: { color: "#20142A", fontWeight: "700" },
  shareModal: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: 90,
    paddingBottom: 30,
  },
  shareHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  shareSubtitle: {
    color: "#624B6A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  shareBlurb: {
    color: "#7E7284",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  shareStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18,
  },
  shareStatCard: {
    backgroundColor: "#F7F0F8",
    borderRadius: 18,
    flex: 1,
    padding: 14,
  },
  shareStatLabel: {
    color: "#8C7D93",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
  },
  shareStatValue: {
    color: "#20142A",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionLabel: {
    color: "#8C7D93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.75,
    marginBottom: 10,
  },
  shareCategoryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomColor: "#EFE9F0",
    borderBottomWidth: 1,
  },
  shareCategoryName: {
    color: "#2C2033",
    fontSize: 14,
    fontWeight: "600",
  },
  shareCategoryValue: {
    color: "#624B6A",
    fontSize: 14,
    fontWeight: "700",
  },
  sharePreviewCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F1ECF5",
  },
  sharePreviewTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sharePreviewLogo: {
    alignItems: "center",
    backgroundColor: "#F3EBF8",
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  sharePreviewScore: {
    color: "#20142A",
    fontSize: 20,
    fontWeight: "800",
  },
  sharePreviewScoreSuffix: {
    color: "#7D5B8A",
    fontSize: 12,
    fontWeight: "700",
  },
  sharePreviewMeta: { flex: 1, marginLeft: 16 },
  sharePreviewMetaLabel: {
    color: "#8B7A96",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sharePreviewMetaValue: {
    color: "#302437",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  sharePreviewBody: {
    marginBottom: 18,
  },
  sharePreviewTitle: {
    color: "#20142A",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    lineHeight: 22,
  },
  sharePreviewSubtitle: {
    color: "#6D5A76",
    fontSize: 13,
    lineHeight: 20,
  },
  shareDivider: {
    backgroundColor: "#F0EBF1",
    height: 1,
    marginBottom: 18,
  },
  shareInsightCard: {
    backgroundColor: "#F5F0F8",
    borderRadius: 18,
    marginTop: 16,
    padding: 16,
  },
  shareInsightLabel: {
    color: "#7E6F90",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.75,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  shareInsightText: {
    color: "#20142A",
    fontSize: 14,
    lineHeight: 20,
  },
  shareFooter: {
    alignItems: "center",
    marginTop: 22,
  },
  shareActionButton: {
    alignItems: "center",
    backgroundColor: "#312147",
    borderRadius: 16,
    paddingVertical: 14,
    width: "100%",
  },
  shareActionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
