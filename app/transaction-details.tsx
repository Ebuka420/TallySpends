import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReceiptCard } from "../components/ReceiptCard";
import { useReceiptShare } from "../components/useReceiptShare";
import { BudgetButton, BudgetLoading } from "../components/BudgetUI";
import { useAppStore } from "../src/store";

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { transactions, theme, budgetWallet, budgetError, reloadBudgetWallet } = useAppStore();
  const transaction = transactions.find(tx => tx.id === id);
  const { receiptRef, sharing, share } = useReceiptShare();
  const back = () => router.canGoBack() ? router.back() : router.replace("/(tabs)");
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
      <TouchableOpacity accessibilityLabel="Go back" onPress={back} style={{ padding: 10, borderRadius: 14, backgroundColor: theme.surface }}><Ionicons name="chevron-back" size={22} color={theme.textPrimary} /></TouchableOpacity>
      <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 19, fontWeight: "800" }}>Transaction receipt</Text>
    </View>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, width: "100%", maxWidth: 520, alignSelf: "center" }}>
      {!budgetWallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : transaction ? <ReceiptCard ref={receiptRef} transaction={transaction} theme={theme} /> : <View style={{ paddingVertical: 50, alignItems: "center", gap: 15 }}><Ionicons name="receipt-outline" size={38} color={theme.accent} /><Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Receipt unavailable</Text><Text style={{ color: theme.textSecondary }}>This transaction may have been removed.</Text><BudgetButton theme={theme} title="View history" onPress={() => router.replace("/transaction-history")} /></View>}
    </ScrollView>
    {transaction && <View style={{ padding: 20, gap: 4 }}><BudgetButton theme={theme} title={sharing ? "Sharing..." : "Share receipt"} disabled={sharing} onPress={share} /><BudgetButton theme={theme} title="Done" secondary onPress={back} /></View>}
  </SafeAreaView>;
}
