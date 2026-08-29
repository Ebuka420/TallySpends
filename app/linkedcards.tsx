import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const LINKED_CARDS_DATA = [
  {
    id: "card-1",
    bank: "GTBank",
    type: "Mastercard Debit",
    last4: "4821",
    expiry: "09/28",
    spentThisMonth: 142500,
    txnCount: 14,
    status: "Active",
    brandColor: "#DD4F05",
    brandBg: "#FFF1EB",
    darkBrandBg: "#3A1A0C",
    cardBgGradient: ["#E65100", "#BF360C"],
    icon: "card-outline" as const,
    recentTxns: [
      { name: "Shoprite Victoria Island", amt: "₦34,200", date: "Today, 2:15 PM" },
      { name: "TotalEnergies Fuel", amt: "₦18,000", date: "Yesterday" },
      { name: "Netflix Subscription", amt: "₦5,500", date: "Aug 22" },
    ],
  },
  {
    id: "card-2",
    bank: "Zenith Bank",
    type: "Classic Visa Debit",
    last4: "8912",
    expiry: "11/27",
    spentThisMonth: 68200,
    txnCount: 6,
    status: "Active",
    brandColor: "#C8102E",
    brandBg: "#FDE8EB",
    darkBrandBg: "#3D0C13",
    cardBgGradient: ["#B71C1C", "#880E4F"],
    icon: "card-outline" as const,
    recentTxns: [
      { name: "Spar Lekki Mall", amt: "₦28,400", date: "Aug 20" },
      { name: "Ikeja Electric Token", amt: "₦20,000", date: "Aug 15" },
    ],
  },
  {
    id: "card-3",
    bank: "Kuda Bank",
    type: "Virtual Naira Card",
    last4: "1044",
    expiry: "04/29",
    spentThisMonth: 24800,
    txnCount: 9,
    status: "Active",
    brandColor: "#40196D",
    brandBg: "#F3EDFA",
    darkBrandBg: "#25103F",
    cardBgGradient: ["#4A148C", "#311B92"],
    icon: "phone-portrait-outline" as const,
    recentTxns: [
      { name: "Spotify Premium", amt: "₦1,800", date: "Aug 18" },
      { name: "Uber Ride", amt: "₦4,500", date: "Aug 16" },
      { name: "Apple Services", amt: "₦3,900", date: "Aug 10" },
    ],
  },
];

export default function LinkedCardsScreen() {
  const router = useRouter();
  const { themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const totalCardSpent = useMemo(() => {
    return LINKED_CARDS_DATA.reduce((acc, c) => acc + c.spentThisMonth, 0);
  }, []);

  const totalTxnCount = useMemo(() => {
    return LINKED_CARDS_DATA.reduce((acc, c) => acc + c.txnCount, 0);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Linked Cards Activity
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/linkbank")}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Spend Hero */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.heroMetaLabel, { color: theme.textSecondary }]}>
            TOTAL CARD EXPENDITURE THIS MONTH
          </Text>
          <Text style={[styles.heroBigAmount, { color: theme.textPrimary }]}>
            ₦{totalCardSpent.toLocaleString()}
          </Text>
          <View style={styles.heroFooterRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="card-outline" size={14} color={theme.accent} />
              <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
                {LINKED_CARDS_DATA.length} Linked Cards Active
              </Text>
            </View>
            <Text style={[styles.heroTxnCount, { color: theme.accent }]}>
              {totalTxnCount} Card Transactions
            </Text>
          </View>
        </View>

        {/* Link New Card CTA */}
        <TouchableOpacity
          style={[
            styles.linkNewCardBtn,
            { backgroundColor: theme.accent },
          ]}
          onPress={() => router.push("/linkbank")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.linkNewCardBtnText}>Link New Bank Card or Account</Text>
        </TouchableOpacity>

        {/* Cards Detailed Breakdown */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Your Active Payment Cards
        </Text>

        <View style={{ gap: 14 }}>
          {LINKED_CARDS_DATA.map((card) => (
            <View
              key={card.id}
              style={[
                styles.cardContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {/* Card visual mockup pill */}
              <View
                style={[
                  styles.cardMockup,
                  {
                    backgroundColor: isDark ? card.darkBrandBg : card.brandBg,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.cardMockupTop}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name={card.icon} size={18} color={card.brandColor} />
                    <Text style={[styles.cardMockupBank, { color: card.brandColor }]}>
                      {card.bank}
                    </Text>
                  </View>
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>{card.status}</Text>
                  </View>
                </View>

                <Text style={[styles.cardMockupNumber, { color: theme.textPrimary }]}>
                  •••• •••• •••• {card.last4}
                </Text>

                <View style={styles.cardMockupBottom}>
                  <Text style={[styles.cardMockupType, { color: theme.textSecondary }]}>
                    {card.type}
                  </Text>
                  <Text style={[styles.cardMockupExpiry, { color: theme.textSecondary }]}>
                    Expires {card.expiry}
                  </Text>
                </View>
              </View>

              {/* Spend summary metrics */}
              <View style={styles.cardMetricsRow}>
                <View>
                  <Text style={[styles.cardMetricLabel, { color: theme.textSecondary }]}>
                    This Month's Outgoing
                  </Text>
                  <Text style={[styles.cardMetricValue, { color: theme.textPrimary }]}>
                    ₦{card.spentThisMonth.toLocaleString()}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.cardMetricLabel, { color: theme.textSecondary }]}>
                    Activity
                  </Text>
                  <Text style={[styles.cardMetricValue, { color: theme.accent }]}>
                    {card.txnCount} purchases
                  </Text>
                </View>
              </View>

              {/* Recent transactions snippet */}
              <View style={[styles.recentTxnBlock, { borderTopColor: theme.border }]}>
                <Text style={[styles.recentTxnHeader, { color: theme.textSecondary }]}>
                  Recent Activity:
                </Text>
                {card.recentTxns.map((tx, idx) => (
                  <View key={idx} style={styles.recentTxnRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.recentTxnName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {tx.name}
                      </Text>
                      <Text style={[styles.recentTxnDate, { color: theme.textSecondary }]}>
                        {tx.date}
                      </Text>
                    </View>
                    <Text style={[styles.recentTxnAmt, { color: theme.textPrimary }]}>
                      {tx.amt}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  heroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  heroMetaLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroBigAmount: {
    fontSize: 27,
    fontWeight: "800",
    marginTop: 3,
    marginBottom: 10,
  },
  heroFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroSubText: {
    fontSize: 12,
    fontWeight: "500",
  },
  heroTxnCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  linkNewCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 18,
  },
  linkNewCardBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardMockup: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  cardMockupTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardMockupBank: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#15803D",
  },
  activeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#15803D",
  },
  cardMockupNumber: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 12,
  },
  cardMockupBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMockupType: {
    fontSize: 11,
    fontWeight: "500",
  },
  cardMockupExpiry: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardMetricLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  cardMetricValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  recentTxnBlock: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 6,
  },
  recentTxnHeader: {
    fontSize: 10.5,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  recentTxnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentTxnName: {
    fontSize: 12,
    fontWeight: "600",
  },
  recentTxnDate: {
    fontSize: 10,
    marginTop: 1,
  },
  recentTxnAmt: {
    fontSize: 12,
    fontWeight: "700",
  },
});
