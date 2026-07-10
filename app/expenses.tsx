import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TimePeriod = "today" | "week" | "month" | "custom";

export default function ExpensesScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TimePeriod>("month");

  // --- PAN RESPONDER SETUP FOR THE DRAGGABLE BUTTON ---
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }, // Layout transformations require JS thread evaluation
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;

  // Helper component for filter dropdowns
  const FilterBadge = ({ label }: { label: string }) => (
    <TouchableOpacity style={styles.filterBadge}>
      <Text style={styles.filterBadgeText}>{label}</Text>
      <Ionicons
        name="chevron-down"
        size={12}
        color="#666"
        style={{ marginLeft: 4 }}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* --- TOP NAVIGATION BAR --- */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Expenses</Text>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search-outline" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Octicons name="sliders" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- TIME PERIOD TABS --- */}
        <View style={styles.tabContainer}>
          {["today", "week", "month", "custom"].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.tabButton,
                activeTab === period && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(period as TimePeriod)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === period && styles.activeTabText,
                ]}
              >
                {period === "custom"
                  ? "Custom 📅"
                  : period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- FILTER ROW --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          <FilterBadge label="Category" />
          <FilterBadge label="Vendor" />
          <FilterBadge label="Amount" />
          <FilterBadge label="Payment Method" />
          <TouchableOpacity style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- TOTAL EXPENSES CARD --- */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryAmount}>$2,158.30</Text>
              <Text style={styles.summaryTrend}>
                &#128313; 12% less than last month
              </Text>
            </View>
            <TouchableOpacity style={styles.monthDropdown}>
              <Text style={styles.monthDropdownText}>May 2024</Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color="#666"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.sparklinePlaceholder}>
            <View style={styles.sparklineCurve} />
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Transactions</Text>
              <Text style={styles.metricValue}>84</Text>
              <Text style={styles.metricSubText}>Total transactions</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Average Purchase</Text>
              <Text style={styles.metricValue}>$25.70</Text>
              <Text style={styles.metricSubText}>Per transaction</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Highest Expense</Text>
              <Text style={styles.metricValue}>$420.00</Text>
              <Text style={styles.metricSubText}>On May 12, 2024</Text>
            </View>
          </View>
        </View>

        {/* --- EXPENSE CATEGORIES SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Categories</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesRow}
        >
          <View style={styles.categoryCard}>
            <View style={[styles.iconFrame, { backgroundColor: "#FDF2E9" }]}>
              <Ionicons name="fast-food-outline" size={18} color="#E67E22" />
            </View>
            <Text style={styles.catName}>Food & Dining</Text>
            <Text style={styles.catAmount}>$602.40</Text>
            <Text style={styles.catPercent}>28%</Text>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressBar,
                  { width: "28%", backgroundColor: "#E67E22" },
                ]}
              />
            </View>
          </View>

          <View style={styles.categoryCard}>
            <View style={[styles.iconFrame, { backgroundColor: "#F4ECF7" }]}>
              <Ionicons name="car-outline" size={18} color="#8E44AD" />
            </View>
            <Text style={styles.catName}>Transport</Text>
            <Text style={styles.catAmount}>$430.20</Text>
            <Text style={styles.catPercent}>20%</Text>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressBar,
                  { width: "20%", backgroundColor: "#8E44AD" },
                ]}
              />
            </View>
          </View>

          <View style={styles.categoryCard}>
            <View style={[styles.iconFrame, { backgroundColor: "#FDEDEC" }]}>
              <Ionicons name="bag-handle-outline" size={18} color="#E74C3C" />
            </View>
            <Text style={styles.catName}>Shopping</Text>
            <Text style={styles.catAmount}>$387.60</Text>
            <Text style={styles.catPercent}>18%</Text>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressBar,
                  { width: "18%", backgroundColor: "#E74C3C" },
                ]}
              />
            </View>
          </View>
        </ScrollView>

        {/* --- TRANSACTION HISTORY SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity style={styles.sortDropdown}>
            <Text style={styles.sortDropdownText}>
              Sort by:{" "}
              <Text style={{ fontWeight: "600", color: "#1A1A1A" }}>
                Latest
              </Text>
            </Text>
            <Ionicons name="chevron-down" size={12} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.dateGroupHeader}>Today</Text>
        <View style={styles.txRow}>
          <View style={[styles.txIconBox, { backgroundColor: "#E8F8F5" }]}>
            <Ionicons name="logo-buffer" size={18} color="#1ABC9C" />
          </View>
          <View style={styles.txDetails}>
            <Text style={styles.txTitle}>Starbucks</Text>
            <Text style={styles.txSub}>Food & Dining • Today, 9:21 AM</Text>
          </View>
          <View style={styles.txAmountBox}>
            <Text style={styles.txAmount}>-$5.20</Text>
            <Text style={styles.txMethod}>Card</Text>
          </View>
          <Ionicons
            name="ellipsis-vertical"
            size={14}
            color="#BBB"
            style={{ marginLeft: 8 }}
          />
        </View>

        <View style={styles.txRow}>
          <View style={[styles.txIconBox, { backgroundColor: "#F4F6F7" }]}>
            <FontAwesome6 name="uber" size={16} color="#1A1A1A" />
          </View>
          <View style={styles.txDetails}>
            <Text style={styles.txTitle}>Uber</Text>
            <Text style={styles.txSub}>Transport • Today, 8:15 AM</Text>
          </View>
          <View style={styles.txAmountBox}>
            <Text style={styles.txAmount}>-$18.40</Text>
            <Text style={styles.txMethod}>Card</Text>
          </View>
          <Ionicons
            name="ellipsis-vertical"
            size={14}
            color="#BBB"
            style={{ marginLeft: 8 }}
          />
        </View>

        <View style={styles.swipeBanner}>
          <View style={styles.swipeBannerLeft}>
            <MaterialCommunityIcons
              name="gesture-swipe-left"
              size={18}
              color="#4A4A4A"
            />
            <Text style={styles.swipeBannerText}>
              Swipe left to edit or categorize{"\n"}
              <Text style={{ color: "#888" }}>Swipe right to delete</Text>
            </Text>
          </View>
          <View style={styles.swipeBannerActions}>
            <View style={styles.swipeEditButton}>
              <Ionicons name="pencil" size={14} color="#A04000" />
            </View>
            <View style={styles.swipeDeleteButton}>
              <Ionicons name="trash-outline" size={14} color="#C0392B" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- DRAGGABLE PURPLE ACTION BUTTON (FAB) --- */}
      <Animated.View
        style={[styles.fabWrapper, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => router.push("/add-expense" as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* --- STICKY FOOTER NAVIGATION --- */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/")}
        >
          <Ionicons name="home-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/expenses")}
        >
          <Ionicons name="document-text-sharp" size={22} color="#4B2C40" />
          <Text style={[styles.footerText, styles.activeFooterText]}>
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/budget")}
        >
          <Ionicons name="wallet-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Budget</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/analytics")}
        >
          <Ionicons name="bar-chart-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/more")}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#666666" />
          <Text style={styles.footerText}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },
  headerSpacer: {
    width: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    justifyContent: "flex-end",
  },
  iconButton: {
    marginLeft: 14,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#4B2C40",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    paddingLeft: 16,
    marginTop: 14,
    marginBottom: 6,
  },
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  filterBadgeText: {
    fontSize: 12,
    color: "#4A4A4A",
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
    marginRight: 24,
  },
  resetButtonText: {
    fontSize: 12,
    color: "#E74C3C",
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginVertical: 4,
  },
  summaryTrend: {
    fontSize: 12,
    color: "#27AE60",
    fontWeight: "500",
  },
  monthDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  monthDropdownText: {
    fontSize: 12,
    color: "#4A4A4A",
    fontWeight: "500",
  },
  sparklinePlaceholder: {
    height: 60,
    justifyContent: "center",
    marginVertical: 12,
  },
  sparklineCurve: {
    height: 2,
    backgroundColor: "#4B2C40",
    opacity: 0.2,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#FAFAFA",
    paddingTop: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: "#888",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginVertical: 2,
  },
  metricSubText: {
    fontSize: 9,
    color: "#AAA",
  },
  metricDivider: {
    width: 1,
    backgroundColor: "#EAEAEA",
    marginHorizontal: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  viewAllText: {
    fontSize: 12,
    color: "#666",
  },
  categoriesRow: {
    paddingLeft: 16,
    flexDirection: "row",
  },
  categoryCard: {
    width: 110,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconFrame: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  catName: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  catAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 2,
  },
  catPercent: {
    fontSize: 10,
    color: "#AAA",
    marginTop: 4,
  },
  progressBg: {
    height: 3,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginTop: 4,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  sortDropdown: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortDropdownText: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  dateGroupHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  txRow: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FAFADA",
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  txDetails: {
    flex: 1,
    marginLeft: 12,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  txSub: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  txAmountBox: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  txMethod: {
    fontSize: 10,
    color: "#AAA",
    marginTop: 2,
  },
  swipeBanner: {
    flexDirection: "row",
    backgroundColor: "#FDF6F0",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#FAEBD7",
  },
  swipeBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  swipeBannerText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#4A4A4A",
    marginLeft: 10,
    lineHeight: 14,
  },
  swipeBannerActions: {
    flexDirection: "row",
  },
  swipeEditButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#F5EBDF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  swipeDeleteButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#FADBD8",
    alignItems: "center",
    justifyContent: "center",
  },
  /* --- RECONFIGURED FAB AND WRAPPER FOR DRAGGING --- */
  fabWrapper: {
    position: "absolute",
    bottom: 90,
    right: 16,
    zIndex: 999, // Floating absolute layout hierarchy layer
  },
  fabButton: {
    backgroundColor: "#4B2C40", // Preserved your designated deep purple signature tone
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
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
    borderTopColor: "#EAEAEA",
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
    color: "#666666",
    marginTop: 4,
    fontWeight: "500",
  },
  activeFooterText: {
    color: "#4B2C40",
    fontWeight: "600",
  },
});
