import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Transaction } from "../src/budget/ledger";
import { useAppStore } from "../src/store";
import { BudgetButton } from "./BudgetUI";
import { ReceiptCard } from "./ReceiptCard";
import { useReceiptShare } from "./useReceiptShare";

type Props = { visible: boolean; transaction: Transaction | null; onClose: () => void; onViewReceipt?: () => void };
export default function TransactionReceiptModal({ visible, transaction, onClose, onViewReceipt }: Props) {
  const { theme } = useAppStore();
  const insets = useSafeAreaInsets();
  const { receiptRef, sharing, share } = useReceiptShare();
  if (!transaction) return null;
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.4)" }}>
      <Pressable accessibilityLabel="Close receipt" onPress={onClose} style={{ position: "absolute", inset: 0 }} />
      <View accessibilityViewIsModal style={{ maxHeight: "94%", width: "100%", maxWidth: 520, alignSelf: "center", backgroundColor: theme.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: Math.max(16, insets.bottom) }}>
        <View style={{ width: 36, height: 4, borderRadius: 4, backgroundColor: theme.border, alignSelf: "center", marginTop: 10 }} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10 }}>
          <View><Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "800" }}>Your receipt</Text><Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 3 }}>Saved. You're back on your dashboard.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close receipt" onPress={onClose} style={{ padding: 12 }}><Ionicons name="close" size={22} color={theme.textPrimary} /></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}><ReceiptCard ref={receiptRef} transaction={transaction} theme={theme} /></ScrollView>
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><BudgetButton title={sharing ? "Sharing..." : "Share receipt"} theme={theme} secondary disabled={sharing} onPress={share} /></View><View style={{ flex: 1 }}><BudgetButton title="Done" theme={theme} onPress={onClose} /></View></View>
          {onViewReceipt && <Pressable accessibilityRole="button" onPress={onViewReceipt} style={{ alignItems: "center", paddingTop: 14, paddingBottom: 4 }}><Text style={{ color: theme.accent, fontWeight: "600", fontSize: 12 }}>View full receipt</Text></Pressable>}
        </View>
      </View>
    </View>
  </Modal>;
}
