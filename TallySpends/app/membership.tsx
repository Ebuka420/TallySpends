import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Mock data representing the list of features for each plan
const FREEMIUM_FEATURES = [
  { id: "1", text: "Expense Tracking", available: true },
  { id: "2", text: "Budget Management", available: true },
  { id: "3", text: "Analytics", available: true },
  { id: "4", text: "AI Insights", available: true },
  { id: "5", text: "Savings Goals", available: true },
  { id: "6", text: "Ajo", available: true },
  { id: "7", text: "Youngins", available: false },
  { id: "8", text: "Organization Accounts", available: false },
];

const MVP_FEATURES = [
  { id: "1", text: "Everything in Freemium", available: true },
  { id: "2", text: "Up to 6 Youngins", available: true },
  { id: "3", text: "Organization Accounts", available: true },
  { id: "4", text: "Advanced Smart Coach", available: true },
  { id: "5", text: "Unlimited Budgets", available: true },
  { id: "6", text: "Unlimited Savings Goals", available: true },
  { id: "7", text: "Priority Customer Support", available: true },
  { id: "8", text: "Premium Themes", available: true },
];

const MVP_INCLUSIONS = [
  {
    id: "youngins",
    title: "Youngins",
    desc: "Manage up to six children's accounts from one dashboard.",
    icon: "people-outline",
    iconColor: "#27AE60",
    bgColor: "#EEF7F1",
  },
  {
    id: "orgs",
    title: "Organizations",
    desc: "Create and manage organization finances separately.",
    icon: "business-outline",
    iconColor: "#5B4E91",
    bgColor: "#EEF0FC",
  },
  {
    id: "coach",
    title: "Advanced Smart Coach",
    desc: "Smarter financial recommendations just for you.",
    icon: "brain-outline",
    iconColor: "#D35400",
    bgColor: "#FAF2EC",
  },
  {
    id: "themes",
    title: "Premium Themes",
    desc: "Unlock exclusive themes for a custom experience.",
    icon: "color-palette-outline",
    iconColor: "#D9537E",
    bgColor: "#FDF0F3",
  },
];

