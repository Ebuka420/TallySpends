import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const SUGGESTED_PROMPTS = [
  "Where did most of my money go?",
  "Why did I spend more this month?",
  "How can I save ₦50,000 next month?",
  "What category am I spending the most on?",
];

export default function InsightsSummaryScreen() {
  const router = useRouter();
  const { themePreference, themeMode, transactions } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const [activeTab, setActiveTab] = useState<"week" | "month" | "custom">("month");

  // --- CALENDAR DATE PICKER STATES ---
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    new Date(2026, 4, 1),
  ); // Default focused month: May 2026
  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 4, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 4, 15));

  // --- ASK AI STATE ---
  const [aiQuestion, setAiQuestion] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [activeAiAnswer, setActiveAiAnswer] = useState<{
    query: string;
    summary: string;
    details: string[];
    actionableTip: string;
  } | null>(null);

  // Dynamic Heatmap intensity blocks
  const heatMapBlocks = useMemo(() => {
    return Array(21)
      .fill(0)
      .map((_, i) => {
        if ([8, 9, 10, 15, 16].includes(i)) {
          return theme.accent;
        }
        if ([4, 5, 11, 12, 17].includes(i)) {
          return isDark ? "#5C4A60" : "#C8B6C8";
        }
        return isDark ? theme.surfaceSoft : "#F0EEF2";
      });
  }, [theme, isDark]);

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

  // Handle Ask AI
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
        summary = "Your biggest expense is Food & Dining, taking up 32% of total spend.";
        details = [
          "Total spent in Food & Dining: ₦185,000",
          "Second highest: Transport (₦92,000)",
          "Number of recorded transactions: 28 purchases",
        ];
        actionableTip = "Consider batching grocery orders or meal prepping to save an estimated ₦25,000.";
      } else if (lower.includes("why") || lower.includes("more") || lower.includes("increase")) {
        summary = "Your spending is up 12% compared to last month primarily due to Food & Dining and Shopping.";
        details = [
          "Food purchases increased by ₦16,200",
          "Shopping had 3 large one-off equipment items",
          "Utilities and recurring bills stayed steady",
        ];
        actionableTip = "Set a weekly dining cap and activate auto-alerts when approaching 80% limit.";
      } else if (lower.includes("save") || lower.includes("50,000") || lower.includes("50000") || lower.includes("budget")) {
        summary = "Here is your AI tailored plan to save ₦50,000 next month without compromising essentials:";
        details = [
          "Trim Food & Dining by 15% (Save ~₦22,000)",
          "Limit impulsive shopping orders (Save ~₦18,000)",
          "Audit recurring streaming & gym subscriptions (Save ~₦10,000)",
        ];
        actionableTip = "Enable Auto-Save on your balance right when your income hits.";
      } else {
        summary = "Based on your spending summary, your total outgoing is healthy and well-distributed across categories.";
        details = [
          "Daily average burn rate: ₦12,400/day",
          "Budget categories on track: 6 out of 7",
          "Savings rate: +18% higher than average",
        ];
        actionableTip = "Review your custom calendar view above to spot weekly expenditure spikes.";
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
          onPress={() => router.back()}
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
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
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
              {activeTab === "week" ? "Current Week" : "August 2026"}
            </Text>

            <View style={styles.heroContentMainRow}>
              <View style={styles.heroTextLeftLayout}>
                <Text style={[styles.heroMainTitleBlurb, { color: theme.textPrimary }]}>
                  Your spending habits improved this month 🎉
                </Text>
                <Text style={[styles.heroSubTextBody, { color: theme.textSecondary }]}>
                  You spent 12% less on shopping and saved ₦140,000 more compared to
                  last month.
                </Text>
              </View>
              <View style={styles.heroGraphRightLayout}>
                <Svg width="120" height="70" viewBox="0 0 120 70">
                  <Path
                    d="M 5,60 Q 30,55 45,35 T 90,25 T 112,12"
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <Circle cx="112" cy="12" r="4" fill={theme.accent} />
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
                  <Ionicons name="trending-up" size={12} color="#2ECC71" />
                </View>
                <Text style={[styles.heroInlineBadgeText, { color: theme.textPrimary }]}>
                  +12% Improvement
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
                  Financial Health: Good
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
                  Based on 124 txns
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
                Biggest improvement: Shopping expenses reduced
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
          Visualizing high vs low transaction volume periods.
        </Text>

        <View
          style={[
            styles.gridHeatMapMatrixWrapper,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
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
          <Text style={[styles.timelineLabelText, { color: theme.textSecondary }]}>Week 1</Text>
          <Text style={[styles.timelineLabelText, { color: theme.textSecondary }]}>Week 2</Text>
          <Text style={[styles.timelineLabelText, { color: theme.textSecondary }]}>Week 3</Text>
        </View>

        {/* --- ASK ABOUT YOUR SPENDING (AI SECTION) --- */}
        <View
          style={[
            styles.askAiCard,
            {
              backgroundColor: isDark ? "#201824" : "#F8F2F7",
              borderColor: isDark ? "#3A2938" : "#E8DCF0",
              marginTop: 20,
            },
          ]}
        >
          <View style={styles.askAiHeader}>
            <View
              style={[
                styles.askAiIconFrame,
                { backgroundColor: isDark ? "#342335" : "#FFFFFF" },
              ]}
            >
              <Ionicons name="chatbubbles-outline" size={19} color={theme.accent} />
            </View>
            <View style={styles.askAiTitleCol}>
              <Text style={[styles.askAiTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                Ask about your spending
              </Text>
              <Text style={[styles.askAiSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                Instant answers from your transactions
              </Text>
            </View>
          </View>

          {/* Suggested Prompt Chips */}
          <View style={styles.promptChipsContainer}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={[
                  styles.promptChip,
                  {
                    backgroundColor: isDark ? theme.surface : "#FFFFFF",
                    borderColor: isDark ? theme.border : "#E3D5EA",
                  },
                ]}
                onPress={() => handleAskAi(prompt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.promptChipText, { color: theme.textPrimary }]}>
                  {prompt}
                </Text>
                <Ionicons name="arrow-forward" size={11} color={theme.accent} style={{ flexShrink: 0 }} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Active AI Answer Box */}
          {activeAiAnswer && (
            <View
              style={[
                styles.aiAnswerCard,
                {
                  backgroundColor: isDark ? theme.surface : "#FFFFFF",
                  borderColor: isDark ? theme.border : "#E3D5EA",
                },
              ]}
            >
              {/* Question Echo */}
              <View style={styles.aiQueryEchoRow}>
                <Ionicons name="help-circle-outline" size={15} color={theme.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.aiQueryEchoText, { color: theme.textPrimary }]} numberOfLines={1}>
                  {activeAiAnswer.query}
                </Text>
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
                  {activeAiAnswer.summary}
                </Text>
              </View>

              {/* Breakdown Bullets */}
              <View style={styles.aiBulletsContainer}>
                {activeAiAnswer.details.map((detail, idx) => (
                  <View key={idx} style={styles.aiBulletRow}>
                    <Ionicons name="checkmark-circle" size={15} color={theme.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text style={[styles.aiBulletText, { color: theme.textPrimary }]}>
                      {detail}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Actionable Tip */}
              {activeAiAnswer.actionableTip ? (
                <View
                  style={[
                    styles.aiTipBox,
                    {
                      backgroundColor: isDark ? "#30261A" : "#FEF3C7",
                      borderColor: isDark ? "#4D381F" : "#FDE68A",
                    },
                  ]}
                >
                  <Ionicons name="bulb" size={15} color="#D97706" style={{ marginTop: 1, flexShrink: 0 }} />
                  <Text style={[styles.aiTipText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
                    {activeAiAnswer.actionableTip}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Query Input Bar */}
          <View
            style={[
              styles.askAiInputContainer,
              {
                backgroundColor: isDark ? theme.surface : "#FFFFFF",
                borderColor: isDark ? theme.border : "#E3D5EA",
              },
            ]}
          >
            <TextInput
              style={[styles.askAiInput, { color: theme.textPrimary }]}
              placeholder="e.g. Can I afford ₦40,000 this weekend?"
              placeholderTextColor={theme.textSecondary}
              value={aiQuestion}
              onChangeText={setAiQuestion}
              onSubmitEditing={() => handleAskAi(aiQuestion)}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.askAiSendBtn, { backgroundColor: theme.accent }]}
              onPress={() => handleAskAi(aiQuestion)}
              disabled={isAskingAi || !aiQuestion.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
    marginBottom: 12,
  },
  askAiIconFrame: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },
  askAiTitleCol: {
    flex: 1,
  },
  askAiTitle: {
    fontSize: 14,
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
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    gap: 4,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  askAiInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
  },
  askAiInput: {
    flex: 1,
    fontSize: 12,
    height: "100%",
  },
  askAiSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  aiAnswerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  aiQueryEchoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  aiQueryEchoText: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  aiSummaryBox: {
    borderRadius: 9,
    borderWidth: 1,
    padding: 9,
    marginBottom: 9,
  },
  aiSummaryText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  aiBulletsContainer: {
    gap: 5,
    marginBottom: 8,
  },
  aiBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  aiBulletText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  aiTipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderRadius: 9,
    borderWidth: 1,
    padding: 8,
  },
  aiTipText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    flex: 1,
  },
});
