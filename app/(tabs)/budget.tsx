import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BudgetScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Month");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
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
              <View style={styles.budgetCardActionIcon}>
                <Ionicons name="add" size={16} color="#624B6A" />
              </View>
              <Text style={styles.budgetCardActionText}>Add budget</Text>
            </TouchableOpacity>
            <View style={styles.budgetPercent}>
              <Text style={styles.budgetPercentValue}>43%</Text>
              <Text style={styles.budgetPercentLabel}>left</Text>
            </View>
            <Text style={styles.budgetCardAmount}>
              $2,842<Text style={styles.budgetCardSubAmount}> remaining</Text>
            </Text>
            <Text style={styles.budgetCardHelper}>
              $2,158 spent from your $5,000 monthly budget
            </Text>
            <View style={styles.budgetProgressTrack}>
              <View style={styles.budgetProgressFill} />
            </View>
          </View>
        </View>

        {/* Budget Categories Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          <TouchableOpacity style={styles.addSectionButton}>
            <View style={styles.addSectionIcon}>
              <Ionicons name="add" size={13} color="#624B6A" />
            </View>
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
              $602 <Text style={styles.catTotal}>/ $800</Text>
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
              $430 <Text style={styles.catTotal}>/ $700</Text>
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
              $387 <Text style={styles.catTotal}>/ $300</Text>
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
            <View style={styles.addSectionIcon}>
              <Ionicons name="add" size={13} color="#624B6A" />
            </View>
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
              <Text style={styles.ajoButtonText}>Start Ajo</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.ajoIllustrationContainer}>
            <Image
              source={require("../../assets/images/ajo-removebg-preview.png")}
              style={styles.ajoImage}
              resizeMode="contain"
            />
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
    backgroundColor: "#FFFEFF",
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
    marginBottom: 20,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
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
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: 220,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  catIconFrame: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  catName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  catSplit: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  catTotal: {
    color: "#9CA3AF",
  },
  catProgressBg: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
    marginBottom: 8,
  },
  catProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  cardStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardStatusPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
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
    fontSize: 11,
    color: "#6B7280",
  },
  goalsContainer: {
    gap: 10,
  },
  goalRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  goalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  goalMainInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  goalSub: {
    fontSize: 11,
    color: "#6B7280",
  },
  goalProgressContainer: {
    width: 80,
    alignItems: "flex-end",
  },
  goalProgressBg: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
    marginBottom: 4,
  },
  goalProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  goalPercentText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
  viewAllGoalsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllGoalsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  ajoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    alignItems: "center",
  },
  ajoLeftColumn: {
    flex: 1,
  },
  ajoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  ajoSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 4,
  },
  ajoDescription: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 14,
  },
  ajoButton: {
    backgroundColor: "#2B143D",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  ajoButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ajoIllustrationContainer: {
    width: 100,
    height: 90,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  ajoImage: {
    width: 120,
    height: 120,
  },
});