export default function MembershipScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Configuration */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Membership",
          headerTitleAlign: "center",
          headerTitleStyle: styles.navHeaderTitle,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#FAF9FB" },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Active Status Card */}
        <View style={styles.currentPlanCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.planLabel}>Current Plan</Text>
              <Text style={styles.planTitleText}>Freemium</Text>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>
          <Text style={styles.planSubtitleText}>
            Upgrade to MVP anytime to unlock more features.
          </Text>
          {/* Crown Vector Background Icon Frame using MaterialCommunityIcons */}
          <View style={styles.crownWrapper}>
            <MaterialCommunityIcons
              name="crown-outline"
              size={32}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* Side-by-Side Plans Tier Column Grid */}
        <View style={styles.plansContainer}>
          {/* Freemium Tier Card */}
          <View style={[styles.tierCard, styles.freemiumCard]}>
            <View style={styles.tierHeader}>
              <View style={styles.tierIconContainer}>
                <Ionicons name="leaf-outline" size={18} color="#5B4E91" />
              </View>
              <View style={styles.tierTitleWrapper}>
                <Text style={styles.tierTitle}>Freemium</Text>
                <View style={styles.currentPlanBadge}>
                  <Text style={styles.currentPlanBadgeText}>Current Plan</Text>
                </View>
              </View>
            </View>
            <Text style={styles.tierDescription}>
              Essential tools to manage your money for free.
            </Text>

            <View style={styles.featureList}>
              {FREEMIUM_FEATURES.map((feat) => (
                <View key={feat.id} style={styles.featureRow}>
                  <Ionicons
                    name={feat.available ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={feat.available ? "#27AE60" : "#C7C7CC"}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      !feat.available && styles.disabledFeatureText,
                    ]}
                  >
                    {feat.text}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.disabledButton} disabled>
              <Text style={styles.disabledButtonText}>Current Plan</Text>
            </TouchableOpacity>
          </View>

          {/* MVP Premium Tier Card */}
          <View style={[styles.tierCard, styles.mvpCard]}>
            <View style={styles.tierHeader}>
              <View style={styles.tierIconContainerMVP}>
                <Ionicons name="diamond-outline" size={18} color="#1C1C1E" />
              </View>
              <View style={styles.tierTitleWrapper}>
                <Text style={styles.tierTitle}>MVP</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>Recommended</Text>
                </View>
              </View>
            </View>
            <Text style={styles.tierDescription}>
              The complete experience. More power, more control.
            </Text>

            <View style={styles.featureList}>
              {MVP_FEATURES.map((feat) => (
                <View key={feat.id} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                  <Text style={styles.featureText}>{feat.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.mvpActionButton}
              activeOpacity={0.8}
            >
              <Text style={styles.mvpActionButtonText}>Upgrade to MVP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Included with MVP Grid Headers */}
        <Text style={styles.sectionHeaderTitle}>Included with MVP</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalGridContainer}
        >
          {MVP_INCLUSIONS.map((item) => (
            <View key={item.id} style={styles.inclusionCard}>
              <View
                style={[styles.iconCircle, { backgroundColor: item.bgColor }]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.iconColor}
                />
              </View>
              <Text style={styles.inclusionTitle}>{item.title}</Text>
              <Text style={styles.inclusionDesc}>{item.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Billing Management Box Row */}
        <View style={styles.billingCard}>
          <View style={styles.billingIconFrame}>
            <Ionicons name="document-text-outline" size={20} color="#5B4E91" />
          </View>
          <View style={styles.billingTextFrame}>
            <Text style={styles.billingTitle}>Billing</Text>
            <Text style={styles.billingSubtitle}>No active subscription.</Text>
          </View>
          <TouchableOpacity style={styles.viewHistoryButton}>
            <Text style={styles.viewHistoryText}>View History</Text>
            <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Container */}
      <View style={styles.bottomStickyContainer}>
        <TouchableOpacity
          style={styles.primaryUpgradeButton}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons
            name="crown"
            size={18}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
          <Text style={styles.primaryUpgradeButtonText}>Upgrade to MVP</Text>
        </TouchableOpacity>
        <View style={styles.securityMetaRow}>
          <Ionicons name="lock-closed-outline" size={12} color="#8E8E93" />
          <Text style={styles.securityMetaText}>Cancel anytime</Text>
          <View style={styles.metaDot} />
          <Text style={styles.securityMetaText}>No hidden fees</Text>
          <View style={styles.metaDot} />
          <Text style={styles.securityMetaText}>Secure payments</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9FB",
  },
  navHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140, // Allocates padding room to avoid layout hiding behind floating action button
  },
  /* Premium Dark Status Card Styles */
  currentPlanCard: {
    position: "relative",
    backgroundColor: "#20142A",
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 11,
    color: "#A293B0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planTitleText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(39, 174, 96, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(39, 174, 96, 0.3)",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#27AE60",
    marginRight: 6,
  },
  activeBadgeText: {
    color: "#27AE60",
    fontSize: 11,
    fontWeight: "700",
  },
  planSubtitleText: {
    color: "#CEBFE2",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: "80%",
  },
  crownWrapper: {
    position: "absolute",
    right: -10,
    bottom: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "15deg" }],
  },
  /* Column Split Tier Container Styles */
  plansContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  tierCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E5E5EA",
    justifyContent: "space-between",
  },
  mvpCard: {
    borderColor: "#20142A", // Highlight wrapper outline for recommended item
  },
  freemiumCard: {
    borderColor: "#F2F2F7",
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tierIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF0FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  tierIconContainerMVP: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBE9F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  tierTitleWrapper: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1C1C1E",
  },
  currentPlanBadge: {
    backgroundColor: "#EBEBEF",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  currentPlanBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#8E8E93",
  },
  recommendedBadge: {
    backgroundColor: "#20142A",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  recommendedBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tierDescription: {
    fontSize: 11,
    color: "#636366",
    lineHeight: 15,
    marginBottom: 16,
  },
  featureList: {
    marginBottom: 20,
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2C2C2E",
    marginLeft: 6,
    flex: 1,
  },
  disabledFeatureText: {
    color: "#AEAEB2",
    textDecorationLine: "line-through",
  },
  disabledButton: {
    backgroundColor: "#F2F2F7",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButtonText: {
    color: "#A2A2A7",
    fontSize: 12,
    fontWeight: "700",
  },
  mvpActionButton: {
    backgroundColor: "#20142A",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  mvpActionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  /* Inclusions Scroll Section Styles */
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  horizontalGridContainer: {
    paddingRight: 16,
    gap: 12,
    marginBottom: 24,
  },
  inclusionCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F2F2F7",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  inclusionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  inclusionDesc: {
    fontSize: 10,
    color: "#8E8E93",
    lineHeight: 14,
  },
  /* History Billing Styles */
  billingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    marginBottom: 10,
  },
  billingIconFrame: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EEF0FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  billingTextFrame: {
    flex: 1,
  },
  billingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  billingSubtitle: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
  },
  viewHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewHistoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
  },
  /* Fixed Lower Core Banner Callout Action Button */
  bottomStickyContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: "#F2F2F7",
  },
  primaryUpgradeButton: {
    backgroundColor: "#20142A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonIcon: {
    marginRight: 6,
  },
  primaryUpgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  securityMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  securityMetaText: {
    fontSize: 10,
    color: "#8E8E93",
    fontWeight: "500",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#C7C7CC",
  },
});
