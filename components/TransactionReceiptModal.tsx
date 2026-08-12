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
import { MOCK_RECIPIENTS } from "../src/store";

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
        <Pressable ref={receiptRef} collapsable={false} style={styles.card}>
          <View style={[styles.edgeNotch, styles.edgeBottomLeft]} />
          <View style={[styles.edgeNotch, styles.edgeBottomRight]} />

          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Receipt</Text>
              <Text style={styles.cardTitle}>Transaction completed</Text>
            </View>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-sharp" size={16} color="#275C4E" />
              <Text style={styles.statusText}>Paid</Text>
            </View>
          </View>

          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Total paid</Text>
            <Text style={styles.amountValue}>{amountText}</Text>
            <Text style={styles.amountMeta}>
              {transaction.type?.toUpperCase() || "TRANSACTION"} •{" "}
              {formattedDate}
            </Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {normalizedTitle}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>
                {transaction.category || "-"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formattedTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transaction ID</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {transaction.id}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={17} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share receipt</Text>
            </TouchableOpacity>
            {onViewReceipt ? (
              <TouchableOpacity
                style={styles.viewButton}
                onPress={onViewReceipt}
              >
                <Text style={styles.viewButtonText}>View full receipt</Text>
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
    backgroundColor: "rgba(31, 20, 38, 0.28)",
    justifyContent: "flex-end",
  },
  card: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 22,
    marginHorizontal: 16,
    marginBottom: 28,
    overflow: "visible",
    borderWidth: 1,
    borderColor: "#EDE7F1",
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
    backgroundColor: "rgba(31, 20, 38, 0.28)",
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
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    overflow: "hidden",
  },
  handle: {
    width: 64,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E7E1EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroTop: {
    alignItems: "center",
    marginBottom: 18,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4B2C40",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  successTitle: {
    color: "#251A2B",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  successSubtitle: {
    color: "#837289",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  receiptSummary: {
    alignItems: "center",
    marginBottom: 20,
  },
  receiptAmount: {
    color: "#251A2B",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  receiptTagRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  receiptTag: {
    color: "#5B4E91",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "#F2E9F8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  receiptDate: {
    color: "#8E7A9F",
    fontSize: 11,
    fontWeight: "600",
  },
  line: {
    height: 1,
    backgroundColor: "#F0EBF1",
    marginVertical: 18,
  },
  rowPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  rowBlock: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    color: "#8E7A9A",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.7,
  },
  rowValue: {
    color: "#251A2B",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#4B2C40",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E7E1EB",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: {
    color: "#5B4E91",
    fontSize: 14,
    fontWeight: "700",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLabel: { color: "#7453B8", fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  cardTitle: { color: "#251A2B", fontSize: 19, fontWeight: "800", marginTop: 6 },
  statusBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#E7F6ED", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, gap: 4 },
  statusText: { color: "#275C4E", fontSize: 12, fontWeight: "800" },
  amountBlock: { alignItems: "center", paddingVertical: 26 },
  amountLabel: { color: "#83798A", fontSize: 13, fontWeight: "600" },
  amountValue: { color: "#24182D", fontSize: 34, fontWeight: "800", marginTop: 7 },
  amountMeta: { color: "#918999", fontSize: 11, fontWeight: "700", marginTop: 8 },
  infoList: { borderTopWidth: 1, borderTopColor: "#F0EBF3" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#F3EEF5", gap: 16 },
  infoLabel: { color: "#8A8290", fontSize: 12, fontWeight: "600" },
  infoValue: { color: "#2C2533", fontSize: 13, fontWeight: "700", flex: 1, textAlign: "right" },
  divider: { height: 1, backgroundColor: "#EDE8F0", marginVertical: 18 },
  bottomRow: { flexDirection: "row", gap: 10 },
  shareButton: { flex: 1, minHeight: 47, backgroundColor: "#6541C7", borderRadius: 13, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 7 },
  shareButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  viewButton: { flex: 1, minHeight: 47, borderWidth: 1, borderColor: "#DCD2EF", borderRadius: 13, justifyContent: "center", alignItems: "center" },
  viewButtonText: { color: "#6541C7", fontSize: 13, fontWeight: "800" },
});
