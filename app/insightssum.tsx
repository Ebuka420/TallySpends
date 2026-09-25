import { SpendingQuestions } from "../components/SpendingQuestions";
import { spendingSummary } from "../src/insights/summary";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function InsightsSummaryScreen() {
  const router = useRouter();
  const { themePreference, themeMode, transactions, availableBalance, budgetError, loading: isLoading, reloadBudgetWallet } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const [activeTab, setActiveTab] = useState<"week" | "month" | "custom">("month");

  // --- CALENDAR DATE PICKER STATES ---
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const scroll = useRef<ScrollView>(null);
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);

  const data = useMemo(() => spendingSummary(transactions, activeTab, new Date(), startDate, endDate), [transactions, activeTab, startDate, endDate]);
  const heatMapBlocks = data.buckets.map(bucket => bucket.amount === 0 ? (isDark ? theme.surfaceSoft : "#F0EEF2") : bucket.amount / data.max > .5 ? theme.accent : (isDark ? "#5C4A60" : "#C8B6C8"));
  useEffect(() => { setSelectedBucket(null); }, [data]);

  // Calendar utilities
  const handleDatePress = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentCalendarDate((prev) => {
      const newMonth =
        direction === "next" ? prev.getMonth() + 1 : prev.getMonth() - 1;
      return new Date(prev.getFullYear(), newMonth, 1);
    });
  };

  const monthYearHeaderLabel = currentCalendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarGridDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = [];
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(new Date(year, month, d));
    }
    return grid;
  }, [currentCalendarDate]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* --- SCREEN HEADER --- */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Insights Summary
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        ref={scroll}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {budgetError && <TouchableOpacity onPress={reloadBudgetWallet}><Text style={{ color: theme.accent, paddingBottom: 12 }}>Retry loading transactions</Text></TouchableOpacity>}
        {/* --- TIMEFRAME TABS SEGMENTED CONTROL --- */}
        <View
          style={[
            styles.segmentedControlFrame,
            { backgroundColor: isDark ? theme.surfaceSoft : "#F0EEF2", borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "week" && [styles.segmentTabActive, { backgroundColor: theme.accent }],
            ]}
            onPress={() => setActiveTab("week")}
          >
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === "week" ? "#FFFFFF" : theme.textSecondary },
                activeTab === "week" && styles.segmentTabTextActive,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "month" && [styles.segmentTabActive, { backgroundColor: theme.accent }],
            ]}
            onPress={() => setActiveTab("month")}
          >
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === "month" ? "#FFFFFF" : theme.textSecondary },
                activeTab === "month" && styles.segmentTabTextActive,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "custom" && [styles.segmentTabActive, { backgroundColor: theme.accent }],
              styles.customTabFlexRow,
            ]}
            onPress={() => setActiveTab("custom")}
          >
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === "custom" ? "#FFFFFF" : theme.textSecondary },
                activeTab === "custom" && styles.segmentTabTextActive,
                { marginRight: 4 },
              ]}
            >
              Custom
            </Text>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={activeTab === "custom" ? "#FFFFFF" : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* --- DYNAMIC HEADER CONTENT CARD --- */}
        {activeTab !== "custom" ? (
          /* --- MONTHLY SUMMARY HERO CARD --- */
          <View
            style={[
              styles.heroCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.heroSummaryMetaLabel, { color: theme.textSecondary }]}>
              {activeTab === "week" ? "Weekly Summary" : "Monthly Summary"}
            </Text>
            <Text style={[styles.heroSummaryDateLabel, { color: theme.accent }]}>
              {data.dateTitle}
            </Text>

            <View style={styles.heroContentMainRow}>
              <View style={styles.heroTextLeftLayout}>
                <Text style={[styles.heroMainTitleBlurb, { color: theme.textPrimary }]}>
                  {budgetError ? "Could not load your insights" : isLoading ? "Loading your insights…" : data.headline}
                </Text>
                <Text style={[styles.heroSubTextBody, { color: theme.textSecondary }]}>
                  {budgetError || data.description}
                </Text>
              </View>
              <View style={styles.heroGraphRightLayout}>
                <Svg width="120" height="70" viewBox="0 0 120 70">
                  <Path
                    d={data.path}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <Circle cx={data.lastPoint.x} cy={data.lastPoint.y} r="4" fill={theme.accent} />
                </Svg>
              </View>
            </View>

            {/* Quick Metrics Inline Badges Grid */}
            <View style={styles.heroBadgesRowGrid}>
              <View
                style={[
                  styles.heroInlineBadge,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#FAFAFA", borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.badgeIconCircle,
                    { backgroundColor: isDark ? "#133E23" : "#E8F8F5" },
                  ]}
                >
                  <Ionicons name={data.change !== null && data.change < 0 ? "trending-down" : "trending-up"} size={12} color={data.change !== null && data.change > 0 ? theme.accent : "#2ECC71"} />
                </View>
                <Text style={[styles.heroInlineBadgeText, { color: theme.textPrimary }]}>
                  {data.changeLabel}
                </Text>
              </View>
              <View
                style={[
                  styles.heroInlineBadge,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#FAFAFA", borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.badgeIconCircle,
                    {
                      backgroundColor: "#2ECC71",
                      borderRadius: 4,
                      width: 8,
                      height: 8,
                    },
                  ]}
                />
                <Text style={[styles.heroInlineBadgeText, { color: theme.textPrimary }]}>
                  {data.balanceLabel}
                </Text>
              </View>
              <View
                style={[
                  styles.heroInlineBadge,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#FAFAFA", borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.badgeIconCircle,
                    { backgroundColor: isDark ? theme.surfaceSoft : "#F4F6F6" },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={12}
                    color={theme.accent}
                  />
                </View>
                <Text style={[styles.heroInlineBadgeText, { color: theme.textPrimary }]}>
                  {`Based on ${data.selected.length} txns`}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.heroCardBottomBannerActionRow,
                { borderColor: theme.border },
              ]}
            >
              <Ionicons
                name="star"
                size={14}
                color={theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[styles.heroCardBottomBannerText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {data.highlight}
              </Text>
            </View>
          </View>
        ) : (
          /* --- CUSTOM CALENDAR RANGE PICKER CARD --- */
          <View
            style={[
              styles.calendarCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.calendarNavbar}>
              <TouchableOpacity onPress={() => changeMonth("prev")}>
                <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.calendarMonthTitle, { color: theme.textPrimary }]}>
                {monthYearHeaderLabel}
              </Text>
              <TouchableOpacity onPress={() => changeMonth("next")}>
                <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Weekday Strip Headers */}
            <View style={styles.calendarWeekdaysRow}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, index) => (
                <Text
                  key={index}
                  style={[styles.calendarWeekdayLabel, { color: theme.textSecondary }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Numbers Grid */}
            <View style={styles.calendarDaysGrid}>
              {calendarGridDays.map((dateItem, idx) => {
                if (!dateItem) {
                  return (
                    <View
                      key={`empty-${idx}`}
                      style={styles.calendarDayCellEmpty}
                    />
                  );
                }

                const isStart =
                  startDate &&
                  dateItem.toDateString() === startDate.toDateString();
                const isEnd =
                  endDate && dateItem.toDateString() === endDate.toDateString();
                const isInRange =
                  startDate &&
                  endDate &&
                  dateItem > startDate &&
                  dateItem < endDate;

                return (
                  <TouchableOpacity
                    key={dateItem.toISOString()}
                    onPress={() => handleDatePress(dateItem)}
                    style={[
                      styles.calendarDayCell,
                      isStart && [styles.calendarDayCellStart, { backgroundColor: theme.accent }],
                      isEnd && [styles.calendarDayCellEnd, { backgroundColor: theme.accent }],
                      isInRange && [
                        styles.calendarDayCellInRange,
                        { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : theme.accentSoft },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        { color: theme.textPrimary },
                        (isStart || isEnd) && styles.calendarDayTextActive,
                      ]}
                    >
                      {dateItem.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* --- HEATMAP PATTERNS WIDGET --- */}
        <Text style={[styles.patternsWidgetHighlightTextEmphasis, { color: theme.textPrimary }]}>
          Spending Intensity Map
        </Text>
        <Text style={[styles.patternsWidgetSubTextMeta, { color: theme.textSecondary }]}>
          {selectedBucket !== null ? `${data.buckets[selectedBucket].label} · ${data.buckets[selectedBucket].count} expenses · ₦${(data.buckets[selectedBucket].amount / 100).toLocaleString("en-NG")}` : activeTab === "custom" ? data.description : "Spending amounts across your selected period. Tap a cell for details."}
        </Text>

        <View
          style={[
            styles.gridHeatMapMatrixWrapper,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {heatMapBlocks.map((color, idx) => (
            <TouchableOpacity
              key={idx}
              accessible
              accessibilityRole="button"
              onPress={() => setSelectedBucket(idx === selectedBucket ? null : idx)}
              accessibilityLabel={`${data.buckets[idx].label}: ${data.buckets[idx].count} expenses, ${data.buckets[idx].amount / 100} naira`}
              style={[
                styles.gridHeatMapIndividualCell,
                { backgroundColor: color },
              ]}
            />
          ))}
        </View>

        <View style={styles.gridHeatMapTimelineLabelsRow}>
          <Text style={[styles.timelineLabelText, { color: theme.textSecondary }]}>{data.start.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</Text>
          <Text style={[styles.timelineLabelText, { color: theme.textSecondary }]}>{data.days} days</Text>
          <Text style={[styles.timelineLabelText, { color: theme.textSecondary }]}>{data.end.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</Text>
        </View>

        <SpendingQuestions data={data} availableBalance={availableBalance} theme={theme} dark={isDark} disabled={isLoading || !!budgetError}
          onAnswer={() => requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }))} />
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerRightPlaceholder: {
    width: 32,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  segmentedControlFrame: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  segmentTabActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customTabFlexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  segmentTabTextActive: {
    fontWeight: "700",
  },
  heroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  heroSummaryMetaLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroSummaryDateLabel: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
    marginBottom: 12,
  },
  heroContentMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  heroTextLeftLayout: {
    flex: 1,
    paddingRight: 8,
  },
  heroMainTitleBlurb: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  heroSubTextBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  heroGraphRightLayout: {
    justifyContent: "center",
    alignItems: "center",
  },
  heroBadgesRowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 12,
  },
  heroInlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeIconCircle: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  heroInlineBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  heroCardBottomBannerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  heroCardBottomBannerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  calendarCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  calendarNavbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarMonthTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  calendarWeekdaysRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 6,
  },
  calendarWeekdayLabel: {
    width: "14.285%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  calendarDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  calendarDayCell: {
    width: "14.285%",
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
    borderRadius: 18,
  },
  calendarDayCellEmpty: {
    width: "14.285%",
    height: 36,
  },
  calendarDayCellStart: {
    borderRadius: 18,
  },
  calendarDayCellEnd: {
    borderRadius: 18,
  },
  calendarDayCellInRange: {
    borderRadius: 0,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: "500",
  },
  calendarDayTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  patternsWidgetHighlightTextEmphasis: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  patternsWidgetSubTextMeta: {
    fontSize: 12,
    marginBottom: 14,
  },
  gridHeatMapMatrixWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  gridHeatMapIndividualCell: {
    width: (SCREEN_WIDTH - 32 - 32 - 48) / 7,
    height: 24,
    borderRadius: 4,
  },
  gridHeatMapTimelineLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 6,
  },
  timelineLabelText: {
    fontSize: 11,
    fontWeight: "500",
  },

});
