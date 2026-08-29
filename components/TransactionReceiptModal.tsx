import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef } from "react";
import {
  Modal,
  Pressable,
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
  const { themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const normalizedTitle = useMemo(() => {
    if (!transaction?.title) return "Transaction Receipt";
    return transaction.title.replace(
      /(Transfer to\s+)@([a-zA-Z0-9_]+)/i,
      (_: string, prefix: string, username: string) => {
        const recipient = MOCK_RECIPIENTS.find(
          (r) => r.username.toLowerCase() === username.toLowerCase(),
        );
        return recipient
          ? `${prefix}${recipient.name}`
          : `Transfer to @${username}`;
      },
    );
  }, [transaction?.title]);

  const formattedDate = useMemo(() => {
    if (!transaction?.date) return "";
    return new Date(transaction.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [transaction?.date]);

  const formattedTime = useMemo(() => {
    if (!transaction?.date) return "";
    return new Date(transaction.date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [transaction?.date]);

  const amountText = transaction
    ? `₦${Number(transaction.amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "-";

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
      // The receipt remains open if sharing is cancelled or unavailable.
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
        <Pressable
          ref={receiptRef}
          collapsable={false}
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.edgeNotch,
              styles.edgeBottomLeft,
              { backgroundColor: isDark ? "rgba(10, 10, 12, 0.7)" : "rgba(31, 20, 38, 0.35)" },
            ]}
          />
          <View
            style={[
              styles.edgeNotch,
              styles.edgeBottomRight,
              { backgroundColor: isDark ? "rgba(10, 10, 12, 0.7)" : "rgba(31, 20, 38, 0.35)" },
            ]}
          />

          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardLabel, { color: theme.accent }]}>RECEIPT</Text>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                Transaction completed
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isDark ? "#133E23" : "#E7F6ED" },
              ]}
            >
              <Ionicons
                name="checkmark-sharp"
                size={16}
                color={isDark ? "#4ADE80" : "#275C4E"}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isDark ? "#4ADE80" : "#275C4E" },
                ]}
              >
                Paid
              </Text>
            </View>
          </View>

          <View style={styles.amountBlock}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
              Total paid
            </Text>
            <Text style={[styles.amountValue, { color: theme.textPrimary }]}>
              {amountText}
            </Text>
            <Text style={[styles.amountMeta, { color: theme.textSecondary }]}>
              {transaction.type?.toUpperCase() || "TRANSACTION"} • {formattedDate}
            </Text>
          </View>

          <View style={[styles.infoList, { borderTopColor: theme.border }]}>
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Description
              </Text>
              <Text
                style={[styles.infoValue, { color: theme.textPrimary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {normalizedTitle}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Category
              </Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {transaction.category || "-"}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Time
              </Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {formattedTime}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Transaction ID
              </Text>
              <Text
                style={[styles.infoValue, { color: theme.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {transaction.id}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: theme.accent }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={17} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share receipt</Text>
            </TouchableOpacity>
            {onViewReceipt ? (
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  {
                    borderColor: theme.border,
                    backgroundColor: isDark ? theme.surfaceSoft : "transparent",
                  },
                ]}
                onPress={onViewReceipt}
              >
                <Text style={[styles.viewButtonText, { color: theme.textPrimary }]}>
                  View full receipt
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  card: {
    position: "relative",
    borderRadius: 32,
    padding: 22,
    marginHorizontal: 16,
    marginBottom: 28,
    overflow: "visible",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 24,
    elevation: 6,
  },
  edgeNotch: {
    position: "absolute",
    width: 34,
    height: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  edgeBottomLeft: {
    left: 24,
    bottom: -9,
  },
  edgeBottomRight: {
    right: 24,
    bottom: -9,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  amountBlock: {
    alignItems: "center",
    paddingVertical: 26,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 34,
    fontWeight: "800",
    marginTop: 7,
  },
  amountMeta: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },
  infoList: {
    borderTopWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  bottomRow: {
    flexDirection: "row",
    gap: 10,
  },
  shareButton: {
    flex: 1,
    minHeight: 47,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  viewButton: {
    flex: 1,
    minHeight: 47,
    borderWidth: 1,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
