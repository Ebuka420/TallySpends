import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function InsightsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"week" | "month" | "custom">(
    "month",
  );

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
        {
          id: (Date.now() + 1).toString(),
          text: "Let's track that! Setting up your optimized parameters.",
          isAi: true,
        },
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

        {/* --- MONTHLY SUMMARY HERO CARD --- */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSummaryMetaLabel}>Monthly Summary</Text>
          <Text style={styles.heroSummaryDateLabel}>May 2026</Text>

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
                style={[styles.badgeIconCircle, { backgroundColor: "#E8F8F5" }]}
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
                style={[styles.badgeIconCircle, { backgroundColor: "#F4F6F6" }]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={12}
                  color="#534B52"
                />
              </View>
              <Text style={styles.heroInlineBadgeText}>Based on 124 txns</Text>
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

        {/* --- KEY INSIGHTS FRAME --- */}
        <View style={styles.sectionHeaderFlexRow}>
          <Text style={styles.sectionHeadingText}>Key Insights</Text>
          <TouchableOpacity style={styles.sectionInlineActionButtonCard}>
            <Text style={styles.sectionLinkActionLabelText}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollGapContainer}
        >
          <View style={styles.horizontalInsightCard}>
            <View
              style={[
                styles.horizontalCardIconBox,
                { backgroundColor: "#E8F8F5" },
              ]}
            >
              <Ionicons name="bag-handle-outline" size={16} color="#2ECC71" />
            </View>
            <Text style={styles.horizontalCardTitle}>Reduced Spending</Text>
            <Text style={styles.horizontalCardBody}>
              Shopping dropped by 12% this month
            </Text>
            <Svg width="50" height="20" style={{ marginTop: "auto" }}>
              <Path
                d="M 0,18 L 15,12 L 30,15 L 48,2"
                fill="none"
                stroke="#2ECC71"
                strokeWidth={1.5}
              />
            </Svg>
          </View>

          <View style={styles.horizontalInsightCard}>
            <View
              style={[
                styles.horizontalCardIconBox,
                { backgroundColor: "#FDEDEC" },
              ]}
            >
              <Ionicons name="restaurant-outline" size={16} color="#E74C3C" />
            </View>
            <Text style={styles.horizontalCardTitle}>Budget Alert</Text>
            <Text style={styles.horizontalCardBody}>
              Food spending is reaching your monthly limit
            </Text>
            <View style={styles.horizontalCardProgressTrack}>
              <View
                style={[
                  styles.horizontalCardProgressFill,
                  { width: "85%", backgroundColor: "#E74C3C" },
                ]}
              />
            </View>
          </View>

          <View style={styles.horizontalInsightCard}>
            <View
              style={[
                styles.horizontalCardIconBox,
                { backgroundColor: "#FEF9E7" },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={16}
                color="#F39C12"
              />
            </View>
            <Text style={styles.horizontalCardTitle}>Upcoming Expense</Text>
            <Text style={styles.horizontalCardBody}>
              Subscription renewal in 3 days
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color="#A6ACAF"
              style={{ marginTop: "auto", alignSelf: "flex-end" }}
            />
          </View>
        </ScrollView>

        {/* --- SPENDING PATTERNS INFOGRAPHICS BLOCK --- */}
        <View style={styles.sectionHeaderFlexRow}>
          <Text style={styles.sectionHeadingText}>Spending Patterns</Text>
          <TouchableOpacity style={styles.sectionInlineActionButtonCard}>
            <Text style={styles.sectionLinkActionLabelText}>View details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.patternsCardBlock}>
          <View style={styles.patternsSplitColumnItem}>
            <Text style={styles.patternsWidgetLabelTitleText}>
              Top Categories
            </Text>
            {[
              { label: "Food & Dining", pct: "32%", color: "#4B2C40" },
              { label: "Transport", pct: "25%", color: "#5DADE2" },
              { label: "Shopping", pct: "18%", color: "#F5B041" },
              { label: "Bills & Utilities", pct: "12%", color: "#EC7063" },
              { label: "Entertainment", pct: "8%", color: "#A6ACAF" },
              { label: "Other", pct: "5%", color: "#D5D8DC" },
            ].map((item, idx) => (
              <View key={idx} style={styles.categoryRowItemLine}>
                <View
                  style={[
                    styles.patternColorIndicatorDot,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text
                  style={styles.patternCategoryLabelString}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                <Text style={styles.patternCategoryPercentValue}>
                  {item.pct}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[styles.patternsSplitColumnItem, { paddingHorizontal: 6 }]}
          >
            <Text style={styles.patternsWidgetLabelTitleText}>
              Purchase Time
            </Text>
            <Text style={styles.patternsWidgetSubTextMeta}>Most purchases</Text>
            <Text style={styles.patternsWidgetHighlightTextEmphasis}>
              12 PM - 2 PM
            </Text>

            <View style={styles.gridHeatMapMatrixWrapper}>
              {heatMapBlocks.map((bg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.gridHeatMapIndividualCell,
                    { backgroundColor: bg },
                  ]}
                />
              ))}
            </View>
            <View style={styles.gridHeatMapTimelineLabelsRow}>
              <Text style={styles.timelineLabelText}>6 AM</Text>
              <Text style={styles.timelineLabelText}>12 PM</Text>
              <Text style={styles.timelineLabelText}>6 PM</Text>
            </View>
          </View>

          <View style={styles.patternsSplitColumnItem}>
            <Text style={styles.patternsWidgetLabelTitleText}>
              Top People / Vendors
            </Text>

            <Text style={styles.patternsWidgetSubTextMeta}>
              Most paid contact
            </Text>
            <View style={styles.vendorFlexContainerRow}>
              <View style={styles.vendorAvatarCirclePlaceholder}>
                <Text style={styles.vendorAvatarInitials}>JO</Text>
              </View>
              <Text style={styles.vendorLabelStringName} numberOfLines={1}>
                John
              </Text>
            </View>

            <Text style={[styles.patternsWidgetSubTextMeta, { marginTop: 4 }]}>
              Most used vendor
            </Text>
            <View style={styles.vendorFlexContainerRow}>
              <View
                style={[
                  styles.vendorAvatarCirclePlaceholder,
                  { backgroundColor: "#FDF2E9" },
                ]}
              >
                <FontAwesome5 name="amazon" size={10} color="#E67E22" />
              </View>
              <Text style={styles.vendorLabelStringName} numberOfLines={1}>
                Amazon
              </Text>
            </View>

            <Text style={[styles.patternsWidgetSubTextMeta, { marginTop: 4 }]}>
              Top transport provider
            </Text>
            <View style={styles.vendorFlexContainerRow}>
              {/* FIXED: No pure black brand backgrounds allowed here */}
              <View
                style={[
                  styles.vendorAvatarCirclePlaceholder,
                  { backgroundColor: "#4B2C40" },
                ]}
              >
                <MaterialCommunityIcons name="car" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.vendorLabelStringName} numberOfLines={1}>
                Uber
              </Text>
            </View>
          </View>
        </View>

        {/* --- SMART COACH AI SECTION --- */}
        <View style={styles.sectionHeaderFlexRow}>
          <Text style={styles.sectionHeadingText}>Smart Coach</Text>
          <TouchableOpacity style={styles.sectionInlineActionButtonCard}>
            <Text style={styles.sectionLinkActionLabelText}>View all</Text>
          </TouchableOpacity>
        </View>

        {[
          {
            icon: "cart-outline",
            title: "Better purchase option",
            desc: "You spent $85 at Vendor A this week. Similar purchases at Vendor B could have cost $68.",
            metricLabel: "Potential savings",
            metricValue: "$17",
            btnText: "Compare",
          },
          {
            icon: "car-outline",
            title: "Transport recommendation",
            desc: "Your average ride cost with Uber is $18.40. Similar trips using Bolt averaged $13.20.",
            metricLabel: "Est. monthly savings",
            metricValue: "$42",
            btnText: "See Details",
          },
          {
            icon: "lightbulb-outline",
            title: "Habit recommendation",
            desc: "Most of your food purchases happen during lunch hours. Setting a weekday food budget may reduce spending by approx. 8%.",
            metricLabel: "",
            metricValue: "",
            btnText: "Set Budget",
          },
        ].map((item, idx) => (
          <View key={idx} style={styles.coachRecommendationCardItem}>
            <View style={styles.coachCardTopMainRow}>
              <View style={styles.coachIconSquareContainer}>
                <Ionicons name={item.icon as any} size={18} color="#4B2C40" />
              </View>
              <View style={styles.coachContentBodyTextLayout}>
                <Text style={styles.coachRecommendationHeadingTitle}>
                  {item.title}
                </Text>
                <Text style={styles.coachRecommendationDescriptionText}>
                  {item.desc}
                </Text>
              </View>
            </View>

            <View style={styles.coachCardBottomMetaActionRow}>
              {item.metricValue !== "" ? (
                <View>
                  <Text style={styles.coachCardMetricSubtitleLabel}>
                    {item.metricLabel}
                  </Text>
                  <Text style={styles.coachCardMetricHighlightValue}>
                    {item.metricValue}
                  </Text>
                </View>
              ) : (
                <View />
              )}

              <TouchableOpacity
                style={styles.coachActionTriggerInlineButton}
                activeOpacity={0.7}
              >
                <Text style={styles.coachActionTriggerInlineButtonLabelText}>
                  {item.btnText}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={11}
                  color="#534B52"
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* --- FLOATING DRAGGABLE AI COACH TRIGGER / EXPANDED CHAT CONTAINER --- */}
      {isChatOpen ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatOverlayFullscreenWrapper}
        >
          <View style={styles.chatBoxContainerCard}>
            <View style={styles.chatHeaderBar}>
              <View style={styles.chatHeaderLeftInfo}>
                <View style={styles.chatHeaderAvatarActiveCircle}>
                  <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.chatHeaderTitleText}>Smart Coach AI</Text>
                  <Text style={styles.chatHeaderSubStatus}>Online Advisor</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsChatOpen(false)}
                style={styles.chatCloseTargetButton}
              >
                <Ionicons name="close" size={20} color="#4B2C40" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.chatScrollContentLayout}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgBubbleRow,
                    msg.isAi ? styles.msgRowAiAlign : styles.msgRowUserAlign,
                  ]}
                >
                  <View
                    style={[
                      styles.chatTextSpeechBubble,
                      msg.isAi ? styles.bubbleAiStyle : styles.bubbleUserStyle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chatBubbleTextParagraph,
                        msg.isAi ? styles.textAiColor : styles.textUserColor,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatInputRowFooter}>
              <TextInput
                style={styles.chatTextInputField}
                placeholder="Ask Smart Coach..."
                placeholderTextColor="#A6ACAF"
                value={chatMessage}
                onChangeText={setChatMessage}
              />
              <TouchableOpacity
                style={styles.chatSendActionButtonSquare}
                onPress={handleSendMessage}
              >
                <Ionicons name="send" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <Animated.View
          {...panResponder.panHandlers}
          style={[pan.getLayout(), styles.floatingDraggableActionCircleTrigger]}
        >
          <Ionicons name="sparkles" size={22} color="#FFFFFF" />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: { paddingBottom: 40, paddingHorizontal: 16 },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#4B2C40" },
  headerRightPlaceholder: { width: 40 },
  segmentedControlFrame: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentTabActive: { backgroundColor: "#4B2C40" },
  segmentTabText: { fontSize: 12, fontWeight: "600", color: "#534B52" },
  segmentTabTextActive: { color: "#FFFFFF" },
  customTabFlexRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 16,
    marginTop: 16,
  },
  heroSummaryMetaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A6ACAF",
    textTransform: "uppercase",
  },
  heroSummaryDateLabel: {
    fontSize: 12,
    color: "#534B52",
    marginTop: 2,
    marginBottom: 12,
  },
  heroContentMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTextLeftLayout: { flex: 1, paddingRight: 8 },
  heroMainTitleBlurb: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4B2C40",
    lineHeight: 22,
  },
  heroSubTextBody: {
    fontSize: 12,
    color: "#534B52",
    marginTop: 6,
    lineHeight: 18,
  },
  heroGraphRightLayout: {
    width: 120,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  heroBadgesRowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    borderBottomWidth: 1,
    borderColor: "#F2F4F4",
    paddingBottom: 12,
  },
  heroInlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  badgeIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  heroInlineBadgeText: { fontSize: 10, fontWeight: "600", color: "#534B52" },
  heroCardBottomBannerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
  },
  heroCardBottomBannerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B2C40",
    flex: 1,
  },
  sectionHeaderFlexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeadingText: { fontSize: 15, fontWeight: "700", color: "#4B2C40" },

  // Clean Button Targets for Header Layout View Links
  sectionInlineActionButtonCard: {
    backgroundColor: "#F0F0F2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  sectionLinkActionLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#534B52",
  },

  horizontalScrollGapContainer: { paddingRight: 16 },
  horizontalInsightCard: {
    width: 140,
    height: 145,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 12,
    marginRight: 10,
  },
  horizontalCardIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  horizontalCardTitle: { fontSize: 12, fontWeight: "700", color: "#4B2C40" },
  horizontalCardBody: {
    fontSize: 10,
    color: "#534B52",
    marginTop: 4,
    lineHeight: 14,
  },
  horizontalCardProgressTrack: {
    height: 4,
    backgroundColor: "#EAEAEA",
    borderRadius: 2,
    marginTop: "auto",
  },
  horizontalCardProgressFill: { height: "100%", borderRadius: 2 },
  patternsCardBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  patternsSplitColumnItem: { flex: 1, minHeight: 150 },
  patternsWidgetLabelTitleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A6ACAF",
    marginBottom: 8,
  },
  categoryRowItemLine: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3.5,
  },
  patternColorIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  patternCategoryLabelString: {
    fontSize: 9,
    fontWeight: "500",
    color: "#534B52",
    flex: 1,
  },
  patternCategoryPercentValue: {
    fontSize: 9,
    fontWeight: "600",
    color: "#4B2C40",
  },
  patternsWidgetSubTextMeta: { fontSize: 9, color: "#A6ACAF" },
  patternsWidgetHighlightTextEmphasis: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B2C40",
    marginVertical: 2,
  },
  gridHeatMapMatrixWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 75,
    marginTop: 6,
  },
  gridHeatMapIndividualCell: {
    width: 9,
    height: 9,
    borderRadius: 1.5,
    margin: 1.5,
  },
  gridHeatMapTimelineLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 75,
    marginTop: 4,
  },
  timelineLabelText: { fontSize: 7, color: "#A6ACAF", fontWeight: "600" },
  vendorFlexContainerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  vendorAvatarCirclePlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EAEAEA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  vendorAvatarInitials: { fontSize: 8, fontWeight: "700", color: "#534B52" },
  vendorLabelStringName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4B2C40",
    flex: 1,
  },
  coachRecommendationCardItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 14,
    marginBottom: 12,
  },
  coachCardTopMainRow: { flexDirection: "row" },
  coachIconSquareContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F0F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  coachContentBodyTextLayout: { flex: 1 },
  coachRecommendationHeadingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B2C40",
  },
  coachRecommendationDescriptionText: {
    fontSize: 11,
    color: "#534B52",
    marginTop: 4,
    lineHeight: 16,
  },
  coachCardBottomMetaActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#F8F9FA",
  },
  coachCardMetricSubtitleLabel: { fontSize: 9, color: "#A6ACAF" },
  coachCardMetricHighlightValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2ECC71",
    marginTop: 1,
  },
  coachActionTriggerInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  coachActionTriggerInlineButtonLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#534B52",
  },

  // Dark Shadow Grey FAB Trigger
  floatingDraggableActionCircleTrigger: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#4B2C40",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4B2C40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },

  // Dark Overlay updated from black to Shadow Grey with opacity
  chatOverlayFullscreenWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(45, 35, 46, 0.25)",
    justifyContent: "flex-end",
    padding: 16,
    zIndex: 1000,
  },
  chatBoxContainerCard: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.5,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#4B2C40",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  chatHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F2F4F4",
    backgroundColor: "#FFFFFF",
  },
  chatHeaderLeftInfo: { flexDirection: "row", alignItems: "center" },
  chatHeaderAvatarActiveCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4B2C40",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  chatHeaderTitleText: { fontSize: 13, fontWeight: "700", color: "#4B2C40" },
  chatHeaderSubStatus: {
    fontSize: 10,
    color: "#2ECC71",
    fontWeight: "600",
    marginTop: 1,
  },
  chatCloseTargetButton: { padding: 4 },
  chatScrollContentLayout: { padding: 16 },
  msgBubbleRow: { flexDirection: "row", marginVertical: 6, width: "100%" },
  msgRowAiAlign: { justifyContent: "flex-start" },
  msgRowUserAlign: { justifyContent: "flex-end" },
  chatTextSpeechBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: "80%",
  },
  bubbleAiStyle: { backgroundColor: "#F0F0F2", borderTopLeftRadius: 4 },
  bubbleUserStyle: { backgroundColor: "#4B2C40", borderTopRightRadius: 4 },
  chatBubbleTextParagraph: { fontSize: 12, lineHeight: 18 },
  textAiColor: { color: "#4B2C40" },
  textUserColor: { color: "#FFFFFF" },
  chatInputRowFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#F2F4F4",
    backgroundColor: "#FFFFFF",
  },
  chatTextInputField: {
    flex: 1,
    height: 38,
    backgroundColor: "#F8F9FA",
    borderRadius: 19,
    paddingHorizontal: 16,
    fontSize: 12,
    color: "#4B2C40",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  chatSendActionButtonSquare: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4B2C40",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
