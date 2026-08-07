import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    text: "You are just $96 away from this month's savings goal.",
    tint: "#EEE4F0",
    color: "#4B2C40",
  },
];

export default function App() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeInsight, setActiveInsight] = useState(0);
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarWrapper}>
              <Ionicons name="person" size={20} color="#333" />
            </View>
            <View>
              <Text style={styles.greetingText}>Good morning, Ebuka </Text>
              <Text style={styles.subGreetingText}>
                Where did your money go today?
              </Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="headset-outline" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

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
              {balanceVisible ? "$2,842.50" : "********"}
            </Text>
          </TouchableOpacity>
          <View style={styles.trend}>
            <Ionicons name="arrow-up" size={12} color="#76588A" />
            <Text style={styles.trendText}>8.5% from last month</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.action}>
            <View style={styles.actionIcon}>
              <Ionicons name="download-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
            <View style={styles.actionIcon}>
              <Ionicons name="arrow-up-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart insights</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsContainer}>
          <Transaction
            icon="cafe-outline"
            tint="#F7EEE7"
            color="#A9622C"
            name="Starbucks"
            category="Food & Dining"
            amount="-$5.20"
            time="Today"
          />
          <View style={styles.rowDivider} />
          <Transaction
            icon="car-sport-outline"
            tint="#EAF0F6"
            color="#59728F"
            name="Uber"
            category="Transport"
            amount="-$18.40"
            time="Yesterday"
          />
          <View style={styles.rowDivider} />
          <Transaction
            icon="arrow-down-outline"
            tint="#EAF2EB"
            color="#52725D"
            name="Monthly income"
            category="Income"
            amount="+$2,100.00"
            time="Apr 28"
            positive
          />
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
        <View>
          <Text style={styles.transName}>{name}</Text>
          <Text style={styles.transCategory}>{category}</Text>
        </View>
      </View>
      <View style={styles.transRight}>
        <Text style={[styles.transAmount, positive && styles.positiveAmount]}>
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
  },
  transLeft: { alignItems: "center", flexDirection: "row", flex: 1 },
  transIconCircle: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },
  transName: { color: "#302638", fontSize: 14, fontWeight: "600" },
  transCategory: { color: "#978C9B", fontSize: 11, marginTop: 3 },
  transRight: { alignItems: "flex-end" },
  transAmount: { color: "#382C3F", fontSize: 14, fontWeight: "700" },
  positiveAmount: { color: "#6D4F7D" },
  transTime: { color: "#A197A5", fontSize: 11, marginTop: 3 },
  rowDivider: { backgroundColor: "#F1ECF2", height: 1, marginLeft: 67 },
});
