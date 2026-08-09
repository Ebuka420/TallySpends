import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState, useRef } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function InsightsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"week" | "month" | "custom">(
    "month",
  );

  // --- CALENDAR DATE PICKER STATES ---
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    new Date(2026, 4, 1),
  ); // Default focused month: May 2026
  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 4, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 4, 15));

  // --- CHAT STATE AND LOGIC ---
  const [messages, setMessages] = useState([
    {
      id: "msg-1",
      sender: "bot",
      text: "Hi! I am Tally, your AI financial coach. Ask me any questions about your spending habits, saving goals, or budgets!",
      time: "Just now"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Expanded tips state
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);

  const tipsLibrary = [
    {
      id: "tip-1",
      title: "Optimize Grocery Spending",
      short: "Cut down on food delivery by meal prepping.",
      full: "Food & Dining represents 26% of your budget (₦602.10). By meal prepping just 3 days a week, you can save an estimated ₦80-₦100 per month. Try to use grocery lists and avoid shopping while hungry!",
      icon: "restaurant-outline"
    },
    {
      id: "tip-2",
      title: "Review Subscriptions",
      short: "Audit monthly direct debits.",
      full: "Bills & Utilities stand at ₦322.00. Check for forgotten streaming services, gym memberships, or software subscriptions. Canceling just one unused ₦15 subscription saves you ₦180 a year.",
      icon: "card-outline"
    },
    {
      id: "tip-3",
      title: "Smart Savings Allocation",
      short: "Set up auto-save rules.",
      full: "You've saved ₦1,104.00 this month. Set up a recurring ₦50 transfer to your savings goals right after your salary drops to pay yourself first and secure your laptop savings goal faster.",
      icon: "trending-up-outline"
    }
  ];

  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: trimmed,
      time: "Now"
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    setTimeout(() => {
      let replyText = "";
      const lower = trimmed.toLowerCase();

      if (lower.includes("food") || lower.includes("grocery") || lower.includes("eat")) {
        replyText = "Food & Dining is currently your largest category at 26% of total spending (₦602.10). Limiting dining out to once a week could save you around ₦85 this month. Would you like me to suggest a food budget limit?";
      } else if (lower.includes("category") || lower.includes("spending") || lower.includes("most")) {
        replyText = "Your top spending categories are:\n• Food & Dining: 26% (₦602.10)\n• Transport: 20% (₦430.00)\n• Shopping: 18% (₦387.50)\n\nReducing Shopping by just 10% next month would put ₦38.75 back in your pocket!";
      } else if (lower.includes("bill") || lower.includes("utility") || lower.includes("sub")) {
        replyText = "Your Bills & Utilities are at ₦322.00 this month. I recommend checking for active subscriptions or memberships you haven't used in the past 30 days to easily cut back.";
      } else if (lower.includes("save") || lower.includes("laptop") || lower.includes("goal")) {
        replyText = "You're doing well with ₦1,104.00 saved. Your Laptop goal is at 42% (₦1,250 of ₦3,000). If you add just ₦20 more weekly from your dining savings, you will hit the goal 2.5 weeks ahead of schedule!";
      } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
        replyText = "Hello! I'm here to help you make smart financial choices. Ask me about your 'top categories', 'how to save on food', or 'laptop goal'!";
      } else {
        replyText = "That's a good question! Based on your current balance (₦2,842.50) and recent metrics, I suggest keeping transport and shopping expenses under ₦400 this month to maintain your savings rate. Let me know if you want tips on a specific category!";
      }

      const botMsg = {
        id: `msg-${Date.now()}-bot`,
        sender: "bot",
        text: replyText,
        time: "Now"
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }, 900);
  };

  const heatMapBlocks = Array(21)
    .fill(0)
    .map((_, i) => {
      if ([8, 9, 10, 15, 16].includes(i)) return "#4B2C40";
      if ([4, 5, 11, 12, 17].includes(i)) return "#A6ACAF";
      return "#F0F0F2";
    });

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
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#4B2C40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
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
          <View style={styles.heroCard}>
            <Text style={styles.heroSummaryMetaLabel}>
              {activeTab === "week" ? "Weekly Summary" : "Monthly Summary"}
            </Text>
            <Text style={styles.heroSummaryDateLabel}>
              {activeTab === "week" ? "Current Week" : "May 2026"}
            </Text>

            <View style={styles.heroContentMainRow}>
              <View style={styles.heroTextLeftLayout}>
                <Text style={styles.heroMainTitleBlurb}>
                  Your spending habits improved this month 🎉
                </Text>
                <Text style={styles.heroSubTextBody}>
                  You spent 12% less on shopping and saved $140 more compared to
                  last month.
                </Text>
              </View>
              <View style={styles.heroGraphRightLayout}>
                <Svg width="120" height="70" viewBox="0 0 120 70">
                  <Path
                    d="M 5,60 Q 30,55 45,35 T 90,25 T 112,12"
                    fill="none"
                    stroke="#4B2C40"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <Circle cx="112" cy="12" r="4" fill="#4B2C40" />
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
                  <Ionicons name="trending-up" size={12} color="#2ECC71" />
                </View>
                <Text style={styles.heroInlineBadgeText}>+12% Improvement</Text>
              </View>
              <View style={styles.heroInlineBadge}>
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
                <Text style={styles.heroInlineBadgeText}>
                  Financial Health: Good
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
                  Based on 124 txns
                </Text>
              </View>
            </View>

            <View style={styles.heroCardBottomBannerActionRow}>
              <Ionicons
                name="star"
                size={14}
                color="#4B2C40"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.heroCardBottomBannerText} numberOfLines={1}>
                Biggest improvement: Shopping expenses reduced
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
          <View style={styles.calendarCard}>
            <View style={styles.calendarNavbar}>
              <TouchableOpacity onPress={() => changeMonth("prev")}>
                <Ionicons name="chevron-back" size={20} color="#4B2C40" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {monthYearHeaderLabel}
              </Text>
              <TouchableOpacity onPress={() => changeMonth("next")}>
                <Ionicons name="chevron-forward" size={20} color="#4B2C40" />
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
            Shopping & Apparel
          </Text>
          <Text style={styles.patternCategoryPercentValue}>28%</Text>
        </View>

        {/* --- HEATMAP PATTERNS WIDGET --- */}
        <Text style={styles.patternsWidgetHighlightTextEmphasis}>
          Spending Intensity Map
        </Text>
        <Text style={styles.patternsWidgetSubTextMeta}>
          Visualizing high vs low transaction volume periods.
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
          <Text style={styles.timelineLabelText}>Week 1</Text>
          <Text style={styles.timelineLabelText}>Week 2</Text>
          <Text style={styles.timelineLabelText}>Week 3</Text>
        </View>

        {/* --- TOP VENDORS TRACKING SECTION --- */}
        <View style={styles.vendorFlexContainerRow}>
          <View style={styles.vendorAvatarCirclePlaceholder}>
            <Text style={styles.vendorAvatarInitials}>AMZ</Text>
          </View>
          <Text style={styles.vendorLabelStringName}>Amazon Marketplace</Text>
          <Text style={styles.patternColorIndicatorDot}>$420.00</Text>
        </View>

        {/* --- DYNAMIC TIPS & RECOMMENDATIONS --- */}
        <Text style={[styles.patternsWidgetHighlightTextEmphasis, { marginTop: 24 }]}>
          Premium Financial Tips
        </Text>
        <Text style={styles.patternsWidgetSubTextMeta}>
          Tap any tip card to reveal actionable, step-by-step guidance.
        </Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          {tipsLibrary.map((tip) => {
            const isExpanded = expandedTipId === tip.id;
            return (
              <TouchableOpacity
                key={tip.id}
                style={[styles.coachRecommendationCardItem, isExpanded && styles.coachCardExpanded]}
                onPress={() => setExpandedTipId(isExpanded ? null : tip.id)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name={tip.icon as any} size={18} color="#4B2C40" />
                    <Text style={[styles.patternsWidgetHighlightTextEmphasis, { marginTop: 0 }]}>
                      {tip.title}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#4B2C40"
                  />
                </View>
                <Text style={[styles.patternsWidgetSubTextMeta, { marginTop: 4, marginBottom: 0 }]}>
                  {tip.short}
                </Text>
                {isExpanded && (
                  <Text style={styles.expandedTipBodyText}>
                    {tip.full}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- ASK TALLY AI Q&A CHAT SECTION --- */}
        <View style={styles.chatSectionContainer}>
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderTitleRow}>
              <MaterialCommunityIcons name="robot-outline" size={20} color="#FFFFFF" />
              <Text style={styles.chatHeaderTitle}>Ask Tally AI Coach</Text>
            </View>
            <Text style={styles.chatHeaderSubtitle}>Get instant personal budget answers</Text>
          </View>

          {/* Messages window */}
          <View style={styles.chatWindow}>
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    isBot ? styles.messageBubbleBot : styles.messageBubbleUser,
                  ]}
                >
                  <Text style={[styles.messageText, isBot ? styles.messageTextBot : styles.messageTextUser]}>
                    {msg.text}
                  </Text>
                </View>
              );
            })}
            {isTyping && (
              <View style={[styles.messageBubble, styles.messageBubbleBot, { flexDirection: "row", gap: 6, alignItems: "center" }]}>
                <ActivityIndicator size="small" color="#4B2C40" />
                <Text style={[styles.messageText, styles.messageTextBot, { fontStyle: "italic" }]}>
                  Tally is typing...
                </Text>
              </View>
            )}
          </View>

          {/* Quick Choice Question Chips */}
          <Text style={styles.chipsLabel}>Suggested Questions:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContainer}
          >
            <TouchableOpacity
              style={styles.chipButton}
              onPress={() => handleSendMessage("How can I save on food?")}
              activeOpacity={0.7}
              disabled={isTyping}
            >
              <Text style={styles.chipText}>🍔 Food savings tips?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipButton}
              onPress={() => handleSendMessage("Analyze my top category")}
              activeOpacity={0.7}
              disabled={isTyping}
            >
              <Text style={styles.chipText}>📊 Top category info?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipButton}
              onPress={() => handleSendMessage("How to cut bills?")}
              activeOpacity={0.7}
              disabled={isTyping}
            >
              <Text style={styles.chipText}>📉 Cutting bill costs?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipButton}
              onPress={() => handleSendMessage("Laptop goal savings rate")}
              activeOpacity={0.7}
              disabled={isTyping}
            >
              <Text style={styles.chipText}>💻 Laptop saving tips?</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Input field */}
          <View style={styles.chatInputWrapper}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Ask Tally a question..."
              placeholderTextColor="#9CA3AF"
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={() => handleSendMessage(chatInput)}
            />
            <TouchableOpacity
              style={[styles.chatSendButton, !chatInput.trim() && styles.chatSendButtonDisabled]}
              onPress={() => handleSendMessage(chatInput)}
              activeOpacity={0.7}
              disabled={!chatInput.trim() || isTyping}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
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
    backgroundColor: "rgba(75, 44, 64, 0.05)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(75, 44, 64, 0.1)",
    marginTop: 10,
  },
  coachCardTopMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: -4,
  },
  coachCardExpanded: {
    borderColor: "#4B2C40",
    backgroundColor: "rgba(75, 44, 64, 0.08)",
  },
  expandedTipBodyText: {
    fontSize: 12,
    color: "#534B52",
    lineHeight: 18,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "rgba(75, 44, 64, 0.1)",
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
