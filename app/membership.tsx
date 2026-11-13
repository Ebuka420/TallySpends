import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppStore } from "../src/store";
import { getSubscriptionSnapshot, manageSubscription, purchaseSubscription, restoreSubscriptions, subscribeSubscription } from "../src/subscriptions/revenuecat";

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
  const { theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const billing = React.useSyncExternalStore(subscribeSubscription, getSubscriptionSnapshot, getSubscriptionSnapshot);
  const packages = billing.offering?.availablePackages ?? [];
  const active = billing.status === "active";
  const dateLabel = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null;
  const entitlementDetail = active
    ? billing.entitlement?.willRenew
      ? `Renews ${dateLabel(billing.entitlement.expirationDate) || "automatically"}`
      : billing.entitlement?.expirationDate
        ? `Access until ${dateLabel(billing.entitlement.expirationDate)}`
        : "Lifetime access"
    : billing.status === "loading" ? "Checking your store account…" : "No active MVP subscription";

  const buyPackage = async (item: (typeof packages)[number]) => {
    try {
      const info = await purchaseSubscription(item);
      if (info) Alert.alert("MVP activated", "Your store purchase is verified and MVP access is now active on this account.");
    } catch (error) {
      Alert.alert("Purchase not completed", error instanceof Error ? error.message : "Please try again.");
    }
  };
  const restore = async () => {
    try {
      const restored = await restoreSubscriptions();
      Alert.alert(restored ? "Purchase restored" : "No active purchase found", restored ? "MVP is active on this account." : "No active MVP subscription was found for this store account.");
    } catch (error) {
      Alert.alert("Restore failed", error instanceof Error ? error.message : "Please try again.");
    }
  };
  const manage = async () => {
    try { await manageSubscription(); }
    catch (error) { Alert.alert("Could not open subscriptions", error instanceof Error ? error.message : "Please try again."); }
  };

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
          headerStyle: { backgroundColor: theme.background },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* The plan reflects the active RevenueCat entitlement on this signed-in account. */}
        <View style={styles.currentPlanCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.planLabel}>ACCOUNT PLAN</Text>
              <Text style={styles.planTitleText}>{active ? "MVP" : billing.status === "unavailable" ? "Plan unavailable" : "Freemium"}</Text>
            </View>
            <View style={[styles.activeBadge, !active && styles.inactiveBadge]}>
              {billing.status === "loading" && <ActivityIndicator size="small" color={theme.textSecondary} style={{ marginRight: 6 }} />}
              <Text style={[styles.activeBadgeText, !active && { color: theme.textSecondary }]}>{active ? "Active" : billing.status === "loading" ? "Checking" : billing.status === "unavailable" ? "Unavailable" : "Free"}</Text>
            </View>
          </View>
          <Text style={styles.planSubtitleText}>
            {active ? `${billing.entitlement?.store === "APP_STORE" ? "Apple App Store" : billing.entitlement?.store === "PLAY_STORE" ? "Google Play" : "Store"} · ${entitlementDetail}` : billing.status === "unavailable" ? billing.error || "Store billing is unavailable in this build." : entitlementDetail}
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
                <Ionicons name="leaf-outline" size={18} color={theme.accent} />
              </View>
              <View style={styles.tierTitleWrapper}>
                <Text style={styles.tierTitle}>Freemium</Text>
                <View style={styles.currentPlanBadge}>
                  <Text style={styles.currentPlanBadgeText}>Free tier</Text>
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
                    color={feat.available ? theme.success : "#C7C7CC"}
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
              <Text style={styles.disabledButtonText}>Included</Text>
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
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={styles.featureText}>{feat.text}</Text>
                </View>
              ))}
            </View>

            {active ? (
              <TouchableOpacity style={styles.mvpActionButton} onPress={manage} disabled={billing.busy} accessibilityRole="button">
                <Text style={styles.mvpActionButtonText}>Manage subscription</Text>
              </TouchableOpacity>
            ) : packages.length ? packages.map(item => (
              <TouchableOpacity key={item.identifier} style={[styles.mvpActionButton, billing.busy && styles.purchaseButtonBusy]} onPress={() => void buyPackage(item)} disabled={billing.busy} accessibilityRole="button">
                {billing.busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mvpActionButtonText}>Subscribe · {item.product.priceString}</Text>}
              </TouchableOpacity>
            )) : (
              <TouchableOpacity style={styles.disabledButton} disabled accessibilityRole="button">
                <Text style={styles.disabledButtonText}>{billing.status === "loading" ? "Loading store options…" : "Purchase options unavailable"}</Text>
              </TouchableOpacity>
            )}
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
            <Ionicons name="document-text-outline" size={20} color={theme.accent} />
          </View>
          <View style={styles.billingTextFrame}>
            <Text style={styles.billingTitle}>Billing</Text>
            <Text style={styles.billingSubtitle}>{active ? `${billing.entitlement?.productIdentifier || "MVP subscription"} · ${entitlementDetail}` : billing.error || "Your store subscription status appears here."}</Text>
          </View>
          <TouchableOpacity style={styles.viewHistoryButton} onPress={() => active ? void manage() : void restore()} disabled={!billing.configured || billing.busy} accessibilityRole="button">
            <Text style={styles.viewHistoryText}>{active ? "Manage" : "Restore"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Container */}
      <View style={styles.bottomStickyContainer}>
        <TouchableOpacity
          style={[styles.primaryUpgradeButton, (!active && !packages.length || billing.busy) && styles.unavailableUpgradeButton]}
          onPress={() => active ? void manage() : packages[0] ? void buyPackage(packages[0]) : undefined}
          disabled={billing.busy || (!active && !packages.length)}
        >
          <MaterialCommunityIcons
            name="crown"
            size={18}
            color={active || packages.length ? "#FFFFFF" : theme.textSecondary}
            style={styles.buttonIcon}
          />
          <Text style={[styles.primaryUpgradeButtonText, (!active && !packages.length) && { color: theme.textSecondary }]}>{billing.busy ? "Contacting store…" : active ? "Manage subscription" : packages[0] ? `Subscribe · ${packages[0].product.priceString}` : "Purchases unavailable"}</Text>
        </TouchableOpacity>
        <View style={styles.securityMetaRow}>
          <Ionicons name="information-circle-outline" size={12} color={theme.textSecondary} />
          <Text style={styles.securityMetaText}>{billing.error || (active ? "Your MVP access is active on this store account" : Platform.OS === "ios" || Platform.OS === "android" ? "Purchases are securely processed by your app store" : "Purchases are available in the iOS and Android apps")}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  navHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.textPrimary,
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
    backgroundColor: theme.hero,
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
    color: theme.heroMuted,
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
  inactiveBadge: {
    backgroundColor: theme.surfaceSoft,
    borderColor: theme.border,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.success,
    marginRight: 6,
  },
  activeBadgeText: {
    color: theme.success,
    fontSize: 11,
    fontWeight: "700",
  },
  planSubtitleText: {
    color: theme.heroMuted,
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
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
    justifyContent: "space-between",
  },
  mvpCard: {
    borderColor: theme.accent, // Highlight wrapper outline for recommended item
  },
  freemiumCard: {
    borderColor: theme.border,
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
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  tierIconContainerMVP: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accentSoft,
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
    color: theme.textPrimary,
  },
  currentPlanBadge: {
    backgroundColor: theme.surfaceSoft,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  currentPlanBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: theme.textSecondary,
  },
  recommendedBadge: {
    backgroundColor: theme.accent,
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
    color: theme.textSecondary,
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
    color: theme.textPrimary,
    marginLeft: 6,
    flex: 1,
  },
  disabledFeatureText: {
    color: theme.textSecondary,
    textDecorationLine: "line-through",
  },
  disabledButton: {
    backgroundColor: theme.surfaceSoft,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButtonText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  mvpActionButton: {
    backgroundColor: theme.accent,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  mvpActionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  purchaseButtonBusy: {
    opacity: 0.7,
  },
  /* Inclusions Scroll Section Styles */
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.textPrimary,
    marginBottom: 12,
  },
  horizontalGridContainer: {
    paddingRight: 16,
    gap: 12,
    marginBottom: 24,
  },
  inclusionCard: {
    width: 140,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.textPrimary,
    marginBottom: 4,
  },
  inclusionDesc: {
    fontSize: 10,
    color: theme.textSecondary,
    lineHeight: 14,
  },
  /* History Billing Styles */
  billingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
  },
  billingIconFrame: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.accentSoft,
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
    color: theme.textPrimary,
  },
  billingSubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
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
    color: theme.textSecondary,
  },
  /* Fixed Lower Core Banner Callout Action Button */
  bottomStickyContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  primaryUpgradeButton: {
    backgroundColor: theme.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  unavailableUpgradeButton: {
    backgroundColor: theme.surfaceSoft,
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
    color: theme.textSecondary,
    fontWeight: "500",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.border,
  },
});

