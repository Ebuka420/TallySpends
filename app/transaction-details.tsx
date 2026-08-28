import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { MOCK_RECIPIENTS, useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const receiptRef = useRef<View>(null);
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    transactions: rawTransactions = [],
    profileFullName,
    profileNickname,
    username,
    themePreference,
    themeMode,
  } = useAppStore();

  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const transactions = rawTransactions as any[];
  const transaction = useMemo(
    () => transactions.find((tx) => tx.id === params.id),
    [params.id, transactions],
  );

  const userName = useMemo(() => {
    if (profileFullName && profileFullName.trim()) return profileFullName.trim();
    if (profileNickname && profileNickname.trim() && profileNickname.toLowerCase() !== "enter nickname") {
      return profileNickname.trim();
    }
    return username || "Ebuka Daniel";
  }, [profileFullName, profileNickname, username]);

  const ticketId = useMemo(() => {
    if (!transaction?.id) return "0120034399434";
    const digits = transaction.id.replace(/\D/g, "");
    if (digits.length >= 10) return digits.slice(0, 13);
    return `01200${digits.padEnd(8, "3499")}`;
  }, [transaction?.id]);

  const formatCurrency = (value: number) =>
    `₦${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formattedDateTime = useMemo(() => {
    if (!transaction?.date) {
      return "19 Jun 2026 • 10:15";
    }
    const d = new Date(transaction.date);
    const dateStr = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${dateStr} • ${timeStr}`;
  }, [transaction?.date]);

  // Dynamically determine payment method, party details, and icon based on transaction
  const paymentDetails = useMemo(() => {
    if (!transaction) {
      return {
        type: "card",
        title: "Tally Debit Card",
        subtitle: "•••• 8237",
        badge: "Card Payment",
        icon: "card-outline" as const,
        iconBg: isDark ? "#3A213A" : "#F7F5F9",
      };
    }

    const title = transaction.title || "";
    const lowerTitle = title.toLowerCase();

    // 1. Transfer to a user / recipient
    if (lowerTitle.includes("transfer to")) {
      const usernameMatch = title.match(/Transfer to\s+@?([a-zA-Z0-9_]+)/i);
      const recipientUsername = usernameMatch ? usernameMatch[1] : "";
      const recipient = MOCK_RECIPIENTS.find(
        (r) => r.username.toLowerCase() === recipientUsername.toLowerCase(),
      );

      return {
        type: "transfer",
        title: recipient ? recipient.name : title.replace(/Transfer to\s+/i, ""),
        subtitle: recipient ? `${recipient.bank} • •••• 4910` : `@${recipientUsername} • Tally Transfer`,
        badge: "Bank Transfer",
        icon: "paper-plane-outline" as const,
        iconBg: isDark ? "#281D33" : "#F3EBF8",
      };
    }

    // 2. Deposit / Add Funds
    if (lowerTitle.includes("deposit") || (transaction.type === "income" && lowerTitle.includes("fund"))) {
      if (lowerTitle.includes("card")) {
        return {
          type: "card",
          title: "Debit Card (Mastercard)",
          subtitle: "•••• 4821 • Linked Card",
          badge: "Card Top-Up",
          icon: "card-outline" as const,
          iconBg: isDark ? "#332211" : "#FEF5ED",
        };
      }
      if (lowerTitle.includes("auto")) {
        return {
          type: "recurring",
          title: "Auto-Save Recurring",
          subtitle: "Automated Daily Stash",
          badge: "Scheduled Deposit",
          icon: "repeat-outline" as const,
          iconBg: isDark ? "#1B2A38" : "#EDF6FD",
        };
      }
      return {
        type: "bank",
        title: "Tally Virtual Bank",
        subtitle: "•••• 8912 • Direct Bank Deposit",
        badge: "Bank Transfer",
        icon: "business-outline" as const,
        iconBg: isDark ? "#133E23" : "#EAF6EC",
      };
    }

    // 3. Withdrawal
    if (lowerTitle.includes("withdraw")) {
      let bankName = "Guaranty Trust Bank";
      if (lowerTitle.includes("zenith")) bankName = "Zenith Bank";
      if (lowerTitle.includes("kuda")) bankName = "Kuda Microfinance Bank";

      return {
        type: "bank",
        title: bankName,
        subtitle: `${userName} • •••• 4821`,
        badge: "Withdrawal",
        icon: "arrow-up-circle-outline" as const,
        iconBg: isDark ? "#3D1719" : "#FDEDEC",
      };
    }

    // 4. Inbound Salary / Freelance Income
    if (transaction.type === "income") {
      return {
        type: "income",
        title: transaction.title,
        subtitle: "Direct Deposit • Primary Wallet",
        badge: "Direct Credit",
        icon: "arrow-down-circle-outline" as const,
        iconBg: isDark ? "#133E23" : "#EAF6EC",
      };
    }

    // 5. Merchant Expense (Food, Shopping, Bills, Transport)
    return {
      type: "merchant",
      title: transaction.title,
      subtitle: `Tally Virtual Card • •••• 8237`,
      badge: transaction.category || "Expense",
      icon: "bag-handle-outline" as const,
      iconBg: isDark ? "#281D33" : "#F4EEF8",
    };
  }, [transaction, isDark, userName]);

  const handleShareDetails = async () => {
    if (!receiptRef.current) return;
    try {
      if (!(await Sharing.isAvailableAsync())) return;
      const uri = await captureRef(receiptRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: 1080,
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: "Share TallySpends receipt",
        mimeType: "image/png",
        UTI: "public.png",
      });
    } catch {
      // User cancelled sharing
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Transaction Receipt
        </Text>
        <TouchableOpacity
          onPress={handleShareDetails}
          style={styles.headerAction}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Container Captured for Sharing */}
        <View style={styles.receiptOuterWrapper}>
          <View
            ref={receiptRef}
            collapsable={false}
            style={[
              styles.ticketCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Top Confetti & Celebration Header */}
            <View style={styles.celebrationArea}>
              <View
                style={[
                  styles.confettiIconCircle,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#FFF5EB" },
                ]}
              >
                <Text style={styles.partyHornEmoji}>🎉</Text>
              </View>
              <Text style={[styles.thankYouTitle, { color: theme.textPrimary }]}>
                Thank you!
              </Text>
              <Text style={[styles.thankYouSub, { color: theme.textSecondary }]}>
                Your transaction has been completed successfully
              </Text>
            </View>

            {/* Top Notch Divider */}
            <View style={styles.dashedDividerWrapper}>
              <View
                style={[
                  styles.sideNotch,
                  styles.leftNotch,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              />
              <View style={styles.dashedLineContainer}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dashDot,
                      { backgroundColor: isDark ? theme.border : "#E2DDE6" },
                    ]}
                  />
                ))}
              </View>
              <View
                style={[
                  styles.sideNotch,
                  styles.rightNotch,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              />
            </View>

            {/* Ticket Core Details */}
            <View style={styles.ticketDetailsSection}>
              {/* Row 1: Ticket ID & Amount */}
              <View style={styles.ticketRow}>
                <View style={styles.ticketColLeft}>
                  <Text style={[styles.ticketMetaLabel, { color: theme.textSecondary }]}>
                    TICKET ID
                  </Text>
                  <Text style={[styles.ticketValueMain, { color: theme.textPrimary }]}>
                    {ticketId}
                  </Text>
                </View>

                <View style={styles.ticketColRight}>
                  <Text style={[styles.ticketMetaLabel, { color: theme.textSecondary }]}>
                    Amount
                  </Text>
                  <Text style={[styles.ticketAmountMain, { color: theme.textPrimary }]}>
                    {transaction ? formatCurrency(transaction.amount) : "₦35,000.00"}
                  </Text>
                </View>
              </View>

              {/* Row 2: Date & Time */}
              <View style={[styles.ticketRow, { marginTop: 16 }]}>
                <View style={styles.ticketColLeft}>
                  <Text style={[styles.ticketMetaLabel, { color: theme.textSecondary }]}>
                    DATE & TIME
                  </Text>
                  <Text style={[styles.ticketValueSub, { color: theme.textPrimary }]}>
                    {formattedDateTime}
                  </Text>
                </View>
              </View>

              {/* Dynamic Payment Method / Recipient / Merchant Box */}
              <View
                style={[
                  styles.paymentPillBox,
                  {
                    backgroundColor: isDark ? theme.surfaceSoft : "#F7F5F9",
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Method Icon / Mastercard circles */}
                {paymentDetails.type === "card" ? (
                  <View style={styles.mastercardLogo}>
                    <View style={[styles.mcCircle, { backgroundColor: "#EB001B" }]} />
                    <View
                      style={[
                        styles.mcCircle,
                        { backgroundColor: "#F79E1B", marginLeft: -10, opacity: 0.92 },
                      ]}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.dynamicIconBox,
                      { backgroundColor: paymentDetails.iconBg },
                    ]}
                  >
                    <Ionicons
                      name={paymentDetails.icon}
                      size={20}
                      color={theme.accent}
                    />
                  </View>
                )}

                <View style={styles.paymentPillInfo}>
                  <Text
                    style={[styles.paymentPillName, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {paymentDetails.title}
                  </Text>
                  <Text style={[styles.paymentPillCardNum, { color: theme.textSecondary }]}>
                    {paymentDetails.subtitle}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Notch Divider */}
            <View style={styles.dashedDividerWrapper}>
              <View
                style={[
                  styles.sideNotch,
                  styles.leftNotch,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              />
              <View style={styles.dashedLineContainer}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dashDot,
                      { backgroundColor: isDark ? theme.border : "#E2DDE6" },
                    ]}
                  />
                ))}
              </View>
              <View
                style={[
                  styles.sideNotch,
                  styles.rightNotch,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              />
            </View>

            {/* Ticket Scalloped Bottom Edge */}
            <View style={styles.scallopEdgeRow}>
              {Array.from({ length: 9 }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.scallopHole,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                />
              ))}
            </View>
          </View>
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
  headerAction: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  receiptOuterWrapper: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    marginBottom: 20,
  },
  ticketCard: {
    width: "100%",
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    paddingTop: 28,
    position: "relative",
  },
  celebrationArea: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 22,
  },
  confettiIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  partyHornEmoji: {
    fontSize: 30,
  },
  thankYouTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: "center",
  },
  thankYouSub: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "500",
    maxWidth: 240,
  },
  dashedDividerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    height: 24,
    marginVertical: 4,
  },
  sideNotch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    position: "absolute",
    zIndex: 2,
  },
  leftNotch: {
    left: -12,
  },
  rightNotch: {
    right: -12,
  },
  dashedLineContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    overflow: "hidden",
  },
  dashDot: {
    width: 5,
    height: 1.5,
    borderRadius: 1,
  },
  ticketDetailsSection: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ticketColLeft: {
    flex: 1,
  },
  ticketColRight: {
    alignItems: "flex-end",
  },
  ticketMetaLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  ticketValueMain: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  ticketAmountMain: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  ticketValueSub: {
    fontSize: 14,
    fontWeight: "700",
  },
  paymentPillBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 18,
  },
  mastercardLogo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
  },
  dynamicIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  mcCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  paymentPillInfo: {
    flex: 1,
  },
  paymentPillName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  paymentPillCardNum: {
    fontSize: 12,
    fontWeight: "600",
  },
  scallopEdgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: -10,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  scallopHole: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
});
