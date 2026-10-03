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
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
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
  {
    icon: keyof typeof Ionicons.glyphMap;
    tint: string;
  }
> = {
  "Food & Dining": {
    icon: "fast-food-outline",
    tint: "#F3EBF1",
  },
  Transport: {
    icon: "car-outline",
    tint: "#EEE5F2",
  },
  Shopping: {
    icon: "bag-handle-outline",
    tint: "#F7F0F8",
  },
  "Bills & Utilities": {
    icon: "document-text-outline",
    tint: "#EEF7EE",
  },
  Entertainment: {
    icon: "film-outline",
    tint: "#F7F0F8",
  },
  Others: {
    icon: "ellipsis-horizontal",
    tint: "#EFEFEB",
  },
  Income: {
    icon: "cash-outline",
    tint: "#E9F5EE",
  },
};

export default function AnalyticsScreen() {
  const { transactions: rawTransactions = [], themePreference, themeMode } = useAppStore();

  const transactions = rawTransactions as any[];

  const theme = getThemePalette(themePreference, themeMode);

  /*
   * Keep all screen colors tied to the active theme.
   *
   * The existing theme palette exposes background, surface and border,
   * so these derived values let this screen stay theme-aware without
   * assuming additional properties that may not exist in src/theme.
   */
  const isDark = themeMode === "dark";

  const colors = useMemo(
    () => ({
      background: theme.background,
      surface: theme.surface,
      border: theme.border,

      primary: theme.accent,
      primaryStrong: isDark ? theme.textPrimary : theme.accent,
      primarySoft: theme.accentSoft,
      primaryMuted: theme.accentSecondary,

      text: theme.textPrimary,
      textStrong: theme.textPrimary,
      textBody: theme.textPrimary,
      textMuted: theme.textSecondary,
      textSubtle: theme.textSecondary,

      controlBackground: isDark ? theme.surfaceSoft : theme.mutedBackground,
      track: isDark ? theme.border : theme.border,
      guide: isDark ? theme.border : theme.border,

      metricBackground: isDark ? theme.surfaceSoft : theme.mutedBackground,
      metricIconBackground: theme.accentSoft,
      metricDivider: theme.border,

      insightBackground: theme.accentSoft,
      insightIconBackground: theme.surface,

      modalOverlay: isDark ? "rgba(0, 0, 0, 0.65)" : "rgba(31, 20, 38, 0.25)",

      expense: theme.danger,
      income: theme.accent,
      saved: theme.success,

      heatmap: [
        isDark ? theme.surfaceSoft : theme.mutedBackground,
        theme.accentSoft,
        theme.accentSecondary,
        theme.accentHighlight,
        theme.accent,
      ],
    }),
    [isDark, theme],
  );

  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");

  const [period, setPeriod] = useState(() => {
    const currentMonth = options.monthly[new Date().getMonth()];
    return currentMonth ?? "May";
  });

  const [showPeriods, setShowPeriods] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const shareRef = useRef<any>(null);

  const chooseTimeframe = (next: Timeframe) => {
    setTimeframe(next);

    if (next === "monthly") {
      const currentMonth = options.monthly[new Date().getMonth()] ?? "May";

      setPeriod(currentMonth);
      return;
    }

    if (next === "yearly") {
      setPeriod(String(new Date().getFullYear()));
      return;
    }

    setPeriod(options.weekly[0]);
  };

  const selectedPeriod = useMemo(() => {
    if (timeframe === "yearly") {
      const year = parseInt(period, 10);

      return Number.isNaN(year) ? new Date().getFullYear() : year;
    }

    return period;
  }, [period, timeframe]);

  const filteredTransactions = useMemo(() => {
    if (timeframe === "yearly") {
      return transactions.filter((tx) => {
        const txDate = new Date(tx.date);

        return (
          !Number.isNaN(txDate.getTime()) &&
          txDate.getFullYear() === selectedPeriod
        );
      });
    }

    if (timeframe === "monthly") {
      const monthIndex = options.monthly.indexOf(period);

      return transactions.filter((tx) => {
        const txDate = new Date(tx.date);

        return (
          !Number.isNaN(txDate.getTime()) && txDate.getMonth() === monthIndex
        );
      });
    }

    const weekIndex = options.weekly.indexOf(period);

    if (weekIndex < 0) {
      return [];
    }

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
        !Number.isNaN(txDate.getTime()) &&
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
        const amount = Number(tx.amount || 0);

        if (tx.type === "income") {
          acc.income += amount;
        } else if (tx.type === "expense") {
          acc.spent += amount;
        } else {
          acc.saved += amount;
        }

        return acc;
      },
      {
        income: 0,
        spent: 0,
        saved: 0,
      },
    );
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => {
    const isClean = value % 1 === 0 || Math.abs(value) >= 1000;
    return `₦${value.toLocaleString(undefined, {
      minimumFractionDigits: isClean ? 0 : 2,
      maximumFractionDigits: isClean ? 0 : 2,
    })}`;
  };

  const categoryTotals = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    let expenseTotal = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type !== "expense") {
        return;
      }

      const amount = Number(tx.amount || 0);

      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + amount;

      expenseTotal += amount;
    });

    return Object.entries(categoryMap)
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

          if (Number.isNaN(txDate.getTime()) || tx.type !== "expense") {
            return sum;
          }

          return txDate.getMonth() === idx ? sum + Number(tx.amount || 0) : sum;
        }, 0);

        return {
          label,
          value,
        };
      });
    }

    if (timeframe === "monthly") {
      const monthIndex = options.monthly.indexOf(period);

      return Array.from({ length: 4 }, (_, idx) => {
        const start = idx * 7 + 1;

        const end =
          idx === 3
            ? new Date(new Date().getFullYear(), monthIndex + 1, 0).getDate()
            : start + 6;

        const value = filteredTransactions.reduce((sum, tx) => {
          const txDate = new Date(tx.date);

          if (Number.isNaN(txDate.getTime()) || tx.type !== "expense") {
            return sum;
          }

          const day = txDate.getDate();

          return day >= start && day <= end
            ? sum + Number(tx.amount || 0)
            : sum;
        }, 0);

        return {
          label: `W${idx + 1}`,
          value,
        };
      });
    }

    const weekIndex = options.weekly.indexOf(period);

    return options.weekly.map((label, idx) => ({
      label,
      value: filteredTransactions
        .filter((tx) => {
          const txDate = new Date(tx.date);

          if (Number.isNaN(txDate.getTime()) || tx.type !== "expense") {
            return false;
          }

          const day = txDate.getDate();

          return day >= idx * 7 + 1 && day <= idx * 7 + 7 && idx === weekIndex;
        })
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    }));
  }, [filteredTransactions, period, timeframe]);

  const maxPoint = Math.max(...chartPoints.map((point) => point.value), 1);

  const linePath = useMemo(() => {
    const chartHeight = 80;

    const spacing = chartPoints.length > 1 ? 280 / (chartPoints.length - 1) : 0;

    const points = chartPoints.map((point, index) => ({
      x: 20 + index * spacing,
      y: 92 - (point.value / maxPoint) * chartHeight,
    }));

    if (!points.length) {
      return "";
    }

    if (points.length === 1) {
      return `M${points[0].x} ${points[0].y}`;
    }

    return points.reduce((path, point, index, arr) => {
      if (index === 0) {
        return `M${point.x} ${point.y}`;
      }

      const previous = arr[index - 1];
      const controlX = (previous.x + point.x) / 2;

      return `${path} C ${controlX} ${previous.y} ${controlX} ${point.y} ${point.x} ${point.y}`;
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
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Analytics
          </Text>

          <TouchableOpacity
            style={[
              styles.share,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
            onPress={() => setShowSharePreview(true)}
            accessibilityRole="button"
            accessibilityLabel="Share analytics report"
          >
            <Ionicons
              name="share-outline"
              size={19}
              color={colors.primaryStrong}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <View
            style={[
              styles.segment,
              {
                backgroundColor: colors.controlBackground,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            {(["weekly", "monthly", "yearly"] as Timeframe[]).map((item) => {
              const isActive = timeframe === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => chooseTimeframe(item)}
                  style={[
                    styles.segmentOption,
                    isActive && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: isActive ? "#FFFFFF" : colors.textMuted,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                  >
                    {item[0].toUpperCase() + item.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.periodButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowPeriods(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodText,
                {
                  color: colors.textStrong,
                },
              ]}
            >
              {period}
            </Text>

            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.hero,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.overline,
              {
                color: colors.textMuted,
              },
            ]}
          >
            FINANCIAL HEALTH
          </Text>

          <View style={styles.heroRow}>
            <Text
              style={[
                styles.score,
                {
                  color: colors.textStrong,
                },
              ]}
            >
              82
            </Text>

            <Text
              style={[
                styles.outOf,
                {
                  color: colors.textSubtle,
                },
              ]}
            >
              /100
            </Text>

            <View
              style={[
                styles.scoreBadge,
                {
                  backgroundColor: colors.primarySoft,
                },
              ]}
            >
              <Ionicons name="arrow-up" size={12} color={colors.primary} />

              <Text
                style={[
                  styles.scoreBadgeText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                8%
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.heroTitle,
              {
                color: colors.textBody,
              },
            ]}
          >
            You’re building healthy habits.
          </Text>

          <Text
            style={[
              styles.heroSubtitle,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Your spending efficiency improved compared with last month.
          </Text>
        </View>

        <View
          style={[
            styles.trendCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: colors.textSubtle,
                  },
                ]}
              >
                SPENDING OVERVIEW
              </Text>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.textBody,
                  },
                ]}
              >
                Your {chartLabel} flow
              </Text>
            </View>

            <Text
              style={[
                styles.cardAmount,
                {
                  color: colors.textBody,
                },
              ]}
            >
              {formatCurrency(totals.spent)}
            </Text>
          </View>

          <View
            style={[
              styles.chart,
              {
                borderBottomColor: colors.guide,
              },
            ]}
          >
            <View
              style={[
                styles.chartGuide,
                {
                  top: 31,
                  backgroundColor: colors.guide,
                },
              ]}
            />

            <View
              style={[
                styles.chartGuide,
                {
                  top: 72,
                  backgroundColor: colors.guide,
                },
              ]}
            />

            <Svg
              width="100%"
              height="112"
              viewBox="0 0 320 112"
              preserveAspectRatio="none"
            >
              {linePath ? (
                <>
                  <Defs>
                    <LinearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                      <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.0} />
                    </LinearGradient>
                  </Defs>

                  <Path
                    d={`${linePath} L300 92 L20 92 Z`}
                    fill="url(#analyticsGradient)"
                  />

                  <Path
                    d={linePath}
                    fill="none"
                    stroke={colors.primary}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  />
                </>
              ) : null}
            </Svg>
          </View>

          <View style={styles.chartAxis}>
            <Text
              style={[
                styles.chartAxisText,
                {
                  color: colors.textSubtle,
                },
              ]}
            >
              {chartPoints[0]?.label ?? "Start"}
            </Text>

            <Text
              style={[
                styles.chartAxisText,
                {
                  color: colors.textSubtle,
                },
              ]}
            >
              {chartPoints[chartPoints.length - 1]?.label ?? "End"}
            </Text>
          </View>

          <View style={styles.legend}>
            <Legend
              label="Spent"
              color={colors.primary}
              textColor={colors.textMuted}
            />

            <Legend
              label="Income"
              color={colors.income}
              textColor={colors.textMuted}
            />

            <Legend
              label="Saved"
              color={colors.saved}
              textColor={colors.textMuted}
            />
          </View>
        </View>

        <View
          style={[
            styles.metrics,
            {
              backgroundColor: colors.metricBackground,
            },
          ]}
        >
          <Metric
            label="INCOME"
            value={formatCurrency(totals.income)}
            icon="arrow-down-outline"
            colors={colors}
          />

          <View
            style={[
              styles.metricDivider,
              {
                backgroundColor: colors.metricDivider,
              },
            ]}
          />

          <Metric
            label="SPENT"
            value={formatCurrency(totals.spent)}
            icon="arrow-up-outline"
            colors={colors}
          />

          <View
            style={[
              styles.metricDivider,
              {
                backgroundColor: colors.metricDivider,
              },
            ]}
          />

          <Metric
            label="SAVED"
            value={formatCurrency(totals.saved)}
            icon="leaf-outline"
            colors={colors}
          />
        </View>

        <Heading
          title="Where your money went."
          action="See details"
          colors={colors}
        />

        <View
          style={[
            styles.surface,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {categoryTotals.length > 0 ? (
            categoryTotals.map(({ name, amount, share, icon, tint }) => (
              <TouchableOpacity key={name} style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: colors.primarySoft,
                    },
                  ]}
                >
                  <Ionicons name={icon} size={18} color={colors.primary} />
                </View>

                <View style={styles.categoryCopy}>
                  <Text
                    style={[
                      styles.categoryName,
                      {
                        color: colors.textBody,
                      },
                    ]}
                  >
                    {name}
                  </Text>

                  <View
                    style={[
                      styles.categoryTrack,
                      {
                        backgroundColor: colors.track,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryFill,
                        {
                          width: share as DimensionValue,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.categoryEnd}>
                  <Text
                    style={[
                      styles.categoryAmount,
                      {
                        color: colors.textBody,
                      },
                    ]}
                  >
                    {formatCurrency(amount)}
                  </Text>

                  <Text
                    style={[
                      styles.categoryShare,
                      {
                        color: colors.textSubtle,
                      },
                    ]}
                  >
                    {share}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                No expenses found for this period.
              </Text>
            </View>
          )}
        </View>

        <Heading
          title="Smart observations."
          action="View all"
          colors={colors}
        />

        <View
          style={[
            styles.insight,
            {
              backgroundColor: colors.insightBackground,
            },
          ]}
        >
          <View
            style={[
              styles.insightIcon,
              {
                backgroundColor: colors.insightIconBackground,
              },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={19}
              color={colors.primary}
            />
          </View>

          <View style={styles.insightCopy}>
            <Text
              style={[
                styles.insightTitle,
                {
                  color: colors.textBody,
                },
              ]}
            >
              A small shift to notice
            </Text>

            <Text
              style={[
                styles.insightText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Food spending was higher this week than it was last month. A ₦35
              weekly cap could keep you on track.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primaryMuted}
          />
        </View>

        <Heading title="Spending rhythm." action="This month" colors={colors} />

        <View
          style={[
            styles.surface,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.rhythmCaption,
              {
                color: colors.textMuted,
              },
            ]}
          >
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
                    backgroundColor: colors.heatmap[intensity],
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.heatLabels}>
            <Text
              style={[
                styles.heatLabelsText,
                {
                  color: colors.textSubtle,
                },
              ]}
            >
              6 AM
            </Text>

            <Text
              style={[
                styles.heatLabelsText,
                {
                  color: colors.textSubtle,
                },
              ]}
            >
              12 PM
            </Text>

            <Text
              style={[
                styles.heatLabelsText,
                {
                  color: colors.textSubtle,
                },
              ]}
            >
              6 PM
            </Text>
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
          <View
            style={[
              styles.overlay,
              {
                backgroundColor: colors.modalOverlay,
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.menu,
                  {
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.menuTitle,
                    {
                      color: colors.textStrong,
                    },
                  ]}
                >
                  Select period
                </Text>

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
                        {
                          color:
                            period === item
                              ? colors.textStrong
                              : colors.textMuted,
                          fontWeight: period === item ? "700" : "400",
                        },
                      ]}
                    >
                      {item}
                    </Text>

                    {period === item && (
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color={colors.primary}
                      />
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

type ScreenColors = {
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  primaryMuted: string;
  text: string;
  textStrong: string;
  textBody: string;
  textMuted: string;
  metricBackground: string;
  metricIconBackground: string;
};

function Heading({
  title,
  action,
  colors,
}: {
  title: string;
  action: string;
  colors: ScreenColors;
}) {
  return (
    <View style={styles.heading}>
      <Text
        style={[
          styles.headingTitle,
          {
            color: colors.textBody,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.headingAction,
          {
            color: colors.primary,
          },
        ]}
      >
        {action}
      </Text>
    </View>
  );
}

function Legend({
  label,
  color,
  textColor,
}: {
  label: string;
  color: string;
  textColor: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text
        style={[
          styles.legendText,
          {
            color: textColor,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function Metric({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ScreenColors;
}) {
  return (
    <View style={styles.metric}>
      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor: colors.metricIconBackground,
          },
        ]}
      >
        <Ionicons name={icon} size={14} color={colors.primaryStrong} />
      </View>

      <Text
        style={[
          styles.metricLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.metricValue,
          {
            color: colors.textStrong,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.55}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },

  title: {
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.7,
  },

  share: {
    alignItems: "center",
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
    borderRadius: 14,
    flexDirection: "row",
    padding: 3,
  },

  segmentOption: {
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  segmentText: {
    fontSize: 11,
    fontWeight: "600",
  },

  periodButton: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  periodText: {
    fontSize: 11,
    fontWeight: "700",
  },

  hero: {
    paddingBottom: 29,
    paddingTop: 40,
  },

  overline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.15,
  },

  heroRow: {
    alignItems: "baseline",
    flexDirection: "row",
    marginTop: 4,
  },

  score: {
    fontSize: 50,
    fontWeight: "700",
    letterSpacing: -2,
  },

  outOf: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 3,
  },

  scoreBadge: {
    alignItems: "center",
    borderRadius: 13,
    flexDirection: "row",
    gap: 3,
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  scoreBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  heroTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },

  heroSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  trendCard: {
    borderRadius: 23,
    borderWidth: 1,
    padding: 18,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },

  cardAmount: {
    fontSize: 14,
    fontWeight: "700",
  },

  chart: {
    borderBottomWidth: 1,
    height: 112,
    marginTop: 19,
    position: "relative",
  },

  chartGuide: {
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

  chartAxisText: {
    fontSize: 10,
  },

  legend: {
    flexDirection: "row",
    gap: 15,
    marginTop: 15,
  },

  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },

  legendDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },

  legendText: {
    fontSize: 10,
  },

  metrics: {
    borderRadius: 20,
    flexDirection: "row",
    marginTop: 14,
    paddingHorizontal: 8,
    paddingVertical: 16,
    alignItems: "center",
  },

  metric: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 2,
    minWidth: 0,
  },

  metricIcon: {
    alignItems: "center",
    borderRadius: 11,
    height: 25,
    justifyContent: "center",
    width: 25,
  },

  metricDivider: {
    marginVertical: 3,
    width: 1,
    height: 32,
  },

  metricLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 0.65,
    marginTop: 7,
  },

  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 4,
    textAlign: "center",
    width: "100%",
  },

  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 31,
  },

  headingTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.35,
  },

  headingAction: {
    fontSize: 12,
    fontWeight: "600",
  },

  surface: {
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
    flexShrink: 0,
  },

  categoryCopy: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 0,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: "600",
  },

  categoryTrack: {
    borderRadius: 2,
    height: 4,
    marginTop: 8,
    overflow: "hidden",
    width: "92%",
  },

  categoryFill: {
    borderRadius: 2,
    height: "100%",
  },

  categoryEnd: {
    alignItems: "flex-end",
    flexShrink: 0,
    minWidth: 70,
  },

  categoryAmount: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },

  categoryShare: {
    fontSize: 10,
    marginTop: 3,
    textAlign: "right",
  },

  insight: {
    alignItems: "center",
    borderRadius: 21,
    flexDirection: "row",
    padding: 16,
  },

  insightIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },

  insightCopy: {
    flex: 1,
    paddingRight: 8,
  },

  insightTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  insightText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },

  rhythmCaption: {
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

  heatCell: {
    borderRadius: 5,
    height: 23,
    width: "14%",
  },

  heatLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 15,
  },

  heatLabelsText: {
    fontSize: 10,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 14,
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  menu: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 35,
  },

  menuTitle: {
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

  menuText: {
    fontSize: 14,
  },
  shareModal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 35,
  },

  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  shareSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },

  sharePreviewCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEE",
    padding: 16,
    marginBottom: 12,
  },

  sharePreviewTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  sharePreviewLogo: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F6F2FC",
    padding: 12,
    marginRight: 12,
  },

  sharePreviewScore: {
    fontSize: 28,
    fontWeight: "700",
  },

  sharePreviewScoreSuffix: {
    fontSize: 12,
    marginTop: 4,
  },

  sharePreviewMeta: {
    flex: 1,
  },

  sharePreviewMetaLabel: {
    fontSize: 10,
    color: "#777",
    fontWeight: "700",
  },

  sharePreviewMetaValue: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },

  sharePreviewBody: {
    marginTop: 12,
  },

  sharePreviewTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  sharePreviewSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },

  shareStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  shareStatCard: {
    flex: 1,
    alignItems: "center",
  },

  shareStatLabel: {
    fontSize: 10,
    color: "#777",
  },

  shareStatValue: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
  },

  shareDivider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 14,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },

  shareCategoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  shareCategoryName: {
    fontSize: 14,
  },

  shareCategoryValue: {
    fontSize: 13,
    color: "#666",
  },

  shareInsightCard: {
    backgroundColor: "#F6F2FC",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },

  shareInsightLabel: {
    fontSize: 12,
    fontWeight: "700",
  },

  shareInsightText: {
    fontSize: 12,
    color: "#444",
    marginTop: 6,
  },

  shareFooter: {
    alignItems: "center",
    marginTop: 12,
  },

  shareActionButton: {
    backgroundColor: "#4B2C40",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  shareActionText: {
    color: "#FFF",
    fontWeight: "700",
  },
});
