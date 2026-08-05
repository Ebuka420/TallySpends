import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";

export default function ExpensesScreen() {
  const [activeTab, setActiveTab] = useState("Month");
  const [searchQuery, setSearchQuery] = useState("");

  // Donut chart calculations for SVG (r = 50, circumference ≈ 314.159)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // 5 Slices with exact percentages and your specified colors
  const slices = [
    { percent: 28, color: "#EA580C" }, // Food & Dining (Orange)
    { percent: 23, color: "#DB2777" }, // Shopping (Pink)
    { percent: 18, color: "#9CA3AF" }, // Others (Grey)
    { percent: 17, color: "#059669" }, // Bills & Utilities (Green)
    { percent: 14, color: "#4F46E5" }, // Transport (Purple)
  ];

  let accumulatedPercent = 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title & Filter Icon */}
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>
              Track, manage and save smarter
            </Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Time Segmented Pills */}
        <View style={styles.segmentedControl}>
          {["Today", "Week", "Month", "Custom"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.segmentButton,
                  isActive && styles.segmentButtonActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, categories..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Total Expenses Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardHeader}>
            <Text style={styles.balanceCardTitle}>Total Expenses</Text>
            <View style={styles.dropdownBadge}>
              <Text style={styles.dropdownText}>May 2024</Text>
              <Ionicons name="chevron-down" size={12} color="#4B5563" />
            </View>
          </View>

          <Text style={styles.balanceAmount}>$3,548.28</Text>

          <View style={styles.baselineRow}>
            <View style={styles.blueSquareDot} />
            <Text style={styles.baselineText}>Current Baseline</Text>
          </View>

          {/* Inline mini stats divider section */}
          <View style={styles.statsSplitRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconCircle}>
                <Ionicons name="pulse" size={16} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.statBoxLabel}>Transactions</Text>
                <Text style={styles.statBoxValue}>31</Text>
                <Text style={styles.statBoxSub}>Total logs</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#E6F4EA" }]}
              >
                <Ionicons name="basket-outline" size={16} color="#137333" />
              </View>
              <View>
                <Text style={styles.statBoxLabel}>Average Purchase</Text>
                <Text style={styles.statBoxValue}>$232.20</Text>
                <Text style={styles.statBoxSub}>Per transaction</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expense Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Categories</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesCard}>
          <View style={styles.categoriesRowLayout}>
            {/* SVG 5-Slice Proportional Donut Chart */}
            <View style={styles.donutContainer}>
              <Svg width={140} height={140} viewBox="0 0 120 120">
                <G rotation="-90" origin="60, 60">
                  {slices.map((slice, index) => {
                    const strokeDashoffset =
                      circumference -
                      (accumulatedPercent / 100) * circumference;
                    const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
                    accumulatedPercent += slice.percent;

                    return (
                      <Circle
                        key={index}
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke={slice.color}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        fill="transparent"
                      />
                    );
                  })}
                </G>
              </Svg>
              <View style={styles.donutInnerOverlay}>
                <Text style={styles.donutCenterValue}>$3,548.28</Text>
                <Text style={styles.donutCenterSub}>Total</Text>
              </View>
            </View>

            {/* Category Bars list */}
            <View style={styles.categoryList}>
              {/* Item 1: Food & Dining (Orange) */}
              <View style={styles.categoryItem}>
                <View
                  style={[styles.catIconBox, { backgroundColor: "#FFF7ED" }]}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={14}
                    color="#EA580C"
                  />
                </View>
                <View style={styles.catDetails}>
                  <View style={styles.catDetailsTop}>
                    <Text style={styles.catName}>Food & Dining</Text>
                    <Text style={styles.catAmount}>$1,004.72</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: "28%", backgroundColor: "#EA580C" },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.catPercentage}>28%</Text>
              </View>

              {/* Item 2: Transport (Purple) */}
              <View style={styles.categoryItem}>
                <View
                  style={[styles.catIconBox, { backgroundColor: "#EEF2FF" }]}
                >
                  <Ionicons name="car-outline" size={14} color="#4F46E5" />
                </View>
                <View style={styles.catDetails}>
                  <View style={styles.catDetailsTop}>
                    <Text style={styles.catName}>Transport</Text>
                    <Text style={styles.catAmount}>$511.66</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: "14%", backgroundColor: "#4F46E5" },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.catPercentage}>14%</Text>
              </View>

              {/* Item 3: Shopping (Pink) */}
              <View style={styles.categoryItem}>
                <View
                  style={[styles.catIconBox, { backgroundColor: "#FDF2F8" }]}
                >
                  <Ionicons
                    name="bag-handle-outline"
                    size={14}
                    color="#DB2777"
                  />
                </View>
                <View style={styles.catDetails}>
                  <View style={styles.catDetailsTop}>
                    <Text style={styles.catName}>Shopping</Text>
                    <Text style={styles.catAmount}>$818.99</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: "23%", backgroundColor: "#DB2777" },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.catPercentage}>23%</Text>
              </View>

              {/* Item 4: Bills & Utilities (Green) */}
              <View style={styles.categoryItem}>
                <View
                  style={[styles.catIconBox, { backgroundColor: "#ECFDF5" }]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={14}
                    color="#059669"
                  />
                </View>
                <View style={styles.catDetails}>
                  <View style={styles.catDetailsTop}>
                    <Text style={styles.catName}>Bills & Utilities</Text>
                    <Text style={styles.catAmount}>$620.33</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: "17%", backgroundColor: "#059669" },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.catPercentage}>17%</Text>
              </View>

              {/* Item 5: Others (Grey) */}
              <View style={[styles.categoryItem, { borderBottomWidth: 0 }]}>
                <View
                  style={[styles.catIconBox, { backgroundColor: "#F3F4F6" }]}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={14}
                    color="#4B5563"
                  />
                </View>
                <View style={styles.catDetails}>
                  <View style={styles.catDetailsTop}>
                    <Text style={styles.catName}>Others</Text>
                    <Text style={styles.catAmount}>$592.58</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: "18%", backgroundColor: "#9CA3AF" },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.catPercentage}>18%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Latest Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsCard}>
          <View style={styles.transactionRow}>
            <View style={[styles.merchantAvatar, { backgroundColor: "#000" }]}>
              <Text style={styles.merchantInitial}>U</Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.merchantName}>Uber</Text>
              <Text style={styles.merchantCategory}>Transport</Text>
            </View>
            <View style={styles.transactionAmountGroup}>
              <Text style={styles.expenseAmountText}>-$18.40</Text>
              <Text style={styles.transactionTimeText}>Today</Text>
            </View>
          </View>

          <View style={styles.transactionRow}>
            <View
              style={[styles.merchantAvatar, { backgroundColor: "#006241" }]}
            >
              <FontAwesome5 name="starbucks" size={14} color="#FFF" />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.merchantName}>Starbucks</Text>
              <Text style={styles.merchantCategory}>Food & Dining</Text>
            </View>
            <View style={styles.transactionAmountGroup}>
              <Text style={styles.expenseAmountText}>-$5.20</Text>
              <Text style={styles.transactionTimeText}>Today</Text>
            </View>
          </View>

          <View style={[styles.transactionRow, { borderBottomWidth: 0 }]}>
            <View
              style={[styles.merchantAvatar, { backgroundColor: "#FCE7F3" }]}
            >
              <Ionicons name="bag-handle" size={14} color="#DB2777" />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.merchantName}>Zara</Text>
              <Text style={styles.merchantCategory}>Shopping</Text>
            </View>
            <View style={styles.transactionAmountGroup}>
              <Text style={styles.expenseAmountText}>-$89.90</Text>
              <Text style={styles.transactionTimeText}>Yesterday</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
  },
  segmentButtonActive: {
    backgroundColor: "#20142a",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 20,
  },
  balanceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceCardTitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  dropdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 4,
  },
  baselineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  blueSquareDot: {
    width: 8,
    height: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 2,
    marginRight: 6,
  },
  baselineText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  statsSplitRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 12,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  statBoxLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  statBoxValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  statBoxSub: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  viewAllText: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "600",
  },
  categoriesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 20,
  },
  categoriesRowLayout: {
    flexDirection: "column",
    gap: 16,
  },
  donutContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    position: "relative",
    height: 140,
  },
  donutInnerOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  donutCenterSub: {
    fontSize: 11,
    color: "#6B7280",
  },
  categoryList: {
    width: "100%",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  catIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  catDetails: {
    flex: 1,
    marginRight: 10,
  },
  catDetailsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  catAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 2,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  catPercentage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    width: 32,
    textAlign: "right",
  },
  transactionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  merchantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  merchantInitial: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  transactionInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  merchantCategory: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  transactionAmountGroup: {
    alignItems: "flex-end",
  },
  expenseAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  transactionTimeText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
});
