import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MOCK_RECIPIENTS, useAppStore } from "../../src/store";

const normalizeTransferTitle = (title: string) => {
  const transferRegex = /(Transfer to\s+)@([a-zA-Z0-9_]+)/i;
  return title.replace(transferRegex, (_, prefix, username) => {
    const recipient = MOCK_RECIPIENTS.find(
      (r) => r.username.toLowerCase() === username.toLowerCase(),
    );
    return recipient
      ? `${prefix}${recipient.name}`
      : `Transfer to @${username}`;
  });
};

const insights = [
  {
    icon: "restaurant-outline" as const,
    title: "Food spending is up",
    text: "You've spent more on food in the past week than you did last month.",
    tint: "#F3EBF1",
    color: "#4B2C40",
  },
  {
    icon: "leaf-outline" as const,
    title: "A calmer week",
    text: "Your overall spending is 18% lower than your weekly average.",
    tint: "#F8F2F7",
    color: "#6C4C7A",
  },
  {
    icon: "sparkles-outline" as const,
    title: "A small win",
    text: "You are just ₦96 away from this month's savings goal.",
    tint: "#EEE4F0",
    color: "#4B2C40",
  },
];

const ajoGroupCards = [
  {
    id: "ajo-1",
    groupName: "Mama Ajo Circle",
    memberName: "Ada",
    contribution: "₦25,000",
    image: "https://i.pravatar.cc/100?img=12",
  },
  {
    id: "ajo-2",
    groupName: "Family Lift",
    memberName: "Tosin",
    contribution: "₦18,000",
    image: "https://i.pravatar.cc/100?img=32",
  },
  {
    id: "ajo-3",
    groupName: "Weekend Savers",
    memberName: "Mina",
    contribution: "₦10,000",
    image: "https://i.pravatar.cc/100?img=47",
  },
];

const jointSavingsCards = [
  {
    id: "joint-1",
    personName: "Titi",
    goal: "New laptop",
    contribution: "₦15,000",
    timeline: "4 months",
    image: "https://i.pravatar.cc/100?img=15",
  },
  {
    id: "joint-2",
    personName: "Bolu",
    goal: "Holiday trip",
    contribution: "₦22,000",
    timeline: "6 months",
    image: "https://i.pravatar.cc/100?img=27",
  },
  {
    id: "joint-3",
    personName: "Chika",
    goal: "Home setup",
    contribution: "₦12,500",
    timeline: "3 months",
    image: "https://i.pravatar.cc/100?img=41",
  },
];

