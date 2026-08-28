import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { MOCK_RECIPIENTS, useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

type Props = {
  visible: boolean;
  transaction: any | null;
  onClose: () => void;
  onViewReceipt?: () => void;
};

export default function TransactionReceiptModal({
  visible,
  transaction,
  onClose,
  onViewReceipt,
}: Props) {
  const receiptRef = useRef<View>(null);
  const {
    profileFullName,
    profileNickname,
    username,
    themePreference,
    themeMode,
  } = useAppStore();

  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

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

  const formatCurrency = (value: number) =>
    `₦${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

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

  const handleShare = async () => {
    try {
      if (!receiptRef.current || !(await Sharing.isAvailableAsync())) return;
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
      // Sharing cancelled
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <ScrollView
          contentContainerStyle={styles.modalScrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable
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
                  { backgroundColor: isDark ? "#0E0E12" : "#1A1A24", borderColor: theme.border },
                ]}
              />
              <View style={styles.dashedLineContainer}>
                {Array.from({ length: 26 }).map((_, i) => (
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
                  { backgroundColor: isDark ? "#0E0E12" : "#1A1A24", borderColor: theme.border },
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
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              </View>

              {/* Row 2: Date & Time */}
              <View style={[styles.ticketRow, { marginTop: 14 }]}>
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
                      size={18}
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
                  { backgroundColor: isDark ? "#0E0E12" : "#1A1A24", borderColor: theme.border },
                ]}
              />
              <View style={styles.dashedLineContainer}>
                {Array.from({ length: 26 }).map((_, i) => (
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
                  { backgroundColor: isDark ? "#0E0E12" : "#1A1A24", borderColor: theme.border },
                ]}
              />
            </View>

            {/* Scallop Tear-off Bottom */}
            <View style={styles.scallopEdgeRow}>
              {Array.from({ length: 9 }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.scallopHole,
                    { backgroundColor: isDark ? "#0E0E12" : "#1A1A24", borderColor: theme.border },
                  ]}
                />
              ))}
            </View>
          </Pressable>

          {/* Action Buttons Row */}
          <View style={styles.modalActionsRow}>
            <TouchableOpacity
              style={[styles.shareModalBtn, { backgroundColor: theme.accent }]}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Ionicons name="share-social-outline" size={17} color="#FFFFFF" />
              <Text style={styles.shareModalBtnText}>Share Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.closeModalBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeModalBtnText, { color: theme.textPrimary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  modalScrollContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  ticketCard: {
    width: 330,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    paddingTop: 24,
    position: "relative",
  },
  celebrationArea: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  confettiIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  partyHornEmoji: {
    fontSize: 28,
  },
  thankYouTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: "center",
  },
  thankYouSub: {
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: "center",
    fontWeight: "500",
    maxWidth: 230,
  },
  dashedDividerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    height: 22,
    marginVertical: 4,
  },
  sideNotch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    position: "absolute",
    zIndex: 2,
  },
  leftNotch: {
    left: -11,
  },
  rightNotch: {
    right: -11,
  },
  dashedLineContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 14,
    overflow: "hidden",
  },
  dashDot: {
    width: 4.5,
    height: 1.5,
    borderRadius: 1,
  },
  ticketDetailsSection: {
    paddingHorizontal: 22,
    paddingVertical: 12,
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  ticketValueMain: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  ticketAmountMain: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  ticketValueSub: {
    fontSize: 13,
    fontWeight: "700",
  },
  paymentPillBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
  },
  mastercardLogo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  dynamicIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mcCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  paymentPillInfo: {
    flex: 1,
  },
  paymentPillName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  paymentPillCardNum: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  scallopEdgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: -10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  scallopHole: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  modalActionsRow: {
    flexDirection: "row",
    width: 330,
    gap: 10,
    marginTop: 16,
  },
  shareModalBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  shareModalBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  closeModalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
