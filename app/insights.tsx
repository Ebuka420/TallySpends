import { useThemeTokens } from "../src/ThemeExperience";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { spendingSummary } from "../src/insights/summary";
import { money } from "../src/budget/ledger";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";
import { useWallet } from "../src/wallet/hooks";
import { useDashboardAccounts } from "../src/banking/useDashboardAccounts";
import { dashboardActivity } from "../src/banking/dashboard";
import { OVERVIEW_ID } from "../src/banking/carousel";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Match the smooth expand/collapse behaviour used in Customer Service.
if (
  Platform.OS === "android" &&
  UIManager &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === "function"
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function InsightsScreen() {
  const router = useRouter();
  const { accountId: routeAccountId } = useLocalSearchParams<{ accountId?: string }>();
  const accountId = typeof routeAccountId === 'string' ? routeAccountId : null;
  const store = useAppStore();
  const { transactions, transactionFeedState, transactionFeedError, refreshTransactions } = store;
  const wallet = useWallet();
  const isBank = !!accountId && accountId !== OVERVIEW_ID;
  const linked = useDashboardAccounts(wallet.api.owner || '', {
    token: isBank ? store.token : null, refreshToken: isBank ? store.refreshToken : null,
    saveTokens: async (token, refresh) => { await store.login(token, refresh); },
  });
  const selectedBank = isBank ? linked.accounts.find(account => account.id === accountId && account.status === 'Linked') : undefined;
  const activity = accountId && (!isBank || selectedBank)
    ? dashboardActivity(selectedBank, wallet.ledger, !!wallet.balance && !wallet.error) : null;
  const activityLoading = accountId ? isBank ? linked.loading : wallet.loading : transactionFeedState === 'idle' || transactionFeedState === 'loading';
  const activityError = accountId ? isBank ? linked.error : wallet.error : transactionFeedError;
  const activityName = accountId ? selectedBank?.bankName || (isBank ? 'Selected bank' : 'TallySpends wallet') : 'All recorded transactions';
  const available = accountId ? !!activity?.available && (!isBank || activity.currency === 'NGN') : transactionFeedState === 'ready';
  const retry = () => { if (isBank) linked.retry(); else if (accountId) void wallet.reload().catch(() => {}); else void refreshTransactions(true).catch(() => {}); };
  useFocusEffect(useCallback(() => { if (!accountId) void refreshTransactions(false).catch(() => {}); }, [accountId, refreshTransactions]));

  const theme = useThemeTokens();
  const [activeTab, setActiveTab] = useState<"week" | "month" | "custom">(
    "month",
  );

  // --- CALENDAR DATE PICKER STATES ---
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // Expanded tips state
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);

  const toggleTip = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTipId((currentId) => (currentId === id ? null : id));
  };

  const insightTransactions = activity ? activity.records.filter(record => !record.status || record.status === 'Posted') : accountId ? [] : transactions;
  const data = useMemo(() => spendingSummary(insightTransactions, activeTab, new Date(), startDate, endDate), [insightTransactions, activeTab, startDate, endDate]);
  const tipsLibrary = data.categories.map((category, index) => ({
    id: category.name, title: category.name, short: money(category.amount) + ' recorded spending',
    full: category.name + ' makes up ' + Math.round(category.amount / data.spent * 100) + '% of your spending in this period. Review these entries when setting your next category limit.', icon: 'pie-chart-outline'
  }));
  const heatMapBlocks = data.buckets.map(bucket => !bucket.amount ? theme.surfaceSoft : bucket.amount / data.max > .5 ? theme.accent : theme.accentSoft);
  const largest = [...data.expenses].sort((a,b) => b.kobo - a.kobo)[0];

  // --- CALENDAR UTILITIES ---
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
    const nextMonth = new Date(
      currentCalendarDate.getFullYear(),
      currentCalendarDate.getMonth() + (direction === "next" ? 1 : -1),
      1,
    );
    setCurrentCalendarDate(nextMonth);
  };

  const calendarGridDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArray: (Date | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      daysArray.push(new Date(year, month, day));
    }

    return daysArray;
  }, [currentCalendarDate]);

  const monthYearHeaderLabel = currentCalendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* --- HEADER --- */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>{activityName}{accountId === OVERVIEW_ID ? ' · Latest 50 wallet entries' : ''}</Text>
        {activityLoading && <Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary }}>Refreshing insights…</Text>}
        {activityError && <TouchableOpacity accessibilityRole="button" onPress={retry}><Text style={{ color: theme.danger }}>{activityError} Tap to retry.</Text></TouchableOpacity>}
        {!available && !activityLoading && !activityError && <Text style={{ color: theme.textSecondary }}>Transaction details for {activityName} are unavailable for these insights.</Text>}
        {available && !activityError && <>
        {/* --- TIMEFRAME TABS SEGMENTED CONTROL --- */}
        <View style={styles.segmentedControlFrame}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "week" && styles.segmentTabActive,
            ]}
            onPress={() => setActiveTab("week")}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === "week" && styles.segmentTabTextActive,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "month" && styles.segmentTabActive,
            ]}
            onPress={() => setActiveTab("month")}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === "month" && styles.segmentTabTextActive,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "custom" && styles.segmentTabActive,
              styles.customTabFlexRow,
            ]}
            onPress={() => setActiveTab("custom")}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === "custom" && styles.segmentTabTextActive,
                { marginRight: 4 },
              ]}
            >
              Custom
            </Text>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={activeTab === "custom" ? "#FFFFFF" : "#534B52"}
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
            <Text style={styles.heroSummaryMetaLabel}>
              {activeTab === "week" ? "Weekly Summary" : "Monthly Summary"}
            </Text>
            <Text style={styles.heroSummaryDateLabel}>
              {data.dateTitle}
            </Text>

            <View style={styles.heroContentMainRow}>
              <View style={styles.heroTextLeftLayout}>
                <Text style={styles.heroMainTitleBlurb}>
                  {data.headline}
                </Text>
                <Text style={styles.heroSubTextBody}>
                  {data.description}
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
              <View style={styles.heroInlineBadge}>
                <View
                  style={[
                    styles.badgeIconCircle,
                    { backgroundColor: "#E8F8F5" },
                  ]}
                >
                  <Ionicons name="trending-up" size={12} color={theme.success} />
                </View>
                <Text style={styles.heroInlineBadgeText}>{data.changeLabel}</Text>
              </View>
              <View style={styles.heroInlineBadge}>
                <View
                  style={[
                    styles.badgeIconCircle,
                    {
                      backgroundColor: theme.success,
                      borderRadius: 4,
                      width: 8,
                      height: 8,
                    },
                  ]}
                />
                <Text style={styles.heroInlineBadgeText}>
                  {data.balanceLabel}
                </Text>
              </View>
              <View style={styles.heroInlineBadge}>
                <View
                  style={[
                    styles.badgeIconCircle,
                    { backgroundColor: "#F4F6F6" },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={12}
                    color="#534B52"
                  />
                </View>
                <Text style={styles.heroInlineBadgeText}>
                  Based on {data.selected.length} transactions
                </Text>
              </View>
            </View>

            <View style={styles.heroCardBottomBannerActionRow}>
              <Ionicons
                name="star"
                size={14}
                color={theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.heroCardBottomBannerText} numberOfLines={1}>
                {data.highlight}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color="#534B52"
                style={{ marginLeft: "auto" }}
              />
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
                <Ionicons name="chevron-back" size={20} color={theme.accent} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {monthYearHeaderLabel}
              </Text>
              <TouchableOpacity onPress={() => changeMonth("next")}>
                <Ionicons name="chevron-forward" size={20} color={theme.accent} />
              </TouchableOpacity>
            </View>

            {/* Weekday Strip Headers */}
            <View style={styles.calendarWeekdaysRow}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, index) => (
                <Text key={index} style={styles.calendarWeekdayLabel}>
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
                      isStart && styles.calendarDayCellStart,
                      isEnd && styles.calendarDayCellEnd,
                      isInRange && styles.calendarDayCellInRange,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
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

        {/* --- EXPENSE CATEGORIES SUMMARY LINES --- */}
        <View style={styles.categoryRowItemLine}>
          <Text style={styles.patternCategoryLabelString}>
            {data.top?.name || "No spending recorded"}
          </Text>
          <Text style={styles.patternCategoryPercentValue}>{data.top ? Math.round(data.top.amount / data.spent * 100) + "%" : "?"}</Text>
        </View>

        {/* --- HEATMAP PATTERNS WIDGET --- */}
        <Text style={styles.patternsWidgetHighlightTextEmphasis}>
          Spending Intensity Map
        </Text>
        <Text style={styles.patternsWidgetSubTextMeta}>
          Recorded spending across the selected date range.
        </Text>

        <View style={styles.gridHeatMapMatrixWrapper}>
          {heatMapBlocks.map((color, idx) => (
            <View
              key={idx}
              style={[
                styles.gridHeatMapIndividualCell,
                { backgroundColor: color },
              ]}
            />
          ))}
        </View>

        <View style={styles.gridHeatMapTimelineLabelsRow}>
          <Text style={styles.timelineLabelText}>{data.start.toLocaleDateString()}</Text>
          <Text style={styles.timelineLabelText}>Selected period</Text>
          <Text style={styles.timelineLabelText}>{data.end.toLocaleDateString()}</Text>
        </View>

        {/* --- TOP VENDORS TRACKING SECTION --- */}
        <View style={styles.vendorFlexContainerRow}>
          <View style={styles.vendorAvatarCirclePlaceholder}>
            <Text style={styles.vendorAvatarInitials}>{largest ? largest.title.slice(0, 2).toUpperCase() : "?"}</Text>
          </View>
          <Text style={styles.vendorLabelStringName}>{largest?.title || "No expenses yet"}</Text>
          <Text style={styles.patternColorIndicatorDot}>{largest ? money(largest.kobo) : "?"}</Text>
        </View>

        {/* --- DYNAMIC TIPS & RECOMMENDATIONS --- */}
        <Text
          style={[
            styles.patternsWidgetHighlightTextEmphasis,
            { marginTop: 24 },
          ]}
        >
          Category insights
        </Text>
        <Text style={styles.patternsWidgetSubTextMeta}>
          {data.categories.length ? "Tap a category to review your recorded spending." : "Insights will appear when you have recorded expenses."}
        </Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          {tipsLibrary.map((tip) => {
            const isExpanded = expandedTipId === tip.id;
            return (
              <TouchableOpacity
                key={tip.id}
                style={[
                  styles.coachRecommendationCardItem,
                  isExpanded && styles.coachCardExpanded,
                ]}
                onPress={() => toggleTip(tip.id)}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name={tip.icon as any}
                      size={18}
                      color={theme.accent}
                    />
                    <Text
                      style={[
                        styles.patternsWidgetHighlightTextEmphasis,
                        { marginTop: 0 },
                      ]}
                    >
                      {tip.title}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.accent}
                  />
                </View>
                <Text
                  style={[
                    styles.patternsWidgetSubTextMeta,
                    { marginTop: 4, marginBottom: 0 },
                  ]}
                >
                  {tip.short}
                </Text>
                {isExpanded && (
                  <Text style={styles.expandedTipBodyText}>{tip.full}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#F0F0F2",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B2C40",
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
    backgroundColor: "#F0F0F2",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: "#4B2C40",
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#534B52",
  },
  segmentTabTextActive: {
    color: "#FFFFFF",
  },
  customTabFlexRow: {
    flexDirection: "row",
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F2",
    marginBottom: 20,
  },
  heroSummaryMetaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A6ACAF",
    textTransform: "uppercase",
  },
  heroSummaryDateLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B2C40",
    marginVertical: 4,
  },
  heroContentMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  heroTextLeftLayout: {
    flex: 1,
    paddingRight: 8,
  },
  heroMainTitleBlurb: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 6,
  },
  heroSubTextBody: {
    fontSize: 12,
    color: "#534B52",
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
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F0F0F2",
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
    color: "#534B52",
    fontWeight: "500",
  },
  heroCardBottomBannerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#F0F0F2",
    paddingTop: 12,
    marginTop: 4,
  },
  heroCardBottomBannerText: {
    fontSize: 12,
    color: "#534B52",
    fontWeight: "500",
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F2",
    marginBottom: 20,
  },
  calendarNavbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarMonthTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B2C40",
  },
  calendarWeekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  calendarWeekdayLabel: {
    width: 36,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#A6ACAF",
  },
  calendarDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  calendarDayCell: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
    borderRadius: 20,
  },
  calendarDayCellEmpty: {
    width: 40,
    height: 40,
  },
  calendarDayCellStart: {
    backgroundColor: "#4B2C40",
    borderRadius: 20,
  },
  calendarDayCellEnd: {
    backgroundColor: "#4B2C40",
    borderRadius: 20,
  },
  calendarDayCellInRange: {
    backgroundColor: "rgba(75, 44, 64, 0.1)",
    borderRadius: 0,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111111",
  },
  calendarDayTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  categoryRowItemLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F2",
    marginBottom: 12,
  },
  patternCategoryLabelString: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  patternCategoryPercentValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B2C40",
  },
  patternsWidgetHighlightTextEmphasis: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    marginTop: 12,
    marginBottom: 4,
  },
  patternsWidgetSubTextMeta: {
    fontSize: 12,
    color: "#534B52",
    marginBottom: 14,
  },
  gridHeatMapMatrixWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F2",
  },
  gridHeatMapIndividualCell: {
    width: (SCREEN_WIDTH - 96) / 7,
    height: (SCREEN_WIDTH - 96) / 7,
    borderRadius: 6,
  },
  gridHeatMapTimelineLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 20,
  },
  timelineLabelText: {
    fontSize: 11,
    color: "#A6ACAF",
    fontWeight: "500",
  },
  vendorFlexContainerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F2",
    marginBottom: 10,
  },
  vendorAvatarCirclePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vendorAvatarInitials: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B2C40",
  },
  vendorLabelStringName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  patternColorIndicatorDot: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B2C40",
  },
  coachRecommendationCardItem: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginTop: 10,
  },
  coachCardTopMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: -4,
  },
  coachCardExpanded: {
    borderColor: "#6442E5",
    backgroundColor: "#F7F5FF",
  },
  expandedTipBodyText: {
    fontSize: 12,
    color: "#534B52",
    lineHeight: 18,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#EAEAEA",
    paddingTop: 8,
  },
  chatSectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F2",
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chatHeader: {
    backgroundColor: "#4B2C40",
    padding: 16,
  },
  chatHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  chatHeaderSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  chatWindow: {
    padding: 16,
    gap: 12,
    backgroundColor: "#FAFAFA",
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: "85%",
  },
  messageBubbleBot: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderBottomLeftRadius: 4,
  },
  messageBubbleUser: {
    backgroundColor: "#4B2C40",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextBot: {
    color: "#20142A",
  },
  messageTextUser: {
    color: "#FFFFFF",
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7C7C7C",
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  chipsScrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  chipButton: {
    backgroundColor: "#F0F0F2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    color: "#4B2C40",
    fontWeight: "500",
  },
  chatInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#F0F0F2",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#F3F3F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#20142A",
  },
  chatSendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4B2C40",
    justifyContent: "center",
    alignItems: "center",
  },
  chatSendButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
});