const categoryMeta: Record<string, { icon: any; color: string; soft: string }> =
  {
    "Food & Dining": {
      icon: "restaurant-outline",
      color: "#A9622C",
      soft: "#F7EEE7",
    },
    Transport: { icon: "car-outline", color: "#59728F", soft: "#EAF0F6" },
    Shopping: { icon: "bag-handle-outline", color: "#846590", soft: "#F2ECF5" },
    "Bills & Utilities": {
      icon: "document-text-outline",
      color: "#5B7A67",
      soft: "#EAF2EA",
    },
    Entertainment: { icon: "film-outline", color: "#8A7067", soft: "#F4EEEB" },
    Others: { icon: "ellipsis-horizontal", color: "#70706B", soft: "#EFEFEB" },
  };

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getTimeLabel = (value?: string) => {
  if (!value) return "Recently added";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently added";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function App() {
  const router = useRouter();
  const { transactions, themePreference } = useAppStore();
  const theme = getThemePalette(themePreference);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeInsight, setActiveInsight] = useState(0);
  const [ajoIndex, setAjoIndex] = useState(0);
  const [jointIndex, setJointIndex] = useState(0);
  const insightScrollRef = useRef<ScrollView | null>(null);
  const ajoScrollRef = useRef<ScrollView | null>(null);
  const jointScrollRef = useRef<ScrollView | null>(null);

  const transactionsRaw = (transactions || []) as any[];
  const totalIncome = transactionsRaw
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const totalExpenses = transactionsRaw
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const currentBalance = 2926.78 + totalIncome - totalExpenses;

  const recentTransactions = useMemo(() => {
    return [...transactionsRaw]
      .sort((a, b) => {
        const aTime = new Date(a.date || 0).getTime();
        const bTime = new Date(b.date || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 3);
  }, [transactionsRaw]);

  useEffect(() => {
    const insightTimer = setInterval(() => {
      setActiveInsight((prev) => (prev + 1) % insights.length);
    }, 5000);

    const ajoTimer = setInterval(() => {
      setAjoIndex((prev) => (prev + 1) % ajoGroupCards.length);
    }, 6000);

    const jointTimer = setInterval(() => {
      setJointIndex((prev) => (prev + 1) % jointSavingsCards.length);
    }, 7000);

    return () => {
      clearInterval(insightTimer);
      clearInterval(ajoTimer);
      clearInterval(jointTimer);
    };
  }, []);

  useEffect(() => {
    if (!insightScrollRef.current) return;
    const cardWidth = 306 + 12;
    insightScrollRef.current.scrollTo({
      x: activeInsight * cardWidth,
      y: 0,
      animated: true,
    });
  }, [activeInsight]);

  useEffect(() => {
    if (!ajoScrollRef.current) return;
    const cardWidth = 260 + 12;
    ajoScrollRef.current.scrollTo({
      x: ajoIndex * cardWidth,
      y: 0,
      animated: true,
    });
  }, [ajoIndex]);

  useEffect(() => {
    if (!jointScrollRef.current) return;
    const cardWidth = 260 + 12;
    jointScrollRef.current.scrollTo({
      x: jointIndex * cardWidth,
      y: 0,
      animated: true,
    });
  }, [jointIndex]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}> 
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Container */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => router.push("/profile")}
            activeOpacity={0.7}
          >
            <View style={[styles.avatarWrapper, { backgroundColor: theme.accentSoft }]}> 
              <Ionicons name="person" size={20} color="#333" />
            </View>
            <View>
              <Text style={styles.greetingText}>Good morning, Ebuka </Text>
              <Text style={styles.subGreetingText}>
                Where did your money go today?
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/request")}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code-outline" size={18} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/notifications")}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/customerservice")}
              activeOpacity={0.7}
            >
              <Ionicons name="headset-outline" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Section */}
        <View style={styles.balance}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              balanceVisible ? "Hide balance" : "Show balance"
            }
            onPress={() => setBalanceVisible((visible) => !visible)}
            activeOpacity={0.68}
            style={styles.balanceAmountButton}
          >
            <Text
              style={[
                styles.balanceAmount,
                !balanceVisible && styles.hiddenBalanceAmount,
              ]}
            >
              {balanceVisible
                ? `₦${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "********"}
            </Text>
          </TouchableOpacity>
          <View style={styles.trend}>
            <Ionicons name="arrow-up" size={12} color="#76588A" />
            <Text style={styles.trendText}>8.5% from last month</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push("/deposit")}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="download-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push("/withdraw")}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="arrow-up-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push("/transfer")}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="swap-horizontal-outline"
                size={21}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Smart Insights Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart insights</Text>
          <TouchableOpacity onPress={() => router.push("/insights")}>
            <Text style={styles.viewAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={insightScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.insightCarousel}
          onMomentumScrollEnd={({ nativeEvent }) => {
            const cardWidth = 306 + 12;
            const nextInsight = Math.round(
              nativeEvent.contentOffset.x / cardWidth,
            );
            setActiveInsight(
              Math.max(0, Math.min(nextInsight, insights.length - 1)),
            );
          }}
          scrollEventThrottle={16}
        >
          {insights.map((insight) => (
            <TouchableOpacity
              key={insight.title}
              activeOpacity={0.85}
              style={[styles.insightCard, { backgroundColor: insight.tint }]}
              onPress={() => router.push("/insights")}
            >
              <View
                style={[styles.insightIcon, { backgroundColor: "#FFFFFF" }]}
              >
                <Ionicons name={insight.icon} size={18} color={insight.color} />
              </View>
              <View style={styles.insightCopy}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={insight.color}
                style={styles.insightChevron}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            now: activeInsight + 1,
            min: 1,
            max: insights.length,
          }}
          style={styles.dots}
        >
          {insights.map((insight, index) => (
            <View
              key={insight.title}
              style={[styles.dot, index === activeInsight && styles.activeDot]}
            />
          ))}
        </View>

        <View style={styles.groupSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ajo group activity</Text>
            <TouchableOpacity
              onPress={() => router.push("/budget")}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>Open Ajo</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={ajoScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupCarousel}
            onMomentumScrollEnd={({ nativeEvent }) => {
              const cardWidth = 260 + 12;
              const nextIndex = Math.round(
                nativeEvent.contentOffset.x / cardWidth,
              );
              setAjoIndex(
                Math.max(0, Math.min(nextIndex, ajoGroupCards.length - 1)),
              );
            }}
            onScrollEndDrag={({ nativeEvent }) => {
              const cardWidth = 260 + 12;
              const nextIndex = Math.round(
                nativeEvent.contentOffset.x / cardWidth,
              );
              setAjoIndex(
                Math.max(0, Math.min(nextIndex, ajoGroupCards.length - 1)),
              );
            }}
            scrollEventThrottle={16}
          >
            {ajoGroupCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.groupCard}
                onPress={() => router.push("/budget")}
                activeOpacity={0.84}
              >
                <Image
                  source={{ uri: card.image }}
                  style={styles.groupAvatar}
                />
                <View style={styles.groupCardCopy}>
                  <Text style={styles.groupCardTitle}>{card.groupName}</Text>
                  <Text style={styles.groupCardSubtitle}>
                    {card.memberName} added {card.contribution}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              now: ajoIndex + 1,
              min: 1,
              max: ajoGroupCards.length,
            }}
            style={styles.dots}
          >
            {ajoGroupCards.map((card, index) => (
              <View
                key={card.id}
                style={[styles.dot, index === ajoIndex && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        <View style={styles.groupSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Joint savings</Text>
            <TouchableOpacity
              onPress={() => router.push("/budget")}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View goal</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={jointScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupCarousel}
            onMomentumScrollEnd={({ nativeEvent }) => {
              const cardWidth = 260 + 12;
              const nextIndex = Math.round(
                nativeEvent.contentOffset.x / cardWidth,
              );
              setJointIndex(
                Math.max(0, Math.min(nextIndex, jointSavingsCards.length - 1)),
              );
            }}
            onScrollEndDrag={({ nativeEvent }) => {
              const cardWidth = 260 + 12;
              const nextIndex = Math.round(
                nativeEvent.contentOffset.x / cardWidth,
              );
              setJointIndex(
                Math.max(0, Math.min(nextIndex, jointSavingsCards.length - 1)),
              );
            }}
            scrollEventThrottle={16}
          >
            {jointSavingsCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.groupCard}
                onPress={() => router.push("/budget")}
                activeOpacity={0.84}
              >
                <Image
                  source={{ uri: card.image }}
                  style={styles.groupAvatar}
                />
                <View style={styles.groupCardCopy}>
                  <Text style={styles.groupCardTitle}>{card.personName}</Text>
                  <Text style={styles.groupCardSubtitle}>
                    {card.contribution} saved for {card.goal}
                  </Text>
                  <Text style={styles.groupCardMeta}>
                    Goal in {card.timeline}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              now: jointIndex + 1,
              min: 1,
              max: jointSavingsCards.length,
            }}
            style={styles.dots}
          >
            {jointSavingsCards.map((card, index) => (
              <View
                key={card.id}
                style={[styles.dot, index === jointIndex && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        {/* Recent Transactions Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <TouchableOpacity
            onPress={() => router.push("/transaction-history")}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsContainer}>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, index) => {
              const isIncome = tx.type === "income";
              const meta =
                categoryMeta[tx.category || "Others"] || categoryMeta.Others;

              return (
                <View key={tx.id || `${tx.title}-${index}`}>
                  <Transaction
                    icon={isIncome ? "arrow-down-outline" : meta.icon}
                    tint={meta.soft}
                    color={meta.color}
                    name={normalizeTransferTitle(tx.title || "Transaction")}
                    category={tx.category || "Others"}
                    amount={`${isIncome ? "+" : "-"}${formatCurrency(Number(tx.amount || 0))}`}
                    time={getTimeLabel(tx.date)}
                    positive={isIncome}
                  />
                  {index < recentTransactions.length - 1 && (
                    <View style={styles.rowDivider} />
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No transactions yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Transaction({
  icon,
  tint,
  color,
  name,
  category,
  amount,
  time,
  positive = false,
}: {
  icon: any;
  tint: string;
  color: string;
  name: string;
  category: string;
  amount: string;
  time: string;
  positive?: boolean;
}) {
  return (
    <TouchableOpacity activeOpacity={0.72} style={styles.transactionItem}>
      <View style={styles.transLeft}>
        <View style={[styles.transIconCircle, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.transTextWrap}>
          <Text
            style={styles.transName}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {name}
          </Text>
          <Text style={styles.transCategory}>{category}</Text>
        </View>
      </View>
      <View style={styles.transRight}>
        <Text
          style={[styles.transAmount, positive && styles.positiveAmount]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {amount}
        </Text>
        <Text style={styles.transTime}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 110,
  },
  headerContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileContainer: { alignItems: "center", flexDirection: "row" },
  avatarWrapper: {
    alignItems: "center",
    backgroundColor: "#F3EBF1",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginRight: 10,
    width: 40,
  },
  greetingText: { color: "#292624", fontSize: 14, fontWeight: "700" },
  subGreetingText: { color: "#847F7A", fontSize: 11, marginTop: 2 },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#E8DFEA",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  balance: { alignItems: "center", paddingBottom: 27, paddingTop: 48 },
  balanceLabel: {
    color: "#87788C",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  balanceAmountButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
    minWidth: 210,
  },
  balanceAmount: {
    color: "#20142A",
    fontSize: 45,
    fontWeight: "700",
    letterSpacing: -2.1,
  },
  hiddenBalanceAmount: { letterSpacing: 3, transform: [{ translateY: -1 }] },
  trend: { alignItems: "center", flexDirection: "row", gap: 5, marginTop: 9 },
  trendText: { color: "#7F7484", fontSize: 13 },
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 26,
  },
  action: { alignItems: "center", marginHorizontal: 16 },
  actionIcon: {
    alignItems: "center",
    backgroundColor: "#20142A",
    borderRadius: 31,
    elevation: 4,
    height: 58,
    justifyContent: "center",
    shadowColor: "#20142A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 58,
  },
  actionText: {
    color: "#33283A",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 23,
  },
  sectionTitle: {
    color: "#2C2033",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  viewAllText: { color: "#6C4C7A", fontSize: 12, fontWeight: "600" },
  insightCarousel: { gap: 12, paddingRight: 20 },
  insightCard: {
    borderRadius: 21,
    flexDirection: "row",
    minHeight: 122,
    padding: 16,
    width: 306,
  },
  insightIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },
  insightCopy: { flex: 1, paddingRight: 5 },
  insightTitle: {
    color: "#302B27",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  insightText: { color: "#706A65", fontSize: 12, lineHeight: 17, marginTop: 6 },
  insightChevron: { alignSelf: "center" },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 13,
  },
  dot: { backgroundColor: "#DDD2E1", borderRadius: 3, height: 5, width: 5 },
  activeDot: { backgroundColor: "#20142A", width: 16 },
  groupSection: {
    marginTop: 18,
  },
  groupCarousel: {
    gap: 12,
    paddingRight: 20,
  },
  groupCard: {
    alignItems: "flex-start",
    backgroundColor: "#FAF6FB",
    borderColor: "#E8DFEA",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 12,
    width: 260,
  },
  groupAvatar: {
    borderRadius: 24,
    height: 48,
    marginRight: 12,
    width: 48,
  },
  groupCardCopy: {
    flex: 1,
    justifyContent: "center",
  },
  groupCardTitle: {
    color: "#2C2033",
    fontSize: 14,
    fontWeight: "700",
  },
  groupCardSubtitle: {
    color: "#6C4C7A",
    fontSize: 12,
    marginTop: 4,
  },
  groupCardMeta: {
    color: "#8C8190",
    fontSize: 11,
    marginTop: 3,
  },
  categoriesRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryCard: {
    flexBasis: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 8,
  },
  catIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  catTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  catAmount: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  catPercentage: {
    fontSize: 10,
    color: "#7C7C7C",
    marginTop: 2,
  },
  transactionsContainer: {
    backgroundColor: "#FFF",
    borderColor: "#E9E1EB",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  transactionItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 74,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  transLeft: {
    alignItems: "flex-start",
    flexDirection: "row",
    flex: 1,
    minWidth: 0,
  },
  transIconCircle: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },
  transTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  transName: {
    color: "#302638",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  transCategory: {
    color: "#978C9B",
    fontSize: 11,
    marginTop: 3,
    flexWrap: "wrap",
  },
  transRight: {
    alignItems: "flex-end",
    flexShrink: 1,
    marginLeft: 8,
    maxWidth: 112,
    minWidth: 0,
  },
  transAmount: {
    color: "#382C3F",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    flexWrap: "wrap",
  },
  positiveAmount: { color: "#6D4F7D" },
  transTime: { color: "#A197A5", fontSize: 11, marginTop: 3 },
  rowDivider: { backgroundColor: "#F1ECF2", height: 1, marginLeft: 67 },
  emptyStateCard: {
    alignItems: "center",
    backgroundColor: "#F8F5F8",
    borderColor: "#EDE7EE",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
    width: "100%",
  },
  emptyStateText: {
    color: "#6E6470",
    fontSize: 13,
    textAlign: "center",
  },
});
