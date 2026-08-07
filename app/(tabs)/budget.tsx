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
        {/* Header Section */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Budget</Text>
              <Text style={styles.headerSubtitle}>
                Stay on track. Build your future.
              </Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#1A1A1A"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="headset-outline" size={20} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dark Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryLabel}>Monthly Budget</Text>
              <Text style={styles.summaryAmount}>$2,158</Text>
              <Text style={styles.summarySubAmount}>of $5,000</Text>
            </View>
            <View style={styles.ringContainer}>
              <View style={styles.ringOuter}>
                <View style={styles.ringInner}>
                  <Text style={styles.ringPercent}>43%</Text>
                  <Text style={styles.ringSubText}>remaining</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardProgressBarBg}>
            <View style={styles.cardProgressBarFill} />
          </View>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
              >
                <Ionicons name="briefcase-outline" size={14} color="#FFF" />
              </View>
              <View>
                <Text style={styles.summaryStatTitle}>Total Budget</Text>
                <Text style={styles.summaryStatValue}>$5,000</Text>
              </View>
            </View>

            <View style={styles.summaryStatDivider} />

            <View style={styles.summaryStatItem}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: "rgba(234,88,12,0.2)" },
                ]}
              >
                <Ionicons name="trending-up" size={14} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.summaryStatTitle}>Spent</Text>
                <Text style={styles.summaryStatValue}>$2,158</Text>
              </View>
            </View>

            <View style={styles.summaryStatDivider} />

            <View style={styles.summaryStatItem}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: "rgba(5,150,105,0.2)" },
                ]}
              >
                <Ionicons name="arrow-up" size={14} color="#34D399" />
              </View>
              <View>
                <Text style={styles.summaryStatTitle}>Remaining</Text>
                <Text style={[styles.summaryStatValue, { color: "#34D399" }]}>
                  $2,842
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Budget Categories Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/add-budget" as any)}
          >
            <Ionicons name="add" size={14} color="#7C3AED" />
            <Text style={styles.addButtonText}>Add Budget</Text>
          </TouchableOpacity>
        </View>

        {/* Category Item 1: Food & Dining */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryRow}>
            <View
              style={[styles.catIconContainer, { backgroundColor: "#FFF7ED" }]}
            >
              <Ionicons name="fast-food-outline" size={18} color="#EA580C" />
            </View>
            <View style={styles.catInfo}>
              <Text style={styles.catName}>Food & Dining</Text>
              <Text style={styles.catDetailsText}>
                <Text style={styles.catSpentText}>$602</Text> of $800
              </Text>
            </View>
            <View style={styles.catRightGroup}>
              <Text style={[styles.catPercentText, { color: "#D97706" }]}>
                75%
              </Text>
              <View style={styles.statusBadgeNear}>
                <Text style={styles.statusBadgeTextNear}>Near limit</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.menuDots}>
              <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: "75%", backgroundColor: "#EA580C" },
              ]}
            />
          </View>
        </View>

        {/* Category Item 2: Transport */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryRow}>
            <View
              style={[styles.catIconContainer, { backgroundColor: "#EEF2FF" }]}
            >
              <Ionicons name="car-outline" size={18} color="#4F46E5" />
            </View>
            <View style={styles.catInfo}>
              <Text style={styles.catName}>Transport</Text>
              <Text style={styles.catDetailsText}>
                <Text style={styles.catSpentText}>$430</Text> of $700
              </Text>
            </View>
            <View style={styles.catRightGroup}>
              <Text style={[styles.catPercentText, { color: "#4F46E5" }]}>
                61%
              </Text>
              <View style={styles.statusBadgeTrack}>
                <Text style={styles.statusBadgeTextTrack}>On track</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.menuDots}>
              <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: "61%", backgroundColor: "#7C3AED" },
              ]}
            />
          </View>
        </View>

        {/* Category Item 3: Shopping */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryRow}>
            <View
              style={[styles.catIconContainer, { backgroundColor: "#FDF2F8" }]}
            >
              <Ionicons name="bag-handle-outline" size={18} color="#DB2777" />
            </View>
            <View style={styles.catInfo}>
              <Text style={styles.catName}>Shopping</Text>
              <Text style={styles.catDetailsText}>
                <Text style={styles.catSpentText}>$387</Text> of $300
              </Text>
            </View>
            <View style={styles.catRightGroup}>
              <Text style={[styles.catPercentText, { color: "#DC2626" }]}>
                129%
              </Text>
              <View style={styles.statusBadgeExceeded}>
                <Text style={styles.statusBadgeTextExceeded}>Exceeded</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.menuDots}>
              <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: "100%", backgroundColor: "#DC2626" },
              ]}
            />
          </View>
        </View>

        {/* Savings Goals Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/add-savings" as any)}
          >
            <Ionicons name="add" size={14} color="#7C3AED" />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Goal Item 1 */}
        <View style={styles.goalCard}>
          <View
            style={[styles.catIconContainer, { backgroundColor: "#F3E8FF" }]}
          >
            <Ionicons name="gift-outline" size={18} color="#7C3AED" />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.catName}>Tim's Birthday</Text>
            <Text style={styles.goalSubText}>Saved $120 of $300</Text>
            <View style={[styles.progressBarBg, { marginTop: 6 }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: "40%", backgroundColor: "#7C3AED" },
                ]}
              />
            </View>
          </View>
          <Text style={styles.goalPercent}>40%</Text>
          <TouchableOpacity style={styles.menuDots}>
            <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Goal Item 2 */}
        <View style={styles.goalCard}>
          <View
            style={[styles.catIconContainer, { backgroundColor: "#FDF2F8" }]}
          >
            <Ionicons name="flash-outline" size={18} color="#DB2777" />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.catName}>December Party</Text>
            <Text style={styles.goalSubText}>Saved $450 of $800</Text>
            <View style={[styles.progressBarBg, { marginTop: 6 }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: "56%", backgroundColor: "#7C3AED" },
                ]}
              />
            </View>
          </View>
          <Text style={styles.goalPercent}>56%</Text>
          <TouchableOpacity style={styles.menuDots}>
            <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Goal Item 3 */}
        <View style={styles.goalCard}>
          <View
            style={[styles.catIconContainer, { backgroundColor: "#ECFDF5" }]}
          >
            <Ionicons name="sparkles-outline" size={18} color="#059669" />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.catName}>Plastic Surgery</Text>
            <Text style={styles.goalSubText}>Saved $850 of $2,000</Text>
            <View style={[styles.progressBarBg, { marginTop: 6 }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: "43%", backgroundColor: "#7C3AED" },
                ]}
              />
            </View>
          </View>
          <Text style={styles.goalPercent}>43%</Text>
          <TouchableOpacity style={styles.menuDots}>
            <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Ajo Community Card */}
        <View style={styles.ajoCard}>
          <View style={styles.ajoLeftContent}>
            <Text style={styles.ajoTitle}>Ajo</Text>
            <Text style={styles.ajoSubtitle}>Save with family and friends</Text>
            <Text style={styles.ajoDesc}>
              Reach your goals faster together.
            </Text>
            <TouchableOpacity style={styles.ajoButton}>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#2B143D",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#D1D5DB",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summarySubAmount: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  ringContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  ringOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 8,
    borderColor: "#4C2863",
    borderTopColor: "#A855F7",
    borderRightColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center",
  },
  ringInner: {
    alignItems: "center",
  },
  ringPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  ringSubText: {
    fontSize: 9,
    color: "#9CA3AF",
  },
  cardProgressBarBg: {
    height: 6,
    backgroundColor: "#4C2863",
    borderRadius: 3,
    width: "100%",
    marginBottom: 20,
    overflow: "hidden",
  },
  cardProgressBarFill: {
    height: "100%",
    backgroundColor: "#A855F7",
    width: "43%",
    borderRadius: 3,
  },
  summaryStatsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 14,
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  summaryStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 4,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryStatTitle: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  summaryStatValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  catIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  catDetailsText: {
    fontSize: 12,
    color: "#6B7280",
  },
  catSpentText: {
    fontWeight: "700",
    color: "#111827",
  },
  catRightGroup: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  catPercentText: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  statusBadgeNear: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeTextNear: {
    fontSize: 9,
    fontWeight: "600",
    color: "#D97706",
  },
  statusBadgeTrack: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeTextTrack: {
    fontSize: 9,
    fontWeight: "600",
    color: "#059669",
  },
  statusBadgeExceeded: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeTextExceeded: {
    fontSize: 9,
    fontWeight: "600",
    color: "#DC2626",
  },
  menuDots: {
    padding: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  goalInfo: {
    flex: 1,
    marginRight: 10,
  },
  goalSubText: {
    fontSize: 11,
    color: "#6B7280",
  },
  goalPercent: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginRight: 8,
  },
  ajoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    alignItems: "center",
  },
  ajoLeftContent: {
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
  ajoDesc: {
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
    width: 130,
    height: 90,
    justifyContent: "center",
    alignItems: "flex-end",
    overflow: "visible",
  },
  ajoImage: {
    width: 160,
    height: 350,
  },
});
