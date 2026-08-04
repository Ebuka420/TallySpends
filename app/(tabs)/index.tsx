import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header Container */}
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

        {/* Balance Card with Wallet Background */}
        <ImageBackground
          source={require("@/assets/images/base dashboard.png")}
          style={styles.balanceCard}
          imageStyle={styles.balanceCardBg}
        >
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>
              Available Balance{" "}
              <Ionicons name="eye-off-outline" size={14} color="#A0A0A0" />
            </Text>
            <Text style={styles.balanceAmount}>$2,842.50</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="arrow-up" size={12} color="#10B981" />
              <Text style={styles.trendText}> 8.5% from last month</Text>
            </View>
          </View>
        </ImageBackground>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="download-outline" size={20} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="arrow-up-outline" size={20} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="swap-horizontal-outline" size={20} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* This Month Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <Text style={styles.viewAllText}>View all</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View
              style={[styles.metricIconBox, { backgroundColor: "#E1F5FE" }]}
            >
              <Ionicons name="arrow-down-outline" size={14} color="#0288D1" />
            </View>
            <Text style={styles.metricLabel}>Income</Text>
            <Text style={styles.metricValue}>$4,120.00</Text>
          </View>

          <View style={styles.metricCard}>
            <View
              style={[styles.metricIconBox, { backgroundColor: "#FFEBEE" }]}
            >
              <Ionicons name="arrow-up-outline" size={14} color="#D32F2F" />
            </View>
            <Text style={styles.metricLabel}>Spent</Text>
            <Text style={styles.metricValue}>$1,962.00</Text>
          </View>

          <View style={styles.metricCard}>
            <View
              style={[styles.metricIconBox, { backgroundColor: "#F3E5F5" }]}
            >
              <Ionicons name="shield-outline" size={14} color="#7B1FA2" />
            </View>
            <Text style={styles.metricLabel}>Saved</Text>
            <Text style={styles.metricValue}>$1,104.00</Text>
          </View>
        </View>

        {/* Smart Tip Card */}
        <View style={styles.smartTipCard}>
          <View style={styles.smartTipContent}>
            <View style={styles.tipHeaderRow}>
              <Ionicons name="bulb-outline" size={16} color="#000" />
              <Text style={styles.smartTipTitle}> Smart Tip</Text>
            </View>
            <Text style={styles.smartTipMainText}>You're doing great!</Text>
            <Text style={styles.smartTipSubText}>
              You've spent 18% less on food this week. Keep it up and save $95
              more this month.
            </Text>

            <TouchableOpacity style={styles.insightsButton}>
              <Text style={styles.insightsButtonText}>See Insights</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.flowerIconContainer}>
            <Ionicons name="flower-outline" size={48} color="#10B981" />
          </View>
        </View>

        {/* Top Categories Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <Text style={styles.viewAllText}>View all</Text>
        </View>

        <View style={styles.categoriesRow}>
          <View style={styles.categoryCard}>
            <View
              style={[styles.catIconCircle, { backgroundColor: "#1A1A1A" }]}
            >
              <Ionicons name="restaurant-outline" size={16} color="#FFF" />
            </View>
            <Text style={styles.catTitle}>Food & Dining</Text>
            <Text style={styles.catAmount}>$602.10</Text>
            <Text style={styles.catPercentage}>26%</Text>
          </View>

          <View style={styles.categoryCard}>
            <View
              style={[styles.catIconCircle, { backgroundColor: "#5B21B6" }]}
            >
              <Ionicons name="car-outline" size={16} color="#FFF" />
            </View>
            <Text style={styles.catTitle}>Transport</Text>
            <Text style={styles.catAmount}>$430.00</Text>
            <Text style={styles.catPercentage}>20%</Text>
          </View>

          <View style={styles.categoryCard}>
            <View
              style={[styles.catIconCircle, { backgroundColor: "#F59E0B" }]}
            >
              <Ionicons name="bag-handle-outline" size={16} color="#FFF" />
            </View>
            <Text style={styles.catTitle}>Shopping</Text>
            <Text style={styles.catAmount}>$387.50</Text>
            <Text style={styles.catPercentage}>18%</Text>
          </View>

          <View style={styles.categoryCard}>
            <View
              style={[styles.catIconCircle, { backgroundColor: "#3B82F6" }]}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFF" />
            </View>
            <Text style={styles.catTitle}>Bills & Utilities</Text>
            <Text style={styles.catAmount}>$322.00</Text>
            <Text style={styles.catPercentage}>15%</Text>
          </View>
        </View>

        {/* Recent Transactions Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.viewAllText}>View all</Text>
        </View>

        <View style={styles.transactionsContainer}>
          <View style={styles.transactionItem}>
            <View style={styles.transLeft}>
              <View style={styles.transIconCircle}>
                <Ionicons name="cafe-outline" size={18} color="#10B981" />
              </View>
              <View>
                <Text style={styles.transName}>Starbucks</Text>
                <Text style={styles.transCategory}>Food & Dining</Text>
              </View>
            </View>
            <View style={styles.transRight}>
              <Text style={styles.transAmountNegative}>-$5.20</Text>
              <Text style={styles.transTime}>Today</Text>
            </View>
          </View>

          <View style={styles.transactionItem}>
            <View style={styles.transLeft}>
              <View style={styles.transIconCircle}>
                <Ionicons name="car-sport-outline" size={18} color="#1A1A1A" />
              </View>
              <View>
                <Text style={styles.transName}>Uber</Text>
                <Text style={styles.transCategory}>Transport</Text>
              </View>
            </View>
            <View style={styles.transRight}>
              <Text style={styles.transAmountNegative}>-$18.40</Text>
              <Text style={styles.transTime}>Yesterday</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  subGreetingText: {
    fontSize: 10,
    color: "#7C7C7C",
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F3F5",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCard: {
    backgroundColor: "#20142A",
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    height: 145,
    justifyContent: "center",
    position: "relative",
  },
  balanceContent: {
    padding: 20,
    zIndex: 2,
  },
  balanceCardBg: {
    position: "absolute",
    right: -10,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.9,
  },
  balanceLabel: {
    color: "#A0A0A0",
    fontSize: 13,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 6,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  trendText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#20142A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  viewAllText: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  metricIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: "#7C7C7C",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  smartTipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    alignItems: "center",
  },
  smartTipContent: {
    flex: 1,
  },
  tipHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  smartTipTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  smartTipMainText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  smartTipSubText: {
    fontSize: 11,
    color: "#7C7C7C",
    lineHeight: 16,
    marginBottom: 12,
  },
  insightsButton: {
    backgroundColor: "#20142A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  insightsButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  flowerIconContainer: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesRow: {
    flexDirection: "row",
    gap: 8,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  transIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F3F5",
    justifyContent: "center",
    alignItems: "center",
  },
  transName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  transCategory: {
    fontSize: 11,
    color: "#7C7C7C",
    marginTop: 2,
  },
  transRight: {
    alignItems: "flex-end",
  },
  transAmountNegative: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  transTime: {
    fontSize: 11,
    color: "#7C7C7C",
    marginTop: 2,
  },
});
