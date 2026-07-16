import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BudgetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* --- TOP NAVIGATION BAR --- */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Budget</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings" as any)}
        >
          <Ionicons name="settings-outline" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- BUDGET OVERVIEW CARD --- */}
        <View style={styles.overviewCard}>
          <Text style={styles.usageLabel}>You&apos;ve used</Text>
          <View style={styles.usageRow}>
            <Text style={styles.usageMainAmount}>
              $2,158{" "}
              <Text style={styles.usageSubAmount}>of your $5,000 budget</Text>
            </Text>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>43%</Text>
              <Text style={styles.percentageSub}>remaining</Text>
            </View>
          </View>

          {/* Master Progress Bar */}
          <View style={styles.masterProgressBg}>
            <View style={[styles.masterProgressBar, { width: "43%" }]} />
          </View>

          {/* Metrics Breakdowns */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <View
                style={[styles.metricIconBox, { backgroundColor: "#F9F3F6" }]}
              >
                <Ionicons name="briefcase-outline" size={14} color="#4B2C40" />
              </View>
              <View>
                <Text style={styles.metricItemLabel}>Total Budget</Text>
                <Text style={styles.metricItemValue}>$5,000</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <View
                style={[styles.metricIconBox, { backgroundColor: "#F5EEF0" }]}
              >
                <MaterialCommunityIcons
                  name="arrow-top-right"
                  size={14}
                  color="#A04000"
                />
              </View>
              <View>
                <Text style={styles.metricItemLabel}>Spent</Text>
                <Text style={styles.metricItemValue}>$2,158</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <View
                style={[styles.metricIconBox, { backgroundColor: "#EBF5FB" }]}
              >
                <Ionicons name="arrow-up-outline" size={14} color="#27AE60" />
              </View>
              <View>
                <Text style={styles.metricItemLabel}>Remaining</Text>
                <Text style={[styles.metricItemValue, { color: "#27AE60" }]}>
                  $2,842
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- BUDGET CATEGORIES SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          <TouchableOpacity style={styles.addSectionButton}>
            <Ionicons name="add-circle" size={16} color="#4B2C40" />
            <Text style={styles.addSectionText}>Add Budget</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalRow}
        >
          {/* Food & Dining */}
          <View style={styles.categoryCard}>
            <View style={styles.cardTopRow}>
              <View
                style={[styles.catIconFrame, { backgroundColor: "#FEF5ED" }]}
              >
                <Ionicons name="fast-food-outline" size={16} color="#E67E22" />
              </View>
              <Ionicons name="ellipsis-vertical" size={14} color="#BBB" />
            </View>
            <Text style={styles.catName}>Food & Dining</Text>
            <Text style={styles.catSplit}>
              $602 <Text style={styles.catTotal}>/ $800</Text>
            </Text>
            <View style={styles.catProgressBg}>
              <View
                style={[
                  styles.catProgressBar,
                  { width: "75%", backgroundColor: "#E67E22" },
                ]}
              />
            </View>
            <View style={styles.cardStatusRow}>
              <Text style={styles.cardStatusPercent}>75%</Text>
              <View style={styles.statusDotRow}>
                <View
                  style={[styles.statusDot, { backgroundColor: "#F39C12" }]}
                />
                <Text style={styles.statusDotText}>Near limit</Text>
              </View>
            </View>
          </View>

          {/* Transport */}
          <View style={styles.categoryCard}>
            <View style={styles.cardTopRow}>
              <View
                style={[styles.catIconFrame, { backgroundColor: "#F5EEF8" }]}
              >
                <Ionicons name="car-outline" size={16} color="#8E44AD" />
              </View>
              <Ionicons name="ellipsis-vertical" size={14} color="#BBB" />
            </View>
            <Text style={styles.catName}>Transport</Text>
            <Text style={styles.catSplit}>
              $430 <Text style={styles.catTotal}>/ $700</Text>
            </Text>
            <View style={styles.catProgressBg}>
              <View
                style={[
                  styles.catProgressBar,
                  { width: "61%", backgroundColor: "#8E44AD" },
                ]}
              />
            </View>
            <View style={styles.cardStatusRow}>
              <Text style={styles.cardStatusPercent}>61%</Text>
              <View style={styles.statusDotRow}>
                <View
                  style={[styles.statusDot, { backgroundColor: "#2ECC71" }]}
                />
                <Text style={styles.statusDotText}>On track</Text>
              </View>
            </View>
          </View>

          {/* Shopping */}
          <View style={styles.categoryCard}>
            <View style={styles.cardTopRow}>
              <View
                style={[styles.catIconFrame, { backgroundColor: "#FDEDEC" }]}
              >
                <Ionicons name="bag-handle-outline" size={16} color="#E74C3C" />
              </View>
              <Ionicons name="ellipsis-vertical" size={14} color="#BBB" />
            </View>
            <Text style={styles.catName}>Shopping</Text>
            <Text style={styles.catSplit}>
              $387 <Text style={styles.catTotal}>/ $300</Text>
            </Text>
            <View style={styles.catProgressBg}>
              <View
                style={[
                  styles.catProgressBar,
                  { width: "100%", backgroundColor: "#E74C3C" },
                ]}
              />
            </View>
            <View style={styles.cardStatusRow}>
              <Text style={styles.cardStatusPercent}>129%</Text>
              <View style={styles.statusDotRow}>
                <View
                  style={[styles.statusDot, { backgroundColor: "#E74C3C" }]}
                />
                <Text style={[styles.statusDotText, { color: "#E74C3C" }]}>
                  Exceeded
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* --- SAVINGS GOALS SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <TouchableOpacity style={styles.addSectionButton}>
            <Ionicons name="add-circle" size={16} color="#4B2C40" />
            <Text style={styles.addSectionText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goalsContainer}>
          {/* Goal 1 */}
          <View style={styles.goalRow}>
            <View style={[styles.goalIconBox, { backgroundColor: "#F4ECF7" }]}>
              <Ionicons name="gift-outline" size={18} color="#8E44AD" />
            </View>
            <View style={styles.goalMainInfo}>
              <Text style={styles.goalTitle}>Tim&apos;s Birthday</Text>
              <Text style={styles.goalSub}>Saved $120 of $300</Text>
            </View>
            <View style={styles.goalProgressContainer}>
              <View style={styles.goalProgressBg}>
                <View
                  style={[
                    styles.goalProgressBar,
                    { width: "40%", backgroundColor: "#4B2C40" },
                  ]}
                />
              </View>
              <Text style={styles.goalPercentText}>40%</Text>
            </View>
            <Ionicons
              name="ellipsis-vertical"
              size={14}
              color="#BBB"
              style={{ marginLeft: 8 }}
            />
          </View>

          {/* Goal 2 */}
          <View style={styles.goalRow}>
            <View style={[styles.goalIconBox, { backgroundColor: "#FDEDEC" }]}>
              <Ionicons name="wine-outline" size={18} color="#E74C3C" />
            </View>
            <View style={styles.goalMainInfo}>
              <Text style={styles.goalTitle}>December Party</Text>
              <Text style={styles.goalSub}>Saved $450 of $800</Text>
            </View>
            <View style={styles.goalProgressContainer}>
              <View style={styles.goalProgressBg}>
                <View
                  style={[
                    styles.goalProgressBar,
                    { width: "56%", backgroundColor: "#4B2C40" },
                  ]}
                />
              </View>
              <Text style={styles.goalPercentText}>56%</Text>
            </View>
            <Ionicons
              name="ellipsis-vertical"
              size={14}
              color="#BBB"
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.viewAllGoalsButton}>
          <Text style={styles.viewAllGoalsText}>View all savings goals</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color="#666"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* --- AJO PROMOTIONAL PANEL --- */}
        <View style={styles.ajoCard}>
          <View style={styles.ajoLeftColumn}>
            <Text style={styles.ajoTitle}>Ajo</Text>
            <Text style={styles.ajoSubtitle}>Save with family and friends</Text>
            <Text style={styles.ajoDescription}>
              Pool money together, stay consistent and achieve your goals
              faster.
            </Text>
            <TouchableOpacity
              style={styles.ajoButton}
              onPress={() => router.push("/ajo" as any)}
            >
              <Text style={styles.ajoButtonText}>Start an Ajo</Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color="#FFF"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>

          {/* Custom Illustration Placement Placeholder matches design context asset */}
          <View style={styles.ajoImageContainer}>
            <View style={styles.circleAvatarGroupPlaceholder} />
          </View>
        </View>
      </ScrollView>

      {/* --- GLOBAL RESPONSIVE FOOTER NAVIGATION --- */}
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
          onPress={() => router.replace("/expenses")}
        >
          <Ionicons name="document-text-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Expenses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/budget")}
        >
          <Ionicons name="wallet-sharp" size={22} color="#4B2C40" />
          <Text style={[styles.footerText, styles.activeFooterText]}>
            Budget
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/analytics")}
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
    paddingBottom: 110,
  },
  /* Top Nav Styling */
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  settingsButton: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  /* Overview Card */
  overviewCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  usageLabel: {
    fontSize: 12,
    color: "#888",
  },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  usageMainAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  usageSubAmount: {
    fontSize: 13,
    fontWeight: "400",
    color: "#666",
  },
  percentageBadge: {
    backgroundColor: "#F2EFEF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  percentageText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  percentageSub: {
    fontSize: 9,
    color: "#888",
  },
  masterProgressBg: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    marginTop: 16,
    overflow: "hidden",
  },
  masterProgressBar: {
    height: "100%",
    backgroundColor: "#4B2C40",
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#FAFAFA",
    paddingTop: 14,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  metricItemLabel: {
    fontSize: 10,
    color: "#888",
  },
  metricItemValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 1,
  },
  /* Section Layouts */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  addSectionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addSectionText: {
    fontSize: 12,
    color: "#4B2C40",
    fontWeight: "600",
    marginLeft: 4,
  },
  horizontalRow: {
    paddingLeft: 16,
    flexDirection: "row",
  },
  categoryCard: {
    width: 135,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  catIconFrame: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  catSplit: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 4,
  },
  catTotal: {
    fontSize: 11,
    fontWeight: "400",
    color: "#999",
  },
  catProgressBg: {
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginTop: 10,
  },
  catProgressBar: {
    height: "100%",
    borderRadius: 2,
  },
  cardStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  cardStatusPercent: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
  },
  statusDotRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  /* Savings Goals Architecture */
  goalsContainer: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FDFDFD",
  },
  goalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  goalMainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  goalSub: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  goalProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 90,
    justifyContent: "flex-end",
  },
  goalProgressBg: {
    width: 50,
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginRight: 8,
  },
  goalProgressBar: {
    height: "100%",
    borderRadius: 2,
  },
  goalPercentText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4A4A4A",
    width: 26,
    textAlign: "right",
  },
  viewAllGoalsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllGoalsText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  /* Ajo Promotional Banner */
  ajoCard: {
    backgroundColor: "#F6F3F5",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EFEAEF",
  },
  ajoLeftColumn: {
    flex: 0.65,
  },
  ajoTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  ajoSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 2,
  },
  ajoDescription: {
    fontSize: 11,
    color: "#666",
    marginTop: 6,
    lineHeight: 15,
  },
  ajoButton: {
    backgroundColor: "#4B2C40",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginTop: 14,
  },
  ajoButtonText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  ajoImageContainer: {
    flex: 0.35,
    alignItems: "center",
    justifyContent: "center",
  },
  circleAvatarGroupPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#E5DCE2", // Abstract backing mockup for layered vector/PNG group
  },
  /* Sticky Navigation Footer */
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
