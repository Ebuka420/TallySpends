import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function InsightsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"week" | "month" | "custom">(
    "month",
  );

  // --- CALENDAR DATE PICKER STATES ---
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    new Date(2026, 4, 1),
  ); // Default focused month: May 2026
  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 4, 1)); // May 1, 2026
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 4, 15)); // May 15, 2026

  // AI Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hey! I noticed you saved 12% on shopping this month. Want some tips to optimize your food budget next?",
      isAi: true,
    },
  ]);

  // Draggable Animated State
  const pan = useRef(
    new Animated.ValueXY({ x: SCREEN_WIDTH - 80, y: SCREEN_HEIGHT - 160 }),
  ).current;
  const isDragging = useRef(false);

  // Pan Responder Config
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          if (!isDragging.current) {
            setIsChatOpen(true);
          }
        }

        let newX = (pan.x as any)._value;
        let newY = (pan.y as any)._value;

        if (newX < 10) newX = 10;
        if (newX > SCREEN_WIDTH - 70) newX = SCREEN_WIDTH - 70;
        if (newY < 60) newY = 60;
        if (newY > SCREEN_HEIGHT - 120) newY = SCREEN_HEIGHT - 120;

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          friction: 6,
        }).start();
      },
    }),
  ).current;

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      text: chatMessage,
      isAi: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatMessage("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        ...[
          {
            id: (Date.now() + 1).toString(),
            text: "Let's track that! Setting up your optimized parameters.",
            isAi: true,
          },
        ],
      ]);
    }, 1000);
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

  const formatDateLabel = (date: Date | null) => {
    if (!date) return "--";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

        {/* --- COACH RECOMMENDATIONS --- */}
        <View style={styles.coachRecommendationCardItem}>
          <View style={styles.coachCardTopMainRow}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={18}
              color="#4B2C40"
            />
            <Text style={styles.patternsWidgetHighlightTextEmphasis}>
              Smart Budget Tip
            </Text>
          </View>
          <Text style={styles.patternsWidgetSubTextMeta}>
            Consider setting up a category limit parameter to maintain your
            current optimization trajectory.
          </Text>
        </View>
      </ScrollView>

      {/* --- FLOATING DRAGGABLE CHAT BOT SPHERE --- */}
      <Animated.View
        style={[
          styles.chatIconBubbleDraggable,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.chatBubbleInnerCircleButton}
          onPress={() => setIsChatOpen(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="robot" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* --- FULL CHAT WINDOW MODAL SHEET --- */}
      <Modal
        visible={isChatOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsChatOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsChatOpen(false)}>
          <View style={styles.chatModalOverlayBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.chatCardContentContainerSheet}
            >
              <TouchableWithoutFeedback>
                <View style={{ flex: 1 }}>
                  <View style={styles.chatModalHeaderBar}>
                    <View style={styles.chatHeaderLeftGroup}>
                      <MaterialCommunityIcons
                        name="robot"
                        size={22}
                        color="#4B2C40"
                      />
                      <Text style={styles.chatHeaderTitleString}>
                        Tally Assistant
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                      <Ionicons name="close-circle" size={24} color="#A6ACAF" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.chatMessageScrollPane}>
                    {messages.map((msg) => (
                      <View
                        key={msg.id}
                        style={[
                          styles.msgWrapperBubbleLine,
                          msg.isAi
                            ? styles.msgAiAlignment
                            : styles.msgUserAlignment,
                        ]}
                      >
                        <Text
                          style={[
                            styles.msgTextBodyString,
                            msg.isAi
                              ? styles.msgTextAiColor
                              : styles.msgTextUserColor,
                          ]}
                        >
                          {msg.text}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.chatInputComposerDockFooter}>
                    <TextInput
                      style={styles.chatTextInputFieldElement}
                      placeholder="Ask about your parameters..."
                      value={chatMessage}
                      onChangeText={setChatMessage}
                      placeholderTextColor="#A6ACAF"
                    />
                    <TouchableOpacity
                      style={styles.chatSubmitSendActionButton}
                      onPress={handleSendMessage}
                    >
                      <Ionicons name="send" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// --- ALL COMBINED STYLESHEETS WITH NO MISSING ATTRIBUTES ---
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
  chatIconBubbleDraggable: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4B2C40",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 999,
  },
  chatBubbleInnerCircleButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  chatModalOverlayBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  chatCardContentContainerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.7,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
  },
  chatModalHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#F0F0F2",
  },
  chatHeaderLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatHeaderTitleString: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B2C40",
  },
  chatMessageScrollPane: {
    flex: 1,
    padding: 16,
  },
  msgWrapperBubbleLine: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  msgAiAlignment: {
    backgroundColor: "#F0F0F2",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  msgUserAlignment: {
    backgroundColor: "#4B2C40",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  msgTextBodyString: {
    fontSize: 14,
    lineHeight: 18,
  },
  msgTextAiColor: {
    color: "#111111",
  },
  msgTextUserColor: {
    color: "#FFFFFF",
  },
  chatInputComposerDockFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  chatTextInputFieldElement: {
    flex: 1,
    height: 44,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F0F0F2",
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#111111",
  },
  chatSubmitSendActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4B2C40",
    justifyContent: "center",
    alignItems: "center",
  },
});
