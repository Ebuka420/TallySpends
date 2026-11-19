import { useThemeTokens } from "../../src/ThemeExperience";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Modal,
    PanResponder,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ExpenseChartDetails from "../../components/ExpenseChartDetails";
import { expenseChartData, expenseReportData, EXPENSE_CHART_STYLES, EXPENSE_CHART_LABELS, EXPENSE_CHART_HINTS, type ExpenseChartStyle } from "../../src/expenses/charts";
import { useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";
import { TutorialTarget } from "../../components/SmartCoachTutorialLayer";

const normalizeTransferTitle = (title: string) => title;

const categoryMeta: Record<
  string,
  {
    icon: any;
    color: string;
  }
> = {
  "Food & Dining": {
    icon: "fast-food-outline",
    color: "#A9622C",
  },
  Transport: {
    icon: "car-outline",
    color: "#586E8D",
  },
  Shopping: {
    icon: "bag-handle-outline",
    color: "#846590",
  },
  "Bills & Utilities": {
    icon: "document-text-outline",
    color: "#5B7A67",
  },
  Entertainment: {
    icon: "film-outline",
    color: "#8A7067",
  },
  Others: {
    icon: "ellipsis-horizontal",
    color: "#70706B",
  },
};

const money = (amount: number) =>
  `₦${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type ChartStyle = ExpenseChartStyle;

export default function ExpensesScreen() {
  const router = useRouter();

  const {
    transactions: rawTransactions = [],
    transactionFeedState,
    transactionFeedError,
    excludedSandboxTransactionCount,
    refreshTransactions,
    themePreference,
    themeMode,
  } = useAppStore();

  const theme = useThemeTokens();
  const tutorialScrollRef = useRef<any>(null);
  const tutorialScrollOffset = useRef(0);
  const periodButtonRef = useRef<React.ElementRef<typeof View>>(null);
  const chartButtonRef = useRef<React.ElementRef<typeof View>>(null);

  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [showChartStyleMenu, setShowChartStyleMenu] = useState(false);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("line");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const refreshAttempt = useRef(0);

  const refresh = useCallback(async () => {
    const attempt = ++refreshAttempt.current;
    setRefreshError(null);
    try {
      await refreshTransactions(true);
    } catch (error) {
      if (attempt === refreshAttempt.current) setRefreshError(error instanceof Error ? error.message : "Couldn't load expenses. Please try again.");
    }
  }, [refreshTransactions]);

  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { refreshAttempt.current++; };
  }, [refresh]));
  const expensesError = refreshError || transactionFeedError;

  const transactions = rawTransactions as any[];

  const report = useMemo(() => expenseReportData(transactions, transactionFeedState, date, period), [transactions, transactionFeedState, date, period]);
  const expensesReady = report !== null && !refreshError;
  const chartData = report ?? expenseChartData([], date, period);
  const { transactions: periodTransactions, total, categories: categoryTotals, points: chartPoints } = chartData;

  const grouped = useMemo(
    () =>
      periodTransactions
        .slice(0, 8)
        .reduce<Record<string, any[]>>((result, tx) => {
          const txDate = new Date(tx.date);

          const key =
            txDate.toDateString() === new Date().toDateString()
              ? "Today"
              : txDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                });

          (result[key] ||= []).push(tx);

          return result;
        }, {}),
    [periodTransactions],
  );

  const maxChartValue = Math.max(...chartPoints.map((item) => item.value), 1);

  const chartPath = useMemo(() => {
    if (!chartPoints.length) {
      return "M0 100 L320 100";
    }

    const chartHeight = 80;

    const step = chartPoints.length > 1 ? 320 / (chartPoints.length - 1) : 320;

    const points = chartPoints.map((point, index) => ({
      x: index * step,
      y: 96 - (point.value / maxChartValue) * chartHeight,
    }));

    if (points.length === 1) {
      return `M${points[0].x} ${points[0].y}`;
    }

    return points.reduce((path, point, index, arr) => {
      if (index === 0) {
        return `M${point.x} ${point.y}`;
      }

      const prev = arr[index - 1];

      const controlX = (prev.x + point.x) / 2;

      return `${path} C ${controlX} ${prev.y} ${controlX} ${point.y} ${point.x} ${point.y}`;
    }, "");
  }, [chartPoints, maxChartValue]);

  const dateLabel =
    period === "year"
      ? String(date.getFullYear())
      : date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "dismissed") {
      setShowCalendar(false);
      return;
    }

    if (selected) {
      setDate(selected);
    }

    setShowCalendar(false);
  };

  const chartStyles = EXPENSE_CHART_STYLES;

  const cycleChartStyle = (direction: 1 | -1) => {
    const currentIndex = chartStyles.indexOf(chartStyle);

    const nextIndex =
      (currentIndex + direction + chartStyles.length) % chartStyles.length;

    setChartStyle(chartStyles[nextIndex]);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,

    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,

    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 40) {
        cycleChartStyle(-1);
      } else if (gestureState.dx < -40) {
        cycleChartStyle(1);
      }
    },
  });

  const chartStyleLabel = EXPENSE_CHART_LABELS[chartStyle];

  const pickerAccentColor = theme.accent;
  const pickerTextColor = theme.textPrimary;

  const categorySoftColor = theme.accentSoft;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        ref={tutorialScrollRef}
        onScroll={event => { tutorialScrollOffset.current = event.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={transactionFeedState === "loading"} onRefresh={refresh} tintColor={theme.accent} />}
      >
        <View style={styles.topbar}>
          <Text
            style={[
              styles.title,
              {
                color: theme.textPrimary,
              },
            ]}
          >
            Expenses
          </Text>

          <TutorialTarget id="expenses-filters" scrollRef={tutorialScrollRef} scrollOffsetRef={tutorialScrollOffset}><View style={styles.controls}>
            <TouchableOpacity
              onPress={() => setShowCalendar(true)}
              style={[
                styles.dateControl,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={theme.textSecondary}
              />

              <Text
                style={[
                  styles.dateControlText,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                {dateLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              ref={periodButtonRef}
              accessibilityRole="button"
              accessibilityLabel="Select expense period"
              accessibilityState={{ expanded: showPeriodMenu }}
              onPress={() => setShowPeriodMenu(true)}
              style={[
                styles.dropButton,
                {
                  backgroundColor: theme.accentSoft,
                },
              ]}
            >
              <Ionicons name="chevron-down" size={16} color={theme.accent} />
            </TouchableOpacity>
          </View></TutorialTarget>
        </View>

        {expensesReady && excludedSandboxTransactionCount > 0 && <Text style={{ color: theme.textSecondary, marginBottom: 16 }}>
          Sandbox bank activity is excluded from your personal expenses.
        </Text>}

        {!expensesReady ? <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text accessibilityRole="header" style={[styles.chartTitle, { color: theme.textPrimary }]}>
            {expensesError ? "Expenses unavailable" : "Loading expenses…"}
          </Text>
          <Text style={[styles.chartHint, { color: theme.textSecondary, marginTop: 12 }]}>
            {expensesError || "Checking your recorded transactions."}
          </Text>
          {expensesError && <TouchableOpacity accessibilityRole="button" onPress={refresh} style={{ paddingVertical: 16 }}>
            <Text style={{ color: theme.accent }}>Retry</Text>
          </TouchableOpacity>}
        </View> : <>
        <View style={styles.hero}>
          <Text
            style={[
              styles.overline,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {period === "month"
              ? "TOTAL SPENT IN SELECTED MONTH"
              : "TOTAL SPENT IN SELECTED YEAR"}
          </Text>

          <Text
            style={[
              styles.total,
              {
                color: theme.textPrimary,
              },
            ]}
          >
            {money(total)}
          </Text>

          <View style={styles.trend}>
            <Ionicons name="receipt-outline" size={13} color={theme.textSecondary} />

            <Text
              style={[
                styles.trendText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              {periodTransactions.length
                ? `Based on ${periodTransactions.length} recorded expense${periodTransactions.length === 1 ? "" : "s"}`
                : "You have no recorded expenses for this period"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={[
                  styles.chartTitle,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                Spending overview
              </Text>

              <Text
                style={[
                  styles.chartHint,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                {EXPENSE_CHART_HINTS[chartStyle]}
              </Text>
            </View>

            <View style={styles.chartHeaderRight}>
              <Text
                style={[
                  styles.chartTotal,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                {money(total)}
              </Text>

              <TouchableOpacity
                ref={chartButtonRef}
                accessibilityRole="button"
                accessibilityLabel="Select chart style"
                accessibilityState={{ expanded: showChartStyleMenu }}
                style={[
                  styles.chartPicker,
                  {
                    backgroundColor: theme.accentSoft,
                  },
                ]}
                onPress={() => setShowChartStyleMenu(true)}
              >
                <View>
                  <Text
                    style={[
                      styles.chartPickerLabel,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    Chart
                  </Text>

                  <Text
                    style={[
                      styles.chartPickerValue,
                      {
                        color: theme.accent,
                      },
                    ]}
                  >
                    {chartStyleLabel}
                  </Text>
                </View>

                <Ionicons name="chevron-down" size={13} color={theme.accent} />
              </TouchableOpacity>
            </View>
          </View>

          {!periodTransactions.length ? <Text style={{ color: theme.textSecondary, paddingVertical: 28, textAlign: "center" }}>No expenses recorded for this period.</Text>
          : chartStyle === "line" || chartStyle === "area" ? <>
          <View {...panResponder.panHandlers} style={styles.chart}>
            <View
              style={[
                styles.grid,
                {
                  backgroundColor: theme.border,
                },
              ]}
            />

            <Svg
              width="100%"
              height="112"
              viewBox="0 0 320 112"
              preserveAspectRatio="none"
            >
              <Path
                d={
                  chartStyle === "area"
                    ? `${chartPath} L320 96 L0 96 Z`
                    : chartPath
                }
                fill={chartStyle === "area" ? theme.accentSoft : "transparent"}
              />

              <Path
                d={chartPath}
                fill="none"
                stroke={theme.accent}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            </Svg>
          </View>

          <View
            style={[
              styles.axis,
              {
                borderBottomColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.axisText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              {chartPoints[0]?.label ?? "Start"}
            </Text>

            <Text
              style={[
                styles.axisText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              {chartPoints[chartPoints.length - 1]?.label ?? "End"}
            </Text>
          </View>
          </> : <ExpenseChartDetails key={`${chartStyle}:${period}:${date.getFullYear()}:${date.getMonth()}`}
            mode={chartStyle} points={chartPoints} categories={categoryTotals} total={total} theme={theme} />}

        </View>

        <View
          style={[
            styles.quietStats,
            {
              backgroundColor: theme.accentSoft,
            },
          ]}
        >
          <View style={styles.stat}>
            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              TRANSACTIONS
            </Text>

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              {periodTransactions.length}
            </Text>

            <Text
              style={[
                styles.statHint,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              In this period
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: theme.border,
              },
            ]}
          />

          <View style={styles.stat}>
            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              AVERAGE PURCHASE
            </Text>

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              {money(
                periodTransactions.length
                  ? total / periodTransactions.length
                  : 0,
              )}
            </Text>

            <Text
              style={[
                styles.statHint,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Per transaction
            </Text>
          </View>
        </View>

        <Heading
          title="By category"
          action="See all"
          onPress={() => router.push("/transaction-history" as any)}
          theme={theme}
        />

        <View
          style={[
            styles.surface,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {categoryTotals.slice(0, 4).map(([category, amount]) => (
            <Pressable
              key={category}
              onPress={() =>
                router.push({
                  pathname: "/transaction-history" as any,
                  params: { category },
                })
              }
              style={styles.row}
            >
              {(() => {
                const meta = categoryMeta[category] || categoryMeta.Others;

                return (
                  <>
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: categorySoftColor,
                        },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>

                    <View style={styles.rowCopy}>
                      <Text
                        style={[
                          styles.rowTitle,
                          {
                            color: theme.textPrimary,
                          },
                        ]}
                      >
                        {category}
                      </Text>

                      <Text
                        style={[
                          styles.rowSub,
                          {
                            color: theme.textSecondary,
                          },
                        ]}
                      >
                        {total
                          ? `${Math.round((amount / total) * 100)}% of spending`
                          : "No spending"}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.rowAmount,
                        {
                          color: theme.textPrimary,
                        },
                      ]}
                    >
                      {money(amount)}
                    </Text>
                  </>
                );
              })()}
            </Pressable>
          ))}
        </View>

        <Heading
          title="Transactions"
          action="View all"
          onPress={() => router.push("/transaction-history" as any)}
          theme={theme}
        />

        <TutorialTarget id="expenses-history" scrollRef={tutorialScrollRef} scrollOffsetRef={tutorialScrollOffset}><View style={styles.transactions}>
          {Object.entries(grouped).map(([day, items]) => (
            <View
              key={day}
              style={[
                styles.surface,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.groupHeader}>
                <Text
                  style={[
                    styles.groupDay,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  {day}
                </Text>

                <Text
                  style={[
                    styles.groupTotal,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  {money(
                    items.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
                  )}
                </Text>
              </View>

              {items.map((tx) => {
                const meta = categoryMeta[tx.category] || categoryMeta.Others;

                return (
                  <Pressable
                    key={tx.id}
                    onPress={() => router.push({ pathname: "/transaction-details", params: { id: tx.id } })}
                    style={styles.row}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: categorySoftColor,
                        },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>

                    <View style={styles.rowCopy}>
                      <Text
                        style={[
                          styles.rowTitle,
                          {
                            color: theme.textPrimary,
                          },
                        ]}
                      >
                        {normalizeTransferTitle(tx.title)}
                      </Text>

                      <Text
                        style={[
                          styles.rowSub,
                          {
                            color: theme.textSecondary,
                          },
                        ]}
                      >
                        {tx.category}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.rowAmount,
                        {
                          color: theme.textPrimary,
                        },
                      ]}
                    >
                      {money(Number(tx.amount))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View></TutorialTarget>

        {!periodTransactions.length && (
          <Text
            style={[
              styles.empty,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            No expenses recorded for this period.
          </Text>
        )}
        </>}
      </ScrollView>

      {showCalendar && (
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: theme.textPrimary }]}>
              Pick a date
            </Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Text style={[styles.pickerDoneText, { color: theme.accent }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            themeVariant={themeMode}
            accentColor={pickerAccentColor}
            textColor={pickerTextColor}
          />
        </View>
      )}

      <AnchoredExpensesMenu
        visible={showPeriodMenu}
        anchorRef={periodButtonRef}
        onClose={() => setShowPeriodMenu(false)}
        theme={theme}
      >
            {(["month", "year"] as const).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setPeriod(item);
                  setShowPeriodMenu(false);
                }}
                style={styles.menuItem}
              >
                <Text
                  style={[
                    styles.menuText,
                    {
                      color: theme.textSecondary,
                    },
                    period === item && {
                      color: theme.accent,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {item === "month" ? "This month" : "This year"}
                </Text>

                {period === item && (
                  <Ionicons name="checkmark" size={16} color={theme.accent} />
                )}
              </TouchableOpacity>
            ))}
      </AnchoredExpensesMenu>

      <AnchoredExpensesMenu
        visible={showChartStyleMenu}
        anchorRef={chartButtonRef}
        onClose={() => setShowChartStyleMenu(false)}
        theme={theme}
      >
            <Text
              style={[
                styles.menuTitle,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              Select chart style
            </Text>

            {EXPENSE_CHART_STYLES.map((item) => {
              const label = `${EXPENSE_CHART_LABELS[item]} view`;

              return (
                <TouchableOpacity
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: chartStyle === item }}
                  onPress={() => {
                    setChartStyle(item);
                    setShowChartStyleMenu(false);
                  }}
                  style={styles.menuItem}
                >
                  <Text
                    style={[
                      styles.menuText,
                      {
                        color: theme.textSecondary,
                      },
                      chartStyle === item && {
                        color: theme.accent,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {label}
                  </Text>

                  {chartStyle === item && (
                    <Ionicons name="checkmark" size={16} color={theme.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
      </AnchoredExpensesMenu>
    </SafeAreaView>
  );
}

function AnchoredExpensesMenu({ visible, anchorRef, onClose, theme, children }: {
  visible: boolean;
  anchorRef: React.RefObject<React.ElementRef<typeof View> | null>;
  onClose: () => void;
  theme: ReturnType<typeof getThemePalette>;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<React.ElementRef<typeof View>>(null);
  const menuRef = useRef<React.ElementRef<typeof View>>(null);
  const { width, height } = useWindowDimensions();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const measurement = useRef(0);

  const alignMenu = React.useCallback(() => {
    const request = ++measurement.current;
    anchorRef.current?.measureInWindow((x, y, buttonWidth, buttonHeight) => {
      overlayRef.current?.measureInWindow((overlayX, overlayY, overlayWidth, overlayHeight) => {
        menuRef.current?.measureInWindow((_x, _y, menuWidth, menuHeight) => {
          if (request !== measurement.current || !buttonWidth || !overlayWidth || !menuHeight) return;
          // Convert window coordinates into this modal's coordinates, including
          // any status-bar offset. Align right edges with a small gap below.
          const left = Math.max(8, Math.min(x - overlayX + buttonWidth - menuWidth, overlayWidth - menuWidth - 8));
          const below = y - overlayY + buttonHeight + 6;
          const top = Math.max(8, Math.min(
            below + menuHeight <= overlayHeight - 8 ? below : y - overlayY - menuHeight - 6,
            overlayHeight - menuHeight - 8,
          ));
          setPosition(previous => previous?.left === left && previous.top === top ? previous : { left, top });
        });
      });
    });
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    setPosition(null);
    if (visible) alignMenu();
    return () => { measurement.current++; };
  }, [visible, width, height, alignMenu]);

  return <Modal transparent visible={visible} animationType="fade"
    statusBarTranslucent navigationBarTranslucent onShow={alignMenu} onRequestClose={onClose}>
    <View ref={overlayRef} collapsable={false} style={styles.modal} onLayout={alignMenu}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close dropdown" />
      <View ref={menuRef} collapsable={false} onLayout={alignMenu}
        pointerEvents={position ? "auto" : "none"}
        style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border,
          maxWidth: width - 16, maxHeight: height - 16,
          left: position?.left ?? 0, top: position?.top ?? 0, opacity: position ? 1 : 0 }]}>
        {children}
      </View>
    </View>
  </Modal>;
}

function Heading({
  title,
  action,
  onPress,
  theme,
}: {
  title: string;
  action: string;
  onPress?: () => void;
  theme: any;
}) {
  return (
    <View style={styles.heading}>
      <Text
        style={[
          styles.headingTitle,
          {
            color: theme.textPrimary,
          },
        ]}
      >
        {title}
      </Text>

      <TouchableOpacity onPress={onPress}>
        <Text
          style={[
            styles.action,
            {
              color: theme.accent,
            },
          ]}
        >
          {action}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  topbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.7,
  },

  controls: {
    flexDirection: "row",
    gap: 7,
  },

  dateControl: {
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  dateControlText: {
    fontSize: 12,
    fontWeight: "600",
  },

  dropButton: {
    alignItems: "center",
    borderRadius: 17,
    justifyContent: "center",
    width: 34,
    height: 34,
  },

  hero: {
    alignItems: "center",
    paddingVertical: 39,
  },

  overline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.15,
  },

  total: {
    fontSize: 46,
    fontWeight: "700",
    letterSpacing: -2.1,
    marginTop: 7,
  },

  trend: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 9,
  },

  trendText: {
    fontSize: 13,
  },

  chartCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  chartHeaderRight: {
    alignItems: "flex-end",
    gap: 8,
  },

  chartTitle: {
    fontSize: 13,
    fontWeight: "500",
  },

  chartHint: {
    fontSize: 10,
    marginTop: 4,
  },

  chartPicker: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  chartPickerLabel: {
    fontSize: 9,
    fontWeight: "700",
  },

  chartPickerValue: {
    fontSize: 11,
    fontWeight: "700",
  },

  chartTotal: {
    fontSize: 13,
    fontWeight: "700",
  },

  chart: {
    alignItems: "flex-end",
    borderBottomWidth: 1,
    height: 112,
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 3,
  },

  grid: {
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
    top: 44,
  },

  axis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  axisText: {
    fontSize: 11,
  },

  quietStats: {
    borderRadius: 20,
    flexDirection: "row",
    marginTop: 14,
    padding: 17,
  },

  stat: {
    flex: 1,
  },

  divider: {
    marginHorizontal: 12,
    width: 1,
  },

  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 5,
  },

  statHint: {
    fontSize: 10,
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
    fontSize: 18,
    fontWeight: "700",
  },

  action: {
    fontSize: 12,
    fontWeight: "600",
  },

  surface: {
    borderRadius: 21,
    borderWidth: 1,
    overflow: "hidden",
  },

  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 70,
    paddingHorizontal: 15,
  },

  iconBox: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    width: 40,
  },

  rowCopy: {
    flex: 1,
    marginLeft: 12,
  },

  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  rowSub: {
    fontSize: 11,
    marginTop: 3,
  },

  rowAmount: {
    fontSize: 14,
    fontWeight: "700",
  },

  transactions: {
    gap: 15,
  },

  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 14,
  },

  groupDay: {
    fontSize: 12,
    fontWeight: "600",
  },

  groupTotal: {
    fontSize: 12,
    fontWeight: "600",
  },

  empty: {
    fontSize: 13,
    marginTop: 22,
    textAlign: "center",
  },

  pickerContainer: {
    alignItems: "center",
    borderTopWidth: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },

  pickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: "100%",
  },

  pickerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  pickerDoneText: {
    fontSize: 14,
    fontWeight: "700",
  },

  modal: {
    backgroundColor: "rgba(25,20,18,0.18)",
    flex: 1,
  },

  menuTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    paddingHorizontal: 15,
    paddingTop: 12,
  },

  menu: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 5,
    overflow: "hidden",
    width: 160,
  },

  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },

  menuText: {
    fontSize: 13,
  },
});

