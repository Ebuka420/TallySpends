import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function DashboardScreen() {
  const router = useRouter();

  // State hook to handle toggling privacy mask for account balances
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);

  // Clean data alignment matching your exact categorical distributions
  const spendingData = [
    {
      color: "#2D232E",
      label: "Food & Dining",
      percent: "26%",
      amount: "$602.10",
    }, // Shadow Grey from image_7.png
    { color: "#5DADE2", label: "Transport", percent: "20%", amount: "$430.00" },
    { color: "#F5B041", label: "Shopping", percent: "18%", amount: "$387.50" },
    {
      color: "#EC7063",
      label: "Bills & Utilities",
      percent: "15%",
      amount: "$322.00",
    },
    {
      color: "#A6ACAF",
      label: "Entertainment",
      percent: "10%",
      amount: "$215.80",
    },
    { color: "#D5D8DC", label: "Other", percent: "9%", amount: "$200.90" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-outline" size={20} color="#534B52" />
          </View>
          <View style={styles.headerGreetingLayout}>
            <Text style={styles.userGreetingText}>Hi user</Text>
            <Text style={styles.subGreetingText}>
              Where did your money go today?
            </Text>
          </View>
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.iconNotificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#2D232E" />
            <View style={styles.notificationAlertDotIndicator} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconNotificationButton}>
            <Ionicons name="headset-outline" size={22} color="#2D232E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- TOTAL BALANCE CARD WITH ACCESSIBLE VISIBILITY EYE TOGGLE --- */}
        <View style={styles.card}>
          <View style={styles.balanceHeaderFlexRow}>
            <View style={styles.balanceTitleWithIconRow}>
              <Text style={styles.balanceSectionLabel}>Total Balance</Text>

              {/* The interactive eye switch widget */}
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
              <Ionicons name="trending-up-outline" size={14} color="#2D232E" />
            </View>
          </View>

          {/* Dynamic mask application layer */}
          <Text style={styles.massiveBalanceDisplayAmount}>
            {isBalanceVisible ? "$2,842.50" : "•••••"}
          </Text>

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

        {/* --- INSIGHTS & GOALS SPLIT ROW --- */}
        <View style={styles.splitCardsGridRow}>
          {/* Insights Block */}
          <View style={[styles.gridCardItem, { marginRight: 6 }]}>
            <View style={styles.gridCardHeaderFlex}>
              <View
                style={[
                  styles.gridIconCircleWrapper,
                  { backgroundColor: "#E8F8F5" },
                ]}
              >
                <Ionicons name="trending-up" size={14} color="#2ECC71" />
              </View>
              <Ionicons name="chevron-forward" size={14} color="#534B52" />
            </View>
            <Text style={styles.gridCardBodyBriefBlurb} numberOfLines={3}>
              You spent 12% less on shopping this month
            </Text>
            <Text style={styles.gridCardBottomGreenAccentLabel}>
              + 12% improvement
            </Text>
          </View>

          {/* Goals Progress Block */}
          <View style={[styles.gridCardItem, { marginLeft: 6 }]}>
            <View style={styles.gridCardHeaderFlex}>
              <Text style={styles.gridCardHeadingTitle}>Goals Progress</Text>
              <Ionicons name="ellipsis-vertical" size={14} color="#534B52" />
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

        {/* --- SPENDING OVERVIEW (6-SEGMENT DONUT + TRUNCATION-SAFE TABULAR ROW LEGEND) --- */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRowLinkToggle}>
            <Text style={styles.cardBlockHeadingTitleText}>
              Spending Overview
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#534B52" />
          </View>

          <View style={styles.spendingOverviewVisualLayoutContentRow}>
            {/* Multi-layered CSS border wheel segments */}
            <View style={styles.donutFrameContainer}>
              <View style={styles.donutBaseCircle}>
                <View
                  style={[
                    styles.donutSegment,
                    { borderColor: "#2D232E", zIndex: 6 },
                  ]}
                />
                <View
                  style={[
                    styles.donutSegment,
                    {
                      borderColor: "#5DADE2",
                      transform: [{ rotate: "93deg" }],
                      zIndex: 5,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.donutSegment,
                    {
                      borderColor: "#F5B041",
                      transform: [{ rotate: "165deg" }],
                      zIndex: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.donutSegment,
                    {
                      borderColor: "#EC7063",
                      transform: [{ rotate: "230deg" }],
                      zIndex: 3,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.donutSegment,
                    {
                      borderColor: "#A6ACAF",
                      transform: [{ rotate: "284deg" }],
                      zIndex: 2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.donutSegment,
                    {
                      borderColor: "#D5D8DC",
                      transform: [{ rotate: "320deg" }],
                      zIndex: 1,
                    },
                  ]}
                />

                {/* Opaque center knockout circle */}
                <View style={styles.donutInnerHoleMask}>
                  <Text style={styles.donutCoreMetricValue}>$2,158</Text>
                  <Text style={styles.donutCoreMetricSubLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Stable layout tracking text info as rigid tabular columns to fix image_9.png overlap */}
            <View style={styles.legendVerticalListStack}>
              {spendingData.map((item, index) => (
                <View style={styles.legendRowItem} key={index}>
                  {/* Left Column: Fixed space fraction for Dot + Label */}
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

                  {/* Middle Column: Fixed percentage column width boundary */}
                  <View style={styles.legendPercentContainer}>
                    <Text
                      style={styles.legendCategoryPercentValueText}
                      numberOfLines={1}
                    >
                      {item.percent}
                    </Text>
                  </View>

                  {/* Right Column: Fixed financial amount column width boundary */}
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
          <View style={styles.sectionHeaderRowLinkToggle}>
            <Text style={styles.cardBlockHeadingTitleText}>
              Recent Transactions
            </Text>
            <TouchableOpacity>
              <Text style={styles.viewAllActionTextLinkButton}>View all</Text>
            </TouchableOpacity>
          </View>

          {/* Item 1 */}
          <View style={styles.transactionRowItemContainer}>
            <View style={styles.transactionLeftMetadataWrapper}>
              <View
                style={[
                  styles.brandMerchantLogoAvatarBox,
                  { backgroundColor: "#E8F5E9" },
                ]}
              >
                <Ionicons name="cafe-outline" size={16} color="#2E7D32" />
              </View>
              <View>
                <Text style={styles.merchantMainNameText}>Starbucks</Text>
                <Text style={styles.merchantCategorySubText}>
                  Food & Dining
                </Text>
              </View>
            </View>
            <View style={styles.transactionRightFinancialWrapper}>
              <Text style={styles.transactionDebitNegativeAmountValue}>
                -$5.20
              </Text>
              <Text style={styles.transactionTimestampValueText}>May 20</Text>
            </View>
          </View>

          {/* Item 2 */}
          <View
            style={[
              styles.transactionRowItemContainer,
              { borderBottomWidth: 0, paddingBottom: 0 },
            ]}
          >
            <View style={styles.transactionLeftMetadataWrapper}>
              <View
                style={[
                  styles.brandMerchantLogoAvatarBox,
                  { backgroundColor: "#F5F5F5" },
                ]}
              >
                <Ionicons name="car-outline" size={16} color="#2D232E" />
              </View>
              <View>
                <Text style={styles.merchantMainNameText}>Uber</Text>
                <Text style={styles.merchantCategorySubText}>Transport</Text>
              </View>
            </View>
            <View style={styles.transactionRightFinancialWrapper}>
              <Text style={styles.transactionDebitNegativeAmountValue}>
                -$18.40
              </Text>
              <Text style={styles.transactionTimestampValueText}>May 19</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- FOOTER MAIN ROUTING BAR --- */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/")}
        >
          <Ionicons name="home" size={22} color="#2D232E" />
          <Text style={[styles.footerText, styles.activeFooterText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/expenses")}
        >
          <Ionicons name="document-text-outline" size={22} color="#534B52" />
          <Text style={styles.footerText}>Expenses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/budget")}
        >
          <Ionicons name="wallet-outline" size={22} color="#534B52" />
          <Text style={styles.footerText}>Budget</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/analytics")}
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
  container: {
    flex: 1,
    backgroundColor: "#F1F0EA", // Parchment Background from image_7.png
  },
  scrollContainer: {
    paddingBottom: 110,
  },
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E0DDCF", // Bone color divider from image_7.png
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0DDCF", // Bone color background
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerGreetingLayout: {
    flex: 1,
  },
  userGreetingText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D232E", // Shadow Grey from image_7.png
  },
  subGreetingText: {
    fontSize: 12,
    color: "#534B52", // Taupe Grey from image_7.png
    marginTop: 2,
  },
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
    borderColor: "#E0DDCF", // Bone container frames
  },
  balanceHeaderFlexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceTitleWithIconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#534B52", // Taupe Grey
  },
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
    backgroundColor: "#E0DDCF", // Bone back-fill
    alignItems: "center",
    justifyContent: "center",
  },
  massiveBalanceDisplayAmount: {
    fontSize: 34,
    fontWeight: "800",
    color: "#2D232E", // Shadow Grey
    marginVertical: 6,
    letterSpacing: -0.5,
    minHeight: 42,
  },
  balanceDeltaMetricRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceDeltaPercentLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2ECC71",
    marginRight: 4,
  },
  balanceDeltaContextPeriodText: {
    fontSize: 11,
    color: "#534B52",
  },
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
    borderColor: "#E0DDCF",
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
  gridIconCircleWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardBodyBriefBlurb: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2D232E",
    lineHeight: 16,
  },
  gridCardBottomGreenAccentLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2ECC71",
    marginTop: 6,
  },
  gridCardHeadingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#534B52",
  },
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
    backgroundColor: "#E0DDCF",
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
  viewAllActionTextLinkButton: {
    fontSize: 12,
    color: "#2D232E",
    fontWeight: "700",
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
  },
  donutBaseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  donutSegment: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 11,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  donutInnerHoleMask: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  donutCoreMetricValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2D232E",
  },
  donutCoreMetricSubLabel: {
    fontSize: 9,
    color: "#534B52",
    marginTop: 1,
  },
  legendVerticalListStack: {
    width: "60%", // Static outer constraint box width limits total line horizontal travel
    paddingLeft: 8,
    justifyContent: "center",
  },
  legendRowItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    width: "100%",
  },
  legendLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%", // Rigidly locks the text to half the block area maximum, forcing truncation text cutoffs
    paddingRight: 4,
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
  legendPercentContainer: {
    width: "20%", // Locks percentages inside a distinct column window
    alignItems: "flex-end",
  },
  legendCategoryPercentValueText: {
    fontSize: 12,
    color: "#534B52",
    fontWeight: "500",
  },
  legendAmountContainer: {
    width: "30%", // Locks amounts on the far right tracking margin securely
    alignItems: "flex-end",
  },
  legendCategoryDollarAmountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D232E",
  },
  transactionRowItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0DDCF",
  },
  transactionLeftMetadataWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandMerchantLogoAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  merchantMainNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D232E",
  },
  merchantCategorySubText: {
    fontSize: 11,
    color: "#534B52",
    marginTop: 1,
  },
  transactionRightFinancialWrapper: {
    alignItems: "flex-end",
  },
  transactionDebitNegativeAmountValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D232E",
  },
  transactionTimestampValueText: {
    fontSize: 11,
    color: "#A6ACAF",
    marginTop: 2,
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
    borderTopColor: "#E0DDCF",
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
  activeFooterText: {
    color: "#2D232E",
    fontWeight: "600",
  },
});
