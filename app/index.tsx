import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // 🚀 IMPORT THE ROUTER
import React from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const router = useRouter(); // 🚀 INITIALIZE THE ROUTER HOOK

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* 1. HEADER SECTION */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeftRow}>
          {/* 🔴 CIRCLE 1: USER ICON -> PROFILE PAGE */}
          <TouchableOpacity
            style={styles.avatarPlaceholder}
            onPress={() => router.push("/profile")}
            activeOpacity={0.7}
          >
            <Feather name="user" size={22} color="#6C757D" />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greetingText}>Hi user</Text>
            <Text style={styles.subtitleText}>
              Where did your money go today?
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActionGroup}>
          {/* 🔴 CIRCLE 2: BELL ICON -> NOTIFICATIONS */}
          <TouchableOpacity
            style={styles.iconActionButton}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={22} color="#1A1A1A" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          {/* 🔴 CIRCLE 3: HEADPHONE ICON -> SUPPORT */}
          <TouchableOpacity
            style={styles.iconActionButton}
            onPress={() => router.push("/support")}
            activeOpacity={0.7}
          >
            <Feather name="headphones" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN DATA SCROLLVIEW */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        {/* TOTAL BALANCE CARD */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelText}>Total Balance</Text>
            <View style={styles.trendBadgePlaceholder}>
              <Feather name="trending-up" size={14} color="#6366F1" />
            </View>
          </View>

          <View style={styles.balanceDataRow}>
            <View>
              <Text style={styles.balanceMainAmount}>$2,842.50</Text>
              <Text style={styles.balanceSubStatText}>
                <Text style={styles.greenText}>▲ 8.5%</Text> from last month
              </Text>
            </View>

            <View style={styles.sparklineWrapper}>
              <View style={styles.sparklineBarGroup}>
                <View style={[styles.sparkLineNode, { height: 12 }]} />
                <View style={[styles.sparkLineNode, { height: 18 }]} />
                <View style={[styles.sparkLineNode, { height: 15 }]} />
                <View style={[styles.sparkLineNode, { height: 22 }]} />
                <View
                  style={[
                    styles.sparkLineNode,
                    { height: 28, backgroundColor: "#6366F1" },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* TWO-COLUMN SPLIT ROW */}
        <View style={styles.splitCardsRow}>
          {/* 🔴 CIRCLE 4: INSIGHTS CARD DIV */}
          <TouchableOpacity
            style={[styles.halfCard, { marginRight: 8 }]}
            onPress={() => router.push("/insights")}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.insightIconWrapper}>
                <Feather name="trending-up" size={16} color="#10B981" />
              </View>
              <Feather name="chevron-right" size={16} color="#9CA3AF" />
            </View>
            <Text style={styles.halfCardMainBody}>
              You spent 12% less on shopping this month
            </Text>
            <Text style={styles.halfCardGreenBadge}>+ 12% improvement</Text>
          </TouchableOpacity>

          {/* 🔴 CIRCLE 5: GOALS PROGRESS CARD -> BUDGET TABS */}
          <TouchableOpacity
            style={[styles.halfCard, { marginLeft: 8 }]}
            onPress={() => router.push("/budget")}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.halfCardLabel}>Goals Progress</Text>
              <Feather name="more-horizontal" size={16} color="#9CA3AF" />
            </View>
            <Text style={styles.halfCardLargePercent}>60%</Text>
            <Text style={styles.halfCardSubLabel}>2 of 3 goals completed</Text>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: "60%" }]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* SPENDING OVERVIEW */}
        <View style={styles.mainCard}>
          {/* 🔴 CIRCLE 6: SPENDING CHEVRON ARROW -> EXPENSES */}
          <TouchableOpacity
            style={[styles.cardHeaderRow, { marginBottom: 16 }]}
            onPress={() => router.push("/expenses")}
            activeOpacity={0.6}
          >
            <Text style={styles.sectionTitleText}>Spending Overview</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.spendingDashboardLayout}>
            <View style={styles.donutChartOuterContainer}>
              <View style={styles.donutMaskInner}>
                <Text style={styles.donutInnerPrice}>$2,158</Text>
                <Text style={styles.donutInnerSub}>Total</Text>
              </View>
              <View
                style={[
                  styles.donutSegment,
                  {
                    borderColor: "#1E1B4B",
                    borderTopColor: "transparent",
                    transform: [{ rotate: "45deg" }],
                  },
                ]}
              />
              <View
                style={[
                  styles.donutSegment,
                  {
                    borderColor: "#3B82F6",
                    borderRightColor: "transparent",
                    transform: [{ rotate: "140deg" }],
                  },
                ]}
              />
              <View
                style={[
                  styles.donutSegment,
                  {
                    borderColor: "#F59E0B",
                    borderBottomColor: "transparent",
                    transform: [{ rotate: "230deg" }],
                  },
                ]}
              />
            </View>

            <View style={styles.breakdownLegendList}>
              {[
                {
                  label: "Food & Dining",
                  pct: "26%",
                  amt: "$602.10",
                  color: "#1E1B4B",
                },
                {
                  label: "Transport",
                  pct: "20%",
                  amt: "$430.00",
                  color: "#3B82F6",
                },
                {
                  label: "Shopping",
                  pct: "18%",
                  amt: "$387.50",
                  color: "#F59E0B",
                },
                {
                  label: "Bills & Utilities",
                  pct: "15%",
                  amt: "$EF4444",
                  color: "#EF4444",
                },
                {
                  label: "Entertainment",
                  pct: "10%",
                  amt: "$215.80",
                  color: "#10B981",
                },
                { label: "Other", pct: "9%", amt: "$200.90", color: "#A3A3A3" },
              ].map((item, index) => (
                <View key={index} style={styles.legendRowItem}>
                  <View style={styles.legendLabelGroup}>
                    <View
                      style={[
                        styles.colorIndicatorBullet,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.legendLabelText} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.legendValueGroup}>
                    <Text style={styles.legendPercentageText}>{item.pct}</Text>
                    <Text style={styles.legendAmountText}>{item.amt}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* RECENT TRANSACTIONS */}
        <View style={[styles.mainCard, { marginBottom: 30 }]}>
          <View style={[styles.cardHeaderRow, { marginBottom: 16 }]}>
            <Text style={styles.sectionTitleText}>Recent Transactions</Text>
            {/* 🔴 CIRCLE 7: VIEW ALL LINK -> EXPENSES */}
            <TouchableOpacity onPress={() => router.push("/expenses")}>
              <Text style={styles.viewAllActionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {/* 🔴 CIRCLE 8: STARBUCKS ROW -> TRANSACTION DETAILS */}
          <TouchableOpacity
            style={styles.transactionRowItem}
            onPress={() => router.push("/transaction-details")}
            activeOpacity={0.7}
          >
            <View style={styles.transactionProfileLayout}>
              <View
                style={[
                  styles.merchantAvatarBox,
                  { backgroundColor: "#E1F5FE" },
                ]}
              >
                <Ionicons name="fast-food-outline" size={20} color="#007F5F" />
              </View>
              <View style={styles.transactionTextStack}>
                <Text style={styles.merchantNameTitle}>Starbucks</Text>
                <Text style={styles.merchantCategorySubtitle}>
                  Food & Dining
                </Text>
              </View>
            </View>
            <View style={styles.transactionAmountStack}>
              <Text style={styles.negativeExpenseAmount}>-$5.20</Text>
              <Text style={styles.transactionDateStampText}>May 20</Text>
            </View>
          </TouchableOpacity>

          {/* 🔴 CIRCLE 8: UBER ROW -> TRANSACTION DETAILS */}
          <TouchableOpacity
            style={[
              styles.transactionRowItem,
              { borderBottomWidth: 0, paddingBottom: 0 },
            ]}
            onPress={() => router.push("/transaction-details")}
            activeOpacity={0.7}
          >
            <View style={styles.transactionProfileLayout}>
              <View
                style={[
                  styles.merchantAvatarBox,
                  { backgroundColor: "#F3E5F5" },
                ]}
              >
                <Ionicons name="car-outline" size={20} color="#4A148C" />
              </View>
              <View style={styles.transactionTextStack}>
                <Text style={styles.merchantNameTitle}>Uber</Text>
                <Text style={styles.merchantCategorySubtitle}>Transport</Text>
              </View>
            </View>
            <View style={styles.transactionAmountStack}>
              <Text style={styles.negativeExpenseAmount}>-$18.40</Text>
              <Text style={styles.transactionDateStampText}>May 19</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 6. FIXED BOTTOM NAVIGATION TAB BAR (CIRCLES 9, 10, 11, 12, 13) */}
      <View style={styles.bottomTabContainer}>
        <TouchableOpacity
          style={styles.tabBarItemButton}
          onPress={() => router.push("/")}
        >
          <MaterialIcons name="home-filled" size={24} color="#6366F1" />
          <Text style={[styles.tabBarItemLabel, styles.activeTabLabelColor]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItemButton}
          onPress={() => router.push("/expenses")}
        >
          <Feather name="file-text" size={22} color="#9CA3AF" />
          <Text style={styles.tabBarItemLabel}>Expenses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItemButton}
          onPress={() => router.push("/budget")}
        >
          <Feather name="credit-card" size={22} color="#9CA3AF" />
          <Text style={styles.tabBarItemLabel}>Budget</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItemButton}
          onPress={() => router.push("/analytics")}
        >
          <Feather name="bar-chart-2" size={22} color="#9CA3AF" />
          <Text style={styles.tabBarItemLabel}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItemButton}
          onPress={() => router.push("/more")}
        >
          <Feather name="more-horizontal" size={22} color="#9CA3AF" />
          <Text style={styles.tabBarItemLabel}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ... Keep your same styles underneath completely untouched ...
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollPadding: { paddingHorizontal: 16, paddingBottom: 100 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#F8F9FA",
  },
  headerLeftRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9ECEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#DEE2E6",
  },
  headerTextGroup: { flex: 1 },
  greetingText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  subtitleText: { fontSize: 13, color: "#6C757D" },
  headerRightActionGroup: { flexDirection: "row", alignItems: "center" },
  iconActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabelText: { fontSize: 14, color: "#6C757D", fontWeight: "500" },
  sectionTitleText: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  balanceDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  balanceMainAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  balanceSubStatText: { fontSize: 13, color: "#6C757D", marginTop: 4 },
  greenText: { color: "#10B981", fontWeight: "600" },
  trendBadgePlaceholder: {
    padding: 6,
    backgroundColor: "#EEF2F6",
    borderRadius: 8,
  },
  sparklineWrapper: {
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  sparklineBarGroup: { flexDirection: "row", alignItems: "flex-end" },
  sparkLineNode: {
    width: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginLeft: 3,
  },
  splitCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: "space-between",
    minHeight: 125,
  },
  insightIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E6F4EA",
    alignItems: "center",
    justifyContent: "center",
  },
  halfCardMainBody: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333333",
    lineHeight: 18,
    marginVertical: 8,
  },
  halfCardGreenBadge: { fontSize: 11, color: "#10B981", fontWeight: "600" },
  halfCardLabel: { fontSize: 12, color: "#6C757D", fontWeight: "600" },
  halfCardLargePercent: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 4,
  },
  halfCardSubLabel: { fontSize: 11, color: "#6C757D", marginBottom: 6 },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  spendingDashboardLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  donutChartOuterContainer: {
    width: 105,
    height: 105,
    borderRadius: 52.5,
    borderWidth: 10,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  donutSegment: {
    position: "absolute",
    width: 105,
    height: 105,
    borderRadius: 52.5,
    borderWidth: 10,
    top: -10,
    left: -10,
  },
  donutMaskInner: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  donutInnerPrice: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  donutInnerSub: {
    fontSize: 10,
    color: "#9CA3AF",
    textTransform: "uppercase",
    fontWeight: "500",
    marginTop: 1,
  },
  breakdownLegendList: { flex: 1, marginLeft: 16 },
  legendRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  legendLabelGroup: { flexDirection: "row", alignItems: "center", flex: 0.55 },
  colorIndicatorBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabelText: { fontSize: 12, color: "#4B5563", fontWeight: "500" },
  legendValueGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 0.45,
  },
  legendPercentageText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    flex: 1,
    marginRight: 8,
  },
  legendAmountText: {
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "600",
    textAlign: "right",
  },
  viewAllActionLink: { fontSize: 13, color: "#6366F1", fontWeight: "600" },
  transactionRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  transactionProfileLayout: { flexDirection: "row", alignItems: "center" },
  merchantAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionTextStack: { justifyContent: "center" },
  merchantNameTitle: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  merchantCategorySubtitle: { fontSize: 12, color: "#6C757D", marginTop: 2 },
  transactionAmountStack: { alignItems: "flex-end" },
  negativeExpenseAmount: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  transactionDateStampText: { fontSize: 11, color: "#9CA3AF", marginTop: 3 },
  bottomTabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    paddingBottom: 4,
  },
  tabBarItemButton: { alignItems: "center", justifyContent: "center", flex: 1 },
  tabBarItemLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 4,
  },
  activeTabLabelColor: { color: "#6366F1", fontWeight: "600" },
});
