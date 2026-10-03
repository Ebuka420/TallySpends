import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useAppStore } from "../src/store";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// 1. Import your newly generated premium illustration
const YounginsHeroImage = require("../assets/images/youngins_hero.png");

// Mock Data matching the design
const BENEFITS = [
  {
    id: "secure",
    title: "Safe & Secure",
    subtitle: "You're in control of their account.",
    icon: "shield-checkmark-outline",
    iconColor: "#5B4E91",
    bgColor: "#EEF0FC",
  },
  {
    id: "savings",
    title: "Smart Savings",
    subtitle: "Set goals and help them save.",
    icon: "bar-chart-outline",
    iconColor: "#27AE60",
    bgColor: "#EEF7F1",
  },
  {
    id: "limits",
    title: "Spending Limits",
    subtitle: "Set limits and track their spending.",
    icon: "card-outline",
    iconColor: "#D35400",
    bgColor: "#FAF2EC",
  },
  {
    id: "grow",
    title: "Learn & Grow",
    subtitle: "Teach money skills for the future.",
    icon: "school-outline",
    iconColor: "#D9537E",
    bgColor: "#FDF0F3",
  },
];

const YOUNG_ACCOUNTS = [
  {
    id: "timmy",
    name: "Timmy",
    age: 12,
    balance: "₦45,600.00",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "ada",
    name: "Ada",
    age: 10,
    balance: "₦28,150.00",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
  },
];

export default function YounginsScreen() {
  const router = useRouter();
  const { theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const benefitColors: Record<string, { icon: string; bg: string }> = {
    secure: { icon: theme.accentHighlight, bg: theme.accentSoft },
    savings: { icon: theme.success, bg: theme.surfaceSoft },
    limits: { icon: theme.warning, bg: theme.surfaceSoft },
    grow: { icon: theme.danger, bg: theme.surfaceSoft },
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Configure Header Navigation */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Youngins",
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
        {/* 1. Hero Promo Banner Container */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              Open an account{"\n"}for someone below 18.
            </Text>
            <Text style={styles.heroSubtitle}>
              Help them learn, save and grow with smart money habits.
            </Text>
            <TouchableOpacity style={styles.heroButton} activeOpacity={0.8}>
              <Ionicons
                name="add"
                size={18}
                color={theme.surface}
                style={styles.heroButtonIcon}
              />
              <Text style={styles.heroButtonText}>Open Youngins Account</Text>
            </TouchableOpacity>
          </View>

          {/* Illustration Container styled to float perfectly on the right */}
          <View style={styles.heroImageWrapper}>
            <Image
              source={YounginsHeroImage}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 2. Key Benefits Section */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.sectionHeaderTitle}>
            Managed by you, built for them
          </Text>
          <View style={styles.gridContainer}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.id} style={styles.benefitItem}>
                <View style={[styles.iconCircle, { backgroundColor: benefitColors[benefit.id].bg }]}>
                  <Ionicons name={benefit.icon as any} size={20} color={benefitColors[benefit.id].icon} />
                </View>
                <View style={styles.benefitTextFrame}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitSubtitle}>{benefit.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Your Youngins Accounts List */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your Youngins</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardContainer}>
            {YOUNG_ACCOUNTS.map((account, index) => (
              <View key={account.id}>
                <TouchableOpacity style={styles.accountRow} activeOpacity={0.7}>
                  <Image
                    source={{ uri: account.avatar }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountAge}>Age {account.age}</Text>
                  </View>
                  <View style={styles.balanceDetails}>
                    <Text style={styles.balanceLabel}>Account Balance</Text>
                    <Text style={styles.balanceValue}>{account.balance}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} style={styles.rowChevron} />
                </TouchableOpacity>
                {index < YOUNG_ACCOUNTS.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 4. Trust & Security Banner */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark" size={20} color={theme.success} style={styles.securityIcon} />
          <Text style={styles.securityText}>
            Youngins accounts follow strict security and privacy standards to
            keep your child&apos;s money safe.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  /* Hero Promo Banner Box */
    heroCard: {
      position: "relative",
      backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
    marginBottom: 24,
    overflow: "hidden",
    minHeight: 190,
  },
  heroTextContainer: {
    width: "60%",
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.textPrimary,
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 18,
  },
  heroButton: {
    backgroundColor: theme.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  heroButtonIcon: {
    marginRight: 4,
  },
  heroButtonText: {
    color: theme.surface,
    fontSize: 11,
    fontWeight: "700",
  },
  heroImageWrapper: {
    position: "absolute",
    right: -10,
    bottom: -5,
    zIndex: 1,
  },
  heroImage: {
    width: 210,
    height: 220,
  },
  /* Grid Layout Benefits */
  benefitsContainer: {
    marginBottom: 24,
  },
    sectionHeaderTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 16,
    },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  benefitItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  benefitTextFrame: {
    flex: 1,
  },
    benefitTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 2,
    },
    benefitSubtitle: {
      fontSize: 10,
      color: theme.textSecondary,
      lineHeight: 13,
    },
  /* Reusable Sections */
  sectionWrapper: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.accentHighlight,
    },
    cardContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
  /* Individual Account Rows */
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surfaceSoft,
  },
  accountDetails: {
    flex: 1,
    marginLeft: 12,
  },
    accountName: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    accountAge: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
  balanceDetails: {
    alignItems: "flex-end",
    marginRight: 10,
  },
  balanceLabel: {
    fontSize: 9,
    color: theme.textSecondary,
    marginBottom: 2,
  },
    balanceValue: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textPrimary,
    },
  rowChevron: {
    marginLeft: 2,
  },
    divider: {
      height: 1,
      backgroundColor: theme.border,
    },
  /* Guardrail Security Badge info banner */
    securityBanner: {
      flexDirection: "row",
      backgroundColor: theme.accentSoft,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      marginTop: 10,
    },
  securityIcon: {
    marginRight: 12,
  },
    securityText: {
      flex: 1,
      fontSize: 11,
      color: theme.textPrimary,
      lineHeight: 16,
      fontWeight: "500",
    },
  });
