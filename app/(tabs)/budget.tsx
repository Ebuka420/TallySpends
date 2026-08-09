import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
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
        <View style={styles.budgetCardStack}>
          <View style={styles.budgetCardBack} />
          <View style={styles.budgetCard}>
            <View style={styles.budgetCardTop}>
              <View>
                <Text style={styles.budgetCardLabel}>MONTHLY BUDGET</Text>
                <Text style={styles.budgetCardTitle}>April plan</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.budgetCardAction}>
              <View style={styles.budgetCardActionIcon}><Ionicons name="add" size={16} color="#624B6A" /></View>
              <Text style={styles.budgetCardActionText}>Add budget</Text>
            </TouchableOpacity>
            <View style={styles.budgetPercent}><Text style={styles.budgetPercentValue}>43%</Text><Text style={styles.budgetPercentLabel}>left</Text></View>
            <Text style={styles.budgetCardAmount}>₦2,842<Text style={styles.budgetCardSubAmount}> remaining</Text></Text>
            <Text style={styles.budgetCardHelper}>₦2,158 spent from your ₦5,000 monthly budget</Text>
            <View style={styles.budgetProgressTrack}><View style={styles.budgetProgressFill} /></View>
          </View>
        </View>

        {/* --- BUDGET CATEGORIES SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          <TouchableOpacity style={styles.addSectionButton}>
            <View style={styles.addSectionIcon}><Ionicons name="add" size={13} color="#624B6A" /></View>
            <Text style={styles.addSectionText}>Add budget</Text>
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
                style={[styles.catIconFrame, { backgroundColor: "#F3EBF1" }]}
              >
                <Ionicons name="fast-food-outline" size={16} color="#4B2C40" />
              </View>
              <Ionicons name="ellipsis-vertical" size={14} color="#BBB" />
            </View>
            <Text style={styles.catName}>Food & Dining</Text>
            <Text style={styles.catSplit}>
              ₦602 <Text style={styles.catTotal}>/ ₦800</Text>
            </Text>
            <View style={styles.catProgressBg}>
              <View
                style={[
                  styles.catProgressBar,
                  { width: "75%", backgroundColor: "#4B2C40" },
                ]}
              />
            </View>
            <View style={styles.cardStatusRow}>
              <Text style={styles.cardStatusPercent}>75%</Text>
              <View style={styles.statusDotRow}>
                <View
                  style={[styles.statusDot, { backgroundColor: "#8B6599" }]}
                />
                <Text style={styles.statusDotText}>Near limit</Text>
              </View>
            </View>
          </View>

          {/* Transport */}
          <View style={styles.categoryCard}>
            <View style={styles.cardTopRow}>
              <View
                style={[styles.catIconFrame, { backgroundColor: "#EEE4F0" }]}
              >
                <Ionicons name="car-outline" size={16} color="#6C4C7A" />
              </View>
              <Ionicons name="ellipsis-vertical" size={14} color="#BBB" />
            </View>
            <Text style={styles.catName}>Transport</Text>
            <Text style={styles.catSplit}>
              ₦430 <Text style={styles.catTotal}>/ ₦700</Text>
            </Text>
            <View style={styles.catProgressBg}>
              <View
                style={[
                  styles.catProgressBar,
                  { width: "61%", backgroundColor: "#6C4C7A" },
                ]}
              />
            </View>
            <View style={styles.cardStatusRow}>
              <Text style={styles.cardStatusPercent}>61%</Text>
              <View style={styles.statusDotRow}>
                <View
                  style={[styles.statusDot, { backgroundColor: "#8B6599" }]}
                />
                <Text style={styles.statusDotText}>On track</Text>
              </View>
            </View>
          </View>

          {/* Shopping */}
          <View style={styles.categoryCard}>
            <View style={styles.cardTopRow}>
              <View
                style={[styles.catIconFrame, { backgroundColor: "#F7F0F8" }]}
              >
                <Ionicons name="bag-handle-outline" size={16} color="#8B6599" />
              </View>
              <Ionicons name="ellipsis-vertical" size={14} color="#BBB" />
            </View>
            <Text style={styles.catName}>Shopping</Text>
            <Text style={styles.catSplit}>
              ₦387 <Text style={styles.catTotal}>/ ₦300</Text>
            </Text>
            <View style={styles.catProgressBg}>
              <View
                style={[
                  styles.catProgressBar,
                  { width: "100%", backgroundColor: "#8B6599" },
                ]}
              />
            </View>
            <View style={styles.cardStatusRow}>
              <Text style={styles.cardStatusPercent}>129%</Text>
              <View style={styles.statusDotRow}>
                <View
                  style={[styles.statusDot, { backgroundColor: "#8B6599" }]}
                />
                <Text style={[styles.statusDotText, { color: "#6C4C7A" }]}>
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
            <View style={styles.addSectionIcon}><Ionicons name="add" size={13} color="#624B6A" /></View>
            <Text style={styles.addSectionText}>Add goal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goalsContainer}>
          {/* Goal 1 */}
          <View style={styles.goalRow}>
            <View style={[styles.goalIconBox, { backgroundColor: "#F4ECF7" }]}>
              <Ionicons name="gift-outline" size={18} color="#8E44AD" />
            </View>
            <View style={styles.goalMainInfo}>
              <Text style={styles.goalTitle}>Tim's Birthday</Text>
              <Text style={styles.goalSub}>Saved ₦120 of ₦300</Text>
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
              <Text style={styles.goalSub}>Saved ₦450 of ₦800</Text>
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

          {/* Rendered Ajo Image Asset */}
          <View style={styles.ajoImageContainer}>
            <Image
              source={require("../../assets/images/ajo-removebg-preview.png")}
              style={styles.ajoImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFEFF",
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
    backgroundColor: "#FFFFFF",
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
  budgetCardStack: {
    marginHorizontal: 16,
    marginTop: 22,
    paddingTop: 12,
    position: "relative",
  },
  budgetCardBack: {
    backgroundColor: "#E9DFEC",
    borderRadius: 23,
    height: "100%",
    left: 10,
    opacity: 0.9,
    position: "absolute",
    right: 10,
    top: 0,
  },
  budgetCard: {
    backgroundColor: "#20142A",
    borderRadius: 23,
    minHeight: 226,
    overflow: "hidden",
    padding: 20,
  },
  budgetCardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  budgetCardAction: {
    alignItems: "center",
    backgroundColor: "#382440",
    borderBottomLeftRadius: 19,
    borderTopLeftRadius: 19,
    flexDirection: "row",
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 12,
    paddingTop: 6,
    position: "absolute",
    height: 38,
    right: -1,
    top: 17,
    width: 120,
  },
  budgetCardActionIcon: {
    alignItems: "center",
    backgroundColor: "#FDF9FE",
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    marginRight: 7,
    width: 26,
  },
  budgetCardActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  budgetCardLabel: {
    color: "#DCCFE2",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  budgetCardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
  },
  budgetPercent: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    right: 20,
    top: 96,
  },
  budgetPercentValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  budgetPercentLabel: {
    color: "#DCCFE2",
    fontSize: 9,
    marginTop: 1,
  },
  budgetCardAmount: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1.1,
    marginTop: 23,
  },
  budgetCardSubAmount: {
    color: "#DCCFE2",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0,
  },
  budgetCardHelper: {
    color: "#CDBED4",
    fontSize: 12,
    marginTop: 6,
  },
  budgetProgressTrack: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 4,
    height: 6,
    marginTop: 16,
    overflow: "hidden",
  },
  budgetProgressFill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    height: "100%",
    width: "57%",
  },
  addBudgetButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    bottom: 17,
    flexDirection: "row",
    paddingBottom: 6,
    paddingLeft: 7,
    paddingRight: 13,
    paddingTop: 6,
    position: "absolute",
  },
  addBudgetIcon: {
    alignItems: "center",
    backgroundColor: "#F0E6F2",
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    marginRight: 7,
    width: 26,
  },
  addBudgetButtonText: {
    color: "#20142A",
    fontSize: 12,
    fontWeight: "700",
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
    alignItems: "center",
    backgroundColor: "#20142A",
    borderRadius: 16,
    flexDirection: "row",
    height: 38,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 12,
    paddingTop: 6,
    width: 120,
  },
  addSectionIcon: {
    alignItems: "center",
    backgroundColor: "#FDF9FE",
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    marginRight: 7,
    width: 26,
  },
  addSectionText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
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
  ajoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
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
