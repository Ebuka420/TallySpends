import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";

export default function BudgetScreen() {
  const router = useRouter();
  const { themePreference } = useAppStore();

  const colorScheme = useColorScheme() || "light";
  const theme = getThemePalette(themePreference, colorScheme);

  const isDark = colorScheme === "dark";

  const colors = {
    background: theme.background,
    surface: theme.surface,
    border: theme.border,
    textPrimary: theme.textPrimary,
    textSecondary: isDark ? "#AAA3A8" : "#6B7280",
    textMuted: isDark ? "#858087" : "#9CA3AF",
    accent: theme.accent,

    softAccent: isDark ? "#342630" : "#F3EBF1",
    softNeutral: isDark ? "#292729" : "#F3F4F6",
    softBorder: isDark ? "#353136" : "#F3F4F6",
    white: isDark ? "#211E21" : "#FFFFFF",

    categoryFood: isDark ? "#D5A47E" : "#4B2C40",
    categoryFoodSoft: isDark ? "#382D29" : "#F3EBF1",

    categoryTransport: isDark ? "#B99AC8" : "#6C4C7A",
    categoryTransportSoft: isDark ? "#302936" : "#EEE4F0",

    categoryShopping: isDark ? "#C3A6CF" : "#8B6599",
    categoryShoppingSoft: isDark ? "#332B36" : "#F7F0F8",

    goalGift: isDark ? "#C89BE0" : "#8E44AD",
    goalGiftSoft: isDark ? "#342A3A" : "#F4ECF7",

    goalParty: isDark ? "#F18E82" : "#E74C3C",
    goalPartySoft: isDark ? "#3A2928" : "#FDEDEC",

    status: isDark ? "#B998C5" : "#8B6599",
    danger: isDark ? "#E38A80" : "#6C4C7A",
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text
            style={[
              styles.pageTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            Budget
          </Text>
        </View>

        {/* Monthly Budget */}
        <View
          style={[
            styles.budgetCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.budgetCardTop}>
            <View>
              <Text
                style={[
                  styles.budgetCardLabel,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Monthly budget
              </Text>

              <Text
                style={[
                  styles.budgetCardTitle,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                April plan
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.budgetCardAction,
                {
                  backgroundColor: colors.softAccent,
                },
              ]}
            >
              <View
                style={[
                  styles.budgetCardActionIcon,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="add" size={16} color={colors.accent} />
              </View>

              <Text
                style={[
                  styles.budgetCardActionText,
                  {
                    color: colors.accent,
                  },
                ]}
              >
                Add budget
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.budgetPercent,
              {
                backgroundColor: colors.softAccent,
              },
            ]}
          >
            <Text
              style={[
                styles.budgetPercentValue,
                {
                  color: colors.accent,
                },
              ]}
            >
              43%
            </Text>

            <Text
              style={[
                styles.budgetPercentLabel,
                {
                  color: colors.accent,
                },
              ]}
            >
              left
            </Text>
          </View>

          <Text
            style={[
              styles.budgetCardAmount,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            ₦2,842
            <Text
              style={[
                styles.budgetCardSubAmount,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {" "}
              remaining
            </Text>
          </Text>

          <Text
            style={[
              styles.budgetCardHelper,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            ₦2,158 spent from your ₦5,000 monthly budget
          </Text>

          <View
            style={[
              styles.budgetProgressTrack,
              {
                backgroundColor: isDark ? "#343034" : "#F3F4F6",
              },
            ]}
          >
            <View
              style={[
                styles.budgetProgressFill,
                {
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
        </View>

        {/* Budget Categories */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            Budget Categories
          </Text>

          <TouchableOpacity
            style={[
              styles.addSectionButton,
              {
                backgroundColor: colors.softNeutral,
              },
            ]}
          >
            <View
              style={[
                styles.addSectionIcon,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="add" size={13} color={colors.accent} />
            </View>

            <Text
              style={[
                styles.addSectionText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Add budget
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalRow}
        >
          {/* Food & Dining */}
          <View
            style={[
              styles.categoryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.softBorder,
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.catIconFrame,
                  {
                    backgroundColor: colors.categoryFoodSoft,
                  },
                ]}
              >
                <Ionicons
                  name="fast-food-outline"
                  size={16}
                  color={colors.categoryFood}
                />
              </View>

              <Ionicons
                name="ellipsis-vertical"
                size={14}
                color={colors.textMuted}
              />
            </View>

            <Text
              style={[
                styles.catName,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              Food & Dining
            </Text>

            <Text
              style={[
                styles.catSplit,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              ₦602{" "}
              <Text
                style={[
                  styles.catTotal,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                / ₦800
              </Text>
            </Text>

            <View
              style={[
                styles.catProgressBg,
                {
                  backgroundColor: isDark ? "#343034" : "#F3F4F6",
                },
              ]}
            >
              <View
                style={[
                  styles.catProgressBar,
                  {
                    width: "75%",
                    backgroundColor: colors.categoryFood,
                  },
                ]}
              />
            </View>

            <View style={styles.cardStatusRow}>
              <Text
                style={[
                  styles.cardStatusPercent,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                75%
              </Text>

              <View style={styles.statusDotRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: colors.status,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusDotText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Near limit
                </Text>
              </View>
            </View>
          </View>

          {/* Transport */}
          <View
            style={[
              styles.categoryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.softBorder,
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.catIconFrame,
                  {
                    backgroundColor: colors.categoryTransportSoft,
                  },
                ]}
              >
                <Ionicons
                  name="car-outline"
                  size={16}
                  color={colors.categoryTransport}
                />
              </View>

              <Ionicons
                name="ellipsis-vertical"
                size={14}
                color={colors.textMuted}
              />
            </View>

            <Text
              style={[
                styles.catName,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              Transport
            </Text>

            <Text
              style={[
                styles.catSplit,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              ₦430{" "}
              <Text
                style={[
                  styles.catTotal,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                / ₦700
              </Text>
            </Text>

            <View
              style={[
                styles.catProgressBg,
                {
                  backgroundColor: isDark ? "#343034" : "#F3F4F6",
                },
              ]}
            >
              <View
                style={[
                  styles.catProgressBar,
                  {
                    width: "61%",
                    backgroundColor: colors.categoryTransport,
                  },
                ]}
              />
            </View>

            <View style={styles.cardStatusRow}>
              <Text
                style={[
                  styles.cardStatusPercent,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                61%
              </Text>

              <View style={styles.statusDotRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: colors.status,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusDotText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  On track
                </Text>
              </View>
            </View>
          </View>

          {/* Shopping */}
          <View
            style={[
              styles.categoryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.softBorder,
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.catIconFrame,
                  {
                    backgroundColor: colors.categoryShoppingSoft,
                  },
                ]}
              >
                <Ionicons
                  name="bag-handle-outline"
                  size={16}
                  color={colors.categoryShopping}
                />
              </View>

              <Ionicons
                name="ellipsis-vertical"
                size={14}
                color={colors.textMuted}
              />
            </View>

            <Text
              style={[
                styles.catName,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              Shopping
            </Text>

            <Text
              style={[
                styles.catSplit,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              ₦387{" "}
              <Text
                style={[
                  styles.catTotal,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                / ₦300
              </Text>
            </Text>

            <View
              style={[
                styles.catProgressBg,
                {
                  backgroundColor: isDark ? "#343034" : "#F3F4F6",
                },
              ]}
            >
              <View
                style={[
                  styles.catProgressBar,
                  {
                    width: "100%",
                    backgroundColor: colors.categoryShopping,
                  },
                ]}
              />
            </View>

            <View style={styles.cardStatusRow}>
              <Text
                style={[
                  styles.cardStatusPercent,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                129%
              </Text>

              <View style={styles.statusDotRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: colors.status,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusDotText,
                    {
                      color: colors.danger,
                    },
                  ]}
                >
                  Exceeded
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Savings Goals */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            Savings Goals
          </Text>

          <TouchableOpacity
            style={[
              styles.addSectionButton,
              {
                backgroundColor: colors.softNeutral,
              },
            ]}
          >
            <View
              style={[
                styles.addSectionIcon,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="add" size={13} color={colors.accent} />
            </View>

            <Text
              style={[
                styles.addSectionText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Add goal
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goalsContainer}>
          {/* Goal 1 */}
          <View
            style={[
              styles.goalRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.softBorder,
              },
            ]}
          >
            <View
              style={[
                styles.goalIconBox,
                {
                  backgroundColor: colors.goalGiftSoft,
                },
              ]}
            >
              <Ionicons name="gift-outline" size={18} color={colors.goalGift} />
            </View>

            <View style={styles.goalMainInfo}>
              <Text
                style={[
                  styles.goalTitle,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                Tim&apos;s Birthday
              </Text>

              <Text
                style={[
                  styles.goalSub,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Saved ₦120 of ₦300
              </Text>
            </View>

            <View style={styles.goalProgressContainer}>
              <View
                style={[
                  styles.goalProgressBg,
                  {
                    backgroundColor: isDark ? "#343034" : "#F3F4F6",
                  },
                ]}
              >
                <View
                  style={[
                    styles.goalProgressBar,
                    {
                      width: "40%",
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.goalPercentText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                40%
              </Text>
            </View>

            <Ionicons
              name="ellipsis-vertical"
              size={14}
              color={colors.textMuted}
              style={styles.goalMenuIcon}
            />
          </View>

          {/* Goal 2 */}
          <View
            style={[
              styles.goalRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.softBorder,
              },
            ]}
          >
            <View
              style={[
                styles.goalIconBox,
                {
                  backgroundColor: colors.goalPartySoft,
                },
              ]}
            >
              <Ionicons
                name="wine-outline"
                size={18}
                color={colors.goalParty}
              />
            </View>

            <View style={styles.goalMainInfo}>
              <Text
                style={[
                  styles.goalTitle,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                December Party
              </Text>

              <Text
                style={[
                  styles.goalSub,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Saved ₦450 of ₦800
              </Text>
            </View>

            <View style={styles.goalProgressContainer}>
              <View
                style={[
                  styles.goalProgressBg,
                  {
                    backgroundColor: isDark ? "#343034" : "#F3F4F6",
                  },
                ]}
              >
                <View
                  style={[
                    styles.goalProgressBar,
                    {
                      width: "56%",
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.goalPercentText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                56%
              </Text>
            </View>

            <Ionicons
              name="ellipsis-vertical"
              size={14}
              color={colors.textMuted}
              style={styles.goalMenuIcon}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.viewAllGoalsButton}>
          <Text
            style={[
              styles.viewAllGoalsText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            View all savings goals
          </Text>

          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.textSecondary}
            style={styles.viewAllGoalsIcon}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  pageHeader: {
    marginBottom: 18,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
  },

  budgetCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 22,
  },

  budgetCardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  budgetCardAction: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  budgetCardActionIcon: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    marginRight: 8,
    width: 28,
  },

  budgetCardActionText: {
    fontSize: 12,
    fontWeight: "700",
  },

  budgetCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  budgetCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  },

  budgetPercent: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginTop: 16,
  },

  budgetPercentValue: {
    fontSize: 14,
    fontWeight: "700",
    marginRight: 4,
  },

  budgetPercentLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  budgetCardAmount: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginTop: 18,
  },

  budgetCardSubAmount: {
    fontSize: 14,
    fontWeight: "500",
  },

  budgetCardHelper: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },

  budgetProgressTrack: {
    borderRadius: 4,
    height: 8,
    marginTop: 18,
    overflow: "hidden",
  },

  budgetProgressFill: {
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
  },

  addSectionButton: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    height: 38,
    paddingHorizontal: 12,
    justifyContent: "center",
  },

  addSectionIcon: {
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    marginRight: 8,
    width: 26,
  },

  addSectionText: {
    fontSize: 12,
    fontWeight: "700",
  },

  horizontalRow: {
    marginBottom: 16,
  },

  categoryCard: {
    borderRadius: 16,
    padding: 16,
    width: 220,
    marginRight: 12,
    borderWidth: 1,
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
    marginBottom: 4,
  },

  catSplit: {
    fontSize: 13,
    marginBottom: 8,
  },

  catTotal: {
    fontSize: 13,
  },

  catProgressBg: {
    height: 6,
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
  },

  statusDotRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusDotText: {
    fontSize: 11,
  },

  goalsContainer: {
    gap: 10,
  },

  goalRow: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
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
    marginBottom: 2,
  },

  goalSub: {
    fontSize: 11,
  },

  goalProgressContainer: {
    width: 80,
    alignItems: "flex-end",
  },

  goalProgressBg: {
    height: 6,
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
  },

  goalMenuIcon: {
    marginLeft: 8,
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
  },

  viewAllGoalsIcon: {
    marginLeft: 4,
  },
});
