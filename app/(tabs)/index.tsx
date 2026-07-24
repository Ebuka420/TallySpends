import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useAppStore } from "../../src/store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DashboardScreen() {
  const router = useRouter();
  const { transactions: transactionsRaw, savingsGoals: savingsGoalsRaw } =
    useAppStore();
  const transactions = (transactionsRaw || []) as any[];
  const savingsGoals = (savingsGoalsRaw || []) as any[];

  // State hooks
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);
  const [isSortLatest, setIsSortLatest] = useState<boolean>(true);

  // Compute balance
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpense;

  // Compute spending data
  const categoriesMap: { [key: string]: { color: string; amount: number } } = {
    "Food & Dining": { color: "#2D232E", amount: 0 },
    Transport: { color: "#5DADE2", amount: 0 },
    Shopping: { color: "#F5B041", amount: 0 },
    "Bills & Utilities": { color: "#EC7063", amount: 0 },
    Entertainment: { color: "#A6ACAF", amount: 0 },
    Others: { color: "#D5D8DC", amount: 0 },
  };

  transactions.forEach((t) => {
    if (t.type === "expense") {
      if (categoriesMap[t.category]) {
        categoriesMap[t.category].amount += t.amount;
      } else {
        categoriesMap["Others"].amount += t.amount;
      }
    }
  });

  const spendingData = Object.keys(categoriesMap)
    .map((label) => {
      const amt = categoriesMap[label].amount;
      const pctVal = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
      return {
        label,
        color: categoriesMap[label].color,
        amount: `$${amt.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        percent: `${Math.round(pctVal)}%`,
        percentNum: pctVal,
        amountNum: amt,
      };
    })
    .filter((item) => item.amountNum > 0)
    .sort((a, b) => b.amountNum - a.amountNum);

  // SVG Donut Configurations (Radius: 40, Circumference: ~251.3)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  // Goals progress calculations
  const totalGoals = savingsGoals.length;
  const completedGoals = savingsGoals.filter((g) => g.saved >= g.target).length;
  const completionPercentage =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Recent transactions (latest 3)
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (isSortLatest) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
  });
  const recentTransactions = sortedTransactions.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HIDE EXPO ROUTER NATIVE HEADER BAR --- */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarPlaceholder}
            onPress={() => router.push("/profile" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color="#534B52" />
          </TouchableOpacity>
          <View style={styles.headerGreetingLayout}>
            <Text style={styles.userGreetingText} numberOfLines={1}>
              Boss How far
            </Text>
            <Text style={styles.subGreetingText} numberOfLines={1}>
              Where did your money go today?
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconNotificationButton}
            onPress={() => router.push("/notifications" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="#2D232E" />
            <View style={styles.notificationAlertDotIndicator} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconNotificationButton}
            onPress={() => router.push("/customerservice" as any)}
            activeOpacity={0.7}
          >
            <FontAwesome name="headphones" size={22} color="#2D232E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- TOTAL BALANCE CARD --- */}
        <View style={styles.card}>
          <View style={styles.balanceHeaderFlexRow}>
            <View style={styles.balanceTitleWithIconRow}>
              <Text style={styles.balanceSectionLabel}>Total Balance</Text>
              <TouchableOpacity
                style={styles.eyeVisibilityToggleButton}
                onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={isBalanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={16}
                  color="#534B52"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.miniTrendGraphIconBox}>
              <Ionicons name="trending-up-outline" size={14} color="#6442E5" />
            </View>
          </View>

          <View style={styles.balanceMainContentContainerRow}>
            <Text style={styles.massiveBalanceDisplayAmount}>
              {isBalanceVisible ? "$2,842.50" : "•••••"}
            </Text>
            <View style={styles.sparklineGraphContainer}>
              <Svg width="110" height="40" viewBox="0 0 110 40">
                <Path
                  d="M 5,30 L 32,23 L 53,13 L 73,18 L 88,14 L 102,10"
                  fill="none"
                  stroke="#6442E5"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="102" cy="10" r="3" fill="#6442E5" />
              </Svg>
            </View>
          </View>

          <View style={styles.balanceDeltaMetricRow}>
            <Ionicons
              name="triangle"
              size={10}
              color="#2ECC71"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.balanceDeltaPercentLabel}>8.5%</Text>
            <Text style={styles.balanceDeltaContextPeriodText}>
              from last month
            </Text>
          </View>
        </View>

        {/* --- INSIGHTS & GOALS ROW --- */}
        <View style={styles.splitCardsGridRow}>
          <View style={[styles.gridCardItem, { marginRight: 6 }]}>
            <View style={styles.gridCardHeaderFlex}>
              <Text style={styles.gridCardHeadingTitle}>Insights</Text>
              <TouchableOpacity
                style={{ padding: 4 }}
                onPress={() => router.push("/insights" as any)}
              >
                <Ionicons name="chevron-forward" size={14} color="#534B52" />
              </TouchableOpacity>
            </View>
            <Text style={styles.gridCardBodyBriefBlurb} numberOfLines={3}>
              You spent 12% less on shopping this month
            </Text>
            <Text style={styles.gridCardBottomGreenAccentLabel}>
              + 12% improvement
            </Text>
          </View>

          <View style={[styles.gridCardItem, { marginLeft: 6 }]}>
            <View style={styles.gridCardHeaderFlex}>
              <Text style={styles.gridCardHeadingTitle}>Goals Progress</Text>
              <TouchableOpacity
                style={{ padding: 4 }}
                onPress={() => router.replace("/budget" as any)}
              >
                <Ionicons name="chevron-forward" size={14} color="#534B52" />
              </TouchableOpacity>
            </View>
            <Text style={styles.massivePercentageGoalDisplayNumber}>60%</Text>
            <Text style={styles.goalCompletionFractionStatusLabel}>
              2 of 3 goals completed
            </Text>
            <View style={styles.progressBarTrackBackground}>
              <View
                style={[styles.progressBarFilledActiveFill, { width: "60%" }]}
              />
            </View>
          </View>
        </View>

        {/* --- SPENDING OVERVIEW --- */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.sectionHeaderRowLinkToggle}
            onPress={() => router.push("/analytics" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardBlockHeadingTitleText}>
              Spending Overview
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#534B52" />
          </TouchableOpacity>

          <View style={styles.spendingOverviewVisualLayoutContentRow}>
            {/* Native Clean SVG Donut Implementation */}
            <View style={styles.donutFrameContainer}>
              <Svg width="110" height="110" viewBox="0 0 100 100">
                {/* Fixed native rotation container via native SVG Group component */}
                <G rotation="-90" origin="50, 50">
                  {spendingData.map((item, index) => {
                    const percentageValue = parseFloat(item.percent) / 100;
                    const strokeOffset = circumference * (1 - percentageValue);
                    const strokeRotation = accumulatedPercent * 360;
                    accumulatedPercent += percentageValue;

                    return (
                      <Circle
                        key={index}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="11"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                        originX="50"
                        originY="50"
                        rotation={strokeRotation}
                      />
                    );
                  })}
                </G>
              </Svg>
              <View style={styles.donutInnerHoleMask}>
                <Text style={styles.donutCoreMetricValue}>$2,158</Text>
                <Text style={styles.donutCoreMetricSubLabel}>Total</Text>
              </View>
            </View>

            <View style={styles.legendVerticalListStack}>
              {spendingData.map((item, index) => (
                <View style={styles.legendRowItem} key={index}>
                  <View style={styles.legendLabelContainer}>
                    <View
                      style={[
                        styles.indicatorColorDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text
                      style={styles.legendCategoryLabelText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.legendPercentContainer}>
                    <Text
                      style={styles.legendCategoryPercentValueText}
                      numberOfLines={1}
                    >
                      {item.percent}
                    </Text>
                  </View>
                  <View style={styles.legendAmountContainer}>
                    <Text
                      style={styles.legendCategoryDollarAmountText}
                      numberOfLines={1}
                    >
                      {item.amount}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* --- RECENT TRANSACTIONS --- */}
        <View style={styles.card}>
          <View style={styles.transactionHeaderCenteredContainer}>
            <View style={styles.placeholderSideBox} />
            <Text style={styles.cardBlockHeadingTitleTextCentered}>
              Transaction History
            </Text>
            <TouchableOpacity
              style={styles.sortActionRowButton}
              onPress={() => router.push("/transaction-history" as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.sortActionButtonLabelText}>View all</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((tx, index) => {
            const isExpense = tx.type === "expense";
            const pillColor = isExpense ? "#FDEDEC" : "#EAF6EC";
            const pillText = isExpense ? "#E74C3C" : "#2ECC71";
            return (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.transactionRowItemContainer,
                  index === recentTransactions.length - 1 && {
                    borderBottomWidth: 0,
                    paddingBottom: 0,
                  },
                ]}
                onPress={() => router.push("/transaction-history" as any)}
              >
                <View style={styles.transactionLeftMetadataWrapper}>
                  <View
                    style={[
                      styles.brandMerchantLogoAvatarBox,
                      { backgroundColor: pillColor },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.merchantMainNameText}>{tx.title}</Text>
                    <Text style={styles.merchantCategorySubText}>
                      {tx.category}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRightFinancialWrapper}>
                  <Text
                    style={[
                      styles.transactionDebitNegativeAmountValue,
                      isExpense ? styles.expenseAmount : styles.incomeAmount,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {isExpense
                      ? `-$${tx.amount.toFixed(2)}`
                      : `+$${tx.amount.toFixed(2)}`}
                  </Text>
                  <Text
                    style={styles.transactionTimestampValueText}
                    numberOfLines={1}
                  >
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* --- FOOTER NAV BAR --- */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/(tabs)" as any)}
        >
          <Ionicons name="home" size={22} color="#2D232E" />
          <Text style={[styles.footerText, styles.activeFooterText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/expenses")}
        >
          <Ionicons name="document-text-outline" size={22} color="#534B52" />
          <Text style={styles.footerText}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/budget")}
        >
          <Ionicons name="wallet-outline" size={22} color="#534B52" />
          <Text style={styles.footerText}>Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/analytics")}
        >
          <Ionicons name="bar-chart-outline" size={22} color="#534B52" />
          <Text style={styles.footerText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/more")}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#534B52" />
          <Text style={styles.footerText}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: { paddingBottom: 110 },
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerGreetingLayout: { flex: 1 },
  userGreetingText: { fontSize: 16, fontWeight: "800", color: "#2D232E" },
  subGreetingText: { fontSize: 10, color: "#534B52", marginTop: 2 },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconNotificationButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    position: "relative",
  },
  notificationAlertDotIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EC7063",
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  balanceHeaderFlexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceTitleWithIconRow: { flexDirection: "row", alignItems: "center" },
  balanceSectionLabel: { fontSize: 13, fontWeight: "600", color: "#534B52" },
  eyeVisibilityToggleButton: {
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  miniTrendGraphIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#F0E6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceMainContentContainerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
    minHeight: 42,
  },
  massiveBalanceDisplayAmount: {
    fontSize: 34,
    fontWeight: "800",
    color: "#2D232E",
    letterSpacing: -0.5,
  },
  sparklineGraphContainer: {
    width: 110,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  balanceDeltaMetricRow: { flexDirection: "row", alignItems: "center" },
  balanceDeltaPercentLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2ECC71",
    marginRight: 4,
  },
  balanceDeltaContextPeriodText: { fontSize: 11, color: "#534B52" },
  splitCardsGridRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  gridCardItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 14,
    justifyContent: "space-between",
    minHeight: 125,
  },
  gridCardHeaderFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  gridCardBodyBriefBlurb: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2D232E",
    lineHeight: 16,
    marginTop: 4,
  },
  gridCardBottomGreenAccentLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2ECC71",
    marginTop: 6,
  },
  gridCardHeadingTitle: { fontSize: 12, fontWeight: "700", color: "#534B52" },
  massivePercentageGoalDisplayNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2D232E",
  },
  goalCompletionFractionStatusLabel: {
    fontSize: 10,
    color: "#534B52",
    marginVertical: 2,
  },
  progressBarTrackBackground: {
    height: 5,
    backgroundColor: "#EAEAEA",
    borderRadius: 3,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBarFilledActiveFill: {
    height: "100%",
    backgroundColor: "#2ECC71",
    borderRadius: 3,
  },
  sectionHeaderRowLinkToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardBlockHeadingTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D232E",
  },
  spendingOverviewVisualLayoutContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  donutFrameContainer: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  donutInnerHoleMask: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCoreMetricValue: { fontSize: 15, fontWeight: "800", color: "#2D232E" },
  donutCoreMetricSubLabel: { fontSize: 9, color: "#534B52", marginTop: 1 },
  legendVerticalListStack: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
  },
  legendRowItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    width: "100%",
    justifyContent: "space-between",
  },
  legendLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 6,
  },
  indicatorColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    flexShrink: 0,
  },
  legendCategoryLabelText: {
    fontSize: 12,
    color: "#2D232E",
    fontWeight: "500",
    flex: 1,
  },
  legendPercentContainer: { width: 40, alignItems: "flex-end", flexShrink: 0 },
  legendCategoryPercentValueText: {
    fontSize: 12,
    color: "#534B52",
    fontWeight: "500",
  },
  legendAmountContainer: { width: 65, alignItems: "flex-end", flexShrink: 0 },
  legendCategoryDollarAmountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D232E",
  },
  transactionHeaderCenteredContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    width: "100%",
  },
  cardBlockHeadingTitleTextCentered: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D232E",
    textAlign: "center",
    flex: 1,
  },
  sortActionRowButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 65,
    justifyContent: "center",
  },
  sortActionButtonLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#534B52",
  },
  placeholderSideBox: { width: 65 },
  transactionRowItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    overflow: "hidden",
  },
  transactionLeftMetadataWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  brandMerchantLogoAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  merchantMainNameText: { fontSize: 13, fontWeight: "700", color: "#2D232E" },
  merchantCategorySubText: { fontSize: 11, color: "#534B52", marginTop: 1 },
  transactionRightFinancialWrapper: {
    alignItems: "flex-end",
    width: 82,
    flexShrink: 0,
    marginLeft: 8,
  },
  transactionDebitNegativeAmountValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2D232E",
    textAlign: "right",
    maxWidth: "100%",
    flexShrink: 1,
    includeFontPadding: false,
  },
  expenseAmount: {
    color: "#E74C3C",
  },
  incomeAmount: {
    color: "#2ECC71",
  },
  transactionTimestampValueText: {
    fontSize: 10,
    color: "#A6ACAF",
    marginTop: 2,
    textAlign: "right",
    maxWidth: "100%",
  },
  footerNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
    paddingBottom: Platform.OS === "ios" ? 15 : 0,
  },
  footerItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    color: "#534B52",
    marginTop: 4,
    fontWeight: "500",
  },
  activeFooterText: { color: "#2D232E", fontWeight: "600" },
});
