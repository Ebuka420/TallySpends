import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../src/store";
import { money, type Transaction } from "../src/budget/ledger";
import { completeTransaction } from "../src/transactionCompletion";
import { AmountInput, BudgetButton } from "./BudgetUI";
import { TransferReview, TransferSteps, useTransferAction } from "./TransferUI";

const methods = [
  { id: "bank", title: "Bank transfer", short: "Bank", detail: "Record a bank deposit", icon: "business-outline" as const },
  { id: "card", title: "Saved card", short: "Card", detail: "Choose one of your saved cards", icon: "card-outline" as const },
  { id: "regular", title: "Regular savings", short: "Regular", detail: "Record a regular savings deposit", icon: "repeat-outline" as const },
];
const accounts = [
  { id: "gtbank", title: "GTBank", short: "GTBank", detail: "Demo account · •••• 1234", icon: "business-outline" as const },
  { id: "access", title: "Access Bank", short: "Access", detail: "Demo account · •••• 5678", icon: "business-outline" as const },
  { id: "add", title: "Add account", short: "Add account", detail: "", icon: "add" as const },
];

export function WalletMovementScreen({ kind }: { kind: "deposit" | "withdrawal" }) {
  const router = useRouter();
  const { theme, availableBalance, transactions, savedCards, addTransaction, budgetWallet, budgetError } = useAppStore();
  const deposit = kind === "deposit";
  const options = deposit ? methods : accounts;
  const [selectedId, setSelectedId] = useState(deposit ? "bank" : "gtbank");
  const [cardId, setCardId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const action = useTransferAction();
  const selected = options.find(item => item.id === selectedId)!;
  const card = savedCards.find(item => item.id === cardId);
  const value = Number(amount);
  const over = !deposit && value > availableBalance;
  const ready = !!budgetWallet && !budgetError && Number.isFinite(value) && value > 0 && !over && (selectedId !== "card" || !!card);
  const detail = card && selectedId === "card" ? `${card.brand} •••• ${card.last4}` : selected.title;
  const recent = [...transactions].filter(tx => deposit ? /^Deposit/i.test(tx.title) && tx.type === "income" : /^Withdraw/i.test(tx.title) && tx.type === "expense")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  const submit = async () => {
    if (!ready) return;
    const transaction: Transaction = {
      id: `tx-${Date.now()}`, title: deposit ? `Deposit via ${selected.title}` : `Withdraw to ${selected.title}`,
      amount: value, category: deposit ? "Income" : "Withdrawal", type: deposit ? "income" : "expense",
      method: selected.title, methodDetail: deposit ? detail : selected.detail, demo: true, date: new Date().toISOString(),
    };
    await action.run(() => addTransaction(transaction), () => {
      setReview(false);
      completeTransaction(router, transaction.id);
    });
  };
  const openHistory = () => router.push({ pathname: "/transaction-history", params: { type: deposit ? "deposit" : "withdrawal" } });

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")} style={[s.headerButton, { backgroundColor: theme.surface }]}><Ionicons name="chevron-back" size={22} color={theme.textPrimary} /></Pressable>
      <Text style={[s.title, { color: theme.textPrimary }]}>{deposit ? "Add money" : "Withdraw money"}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${kind} history`} onPress={openHistory} style={[s.headerButton, { backgroundColor: theme.surface }]}><Ionicons name="time-outline" size={20} color={theme.accent} /></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <TransferSteps theme={theme} />
      <View style={[s.balance, { backgroundColor: theme.accentSoft }]}>
        <View style={[s.smallIcon, { backgroundColor: theme.surface }]}><Ionicons name="wallet-outline" size={20} color={theme.accent} /></View>
        <View style={{ flex: 1, gap: 4 }}><Text style={{ fontSize: 11, color: theme.textSecondary }}>Available balance</Text><Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "800" }}>{balanceVisible ? money(Math.round(availableBalance * 100)) : "₦••••••"}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={balanceVisible ? "Hide balance" : "Show balance"} onPress={() => setBalanceVisible(!balanceVisible)} style={{ padding: 9 }}><Ionicons name={balanceVisible ? "eye-outline" : "eye-off-outline"} size={19} color={theme.accent} /></Pressable>
      </View>
      <Text style={[s.section, { color: theme.textPrimary }]}>{deposit ? "How would you like to add money?" : "Where should it go?"}</Text>
      <View style={s.options}>
        {options.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selectedId === item.id }}
          onPress={() => item.id === "add" ? Alert.alert("Demo accounts", "Bank linking is not connected yet. Use a demo account to preview a withdrawal.") : setSelectedId(item.id)}
          style={[s.option, { borderColor: selectedId === item.id ? theme.accent : theme.border, backgroundColor: selectedId === item.id ? theme.accentSoft : theme.surface }]}>
          <Ionicons name={item.icon} size={22} color={theme.accent} /><Text style={{ color: selectedId === item.id ? theme.accent : theme.textSecondary, fontSize: 11, fontWeight: "700" }}>{item.short}</Text>
        </Pressable>)}
      </View>
      <View style={[s.amountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={s.method}><View style={[s.smallIcon, { backgroundColor: theme.surfaceSoft }]}><Ionicons name={selected.icon} size={19} color={theme.accent} /></View><View style={{ flex: 1, gap: 4 }}><Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "700" }}>{selected.title}</Text><Text style={{ color: theme.textSecondary, fontSize: 11 }}>{selected.detail}</Text></View></View>
        <Text style={[s.amountLabel, { color: theme.textSecondary }]}>{deposit ? "Amount to add" : "Amount to withdraw"}</Text>
        <View style={[s.amountRow, { borderColor: over ? theme.danger : theme.border }]}><Text style={{ color: theme.textPrimary, fontSize: 30, fontWeight: "700" }}>₦</Text><AmountInput theme={theme} title={deposit ? "Amount to deposit" : "Amount to withdraw"} available={deposit ? undefined : Math.round(availableBalance * 100)} value={amount} onChangeText={setAmount} placeholder="0.00" style={s.amountInput} /></View>
        <View style={s.quickAmounts}>{[200, 1000, 5000, 10000, 20000].map(preset => <Pressable key={preset} accessibilityRole="button" accessibilityLabel={`Set amount to ${preset} naira`} onPress={() => setAmount(String(preset))} style={[s.quick, { backgroundColor: value === preset ? theme.accentSoft : theme.surfaceSoft, borderColor: value === preset ? theme.accent : "transparent" }]}><Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>{money(preset * 100).replace(/\.00$/, "")}</Text></Pressable>)}</View>
        {over && <Text accessibilityLiveRegion="polite" style={{ color: theme.danger, fontSize: 12, marginTop: 12 }}>This is more than your available balance.</Text>}
        {deposit && selectedId === "card" && <View style={{ gap: 8, marginTop: 18 }}>
          {savedCards.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: item.id === cardId }} onPress={() => setCardId(item.id)} style={[s.savedCard, { borderColor: cardId === item.id ? theme.accent : theme.border }]}><Ionicons name="card-outline" size={20} color={theme.accent} /><Text style={{ color: theme.textPrimary, flex: 1, fontSize: 12 }}>{item.brand} •••• {item.last4}</Text><Ionicons name={cardId === item.id ? "radio-button-on" : "radio-button-off"} color={theme.accent} size={18} /></Pressable>)}
          {!savedCards.length && <Pressable onPress={() => router.push("/linkedcards")}><Text style={{ color: theme.accent, fontSize: 12 }}>Add a saved card to continue →</Text></Pressable>}
        </View>}
        {selectedId === "regular" && <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 14 }}>This records one deposit. Automatic recurring deposits are not connected yet.</Text>}
      </View>
      <View style={s.after}><Text style={{ color: theme.textSecondary, fontSize: 12 }}>Available after {kind}</Text><Text style={{ color: over ? theme.danger : theme.textPrimary, fontSize: 14, fontWeight: "700" }}>{balanceVisible ? money(Math.round((availableBalance + (deposit ? value || 0 : -(value || 0))) * 100)) : "₦••••••"}</Text></View>
      <View style={s.sectionRow}><Text style={[s.section, { color: theme.textPrimary, marginTop: 0 }]}>{deposit ? "Recent deposits" : "Recent withdrawals"}</Text><Pressable onPress={openHistory}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "600" }}>View all</Text></Pressable></View>
      <View style={[s.history, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {recent.length ? recent.map((tx, index) => <Pressable key={tx.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/transaction-details", params: { id: tx.id } })} style={[s.historyRow, { borderTopWidth: index ? 1 : 0, borderColor: theme.border }]}>
          <View style={[s.smallIcon, { backgroundColor: theme.accentSoft }]}><Ionicons name={deposit ? "arrow-down-outline" : "arrow-up-outline"} size={18} color={theme.accent} /></View><View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "600" }}>{tx.title}</Text><Text style={{ color: theme.textSecondary, fontSize: 10 }}>{new Date(tx.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</Text></View><Text style={{ color: deposit ? theme.success : theme.textPrimary, fontSize: 12, fontWeight: "700" }}>{deposit ? "+" : "−"}{money(Math.round(tx.amount * 100))}</Text>
        </Pressable>) : <View style={{ padding: 20, alignItems: "center", gap: 8 }}><Ionicons name="receipt-outline" size={23} color={theme.textSecondary} /><Text style={{ color: theme.textSecondary, fontSize: 12 }}>Your {deposit ? "deposits" : "withdrawals"} will appear here.</Text></View>}
      </View>
    </ScrollView>
    <View style={[s.footer, { backgroundColor: theme.background, borderColor: theme.border }]}>
      {!!budgetError && <Text style={{ color: theme.danger, fontSize: 12 }}>{budgetError}</Text>}
      <BudgetButton theme={theme} title="Review transaction" disabled={!ready || action.busy} onPress={() => { Keyboard.dismiss(); setReview(true); }} />
      <Text style={{ color: theme.textSecondary, fontSize: 10.5, textAlign: "center", paddingTop: 8 }}>Check the details before you confirm.</Text>
    </View>
    <TransferReview visible={review} kind={kind} theme={theme} amount={value} detail={detail} busy={action.busy} error={action.error} onEdit={() => setReview(false)} onConfirm={submit} />
  </SafeAreaView>;
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  headerButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, title: { flex: 1, fontSize: 20, fontWeight: "800", letterSpacing: -.4 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 24 }, balance: { flexDirection: "row", gap: 12, alignItems: "center", padding: 16, borderRadius: 20 },
  smallIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  section: { fontSize: 13, fontWeight: "700", marginTop: 24, marginBottom: 12 },
  options: { flexDirection: "row", gap: 10, marginBottom: 18 }, option: { flex: 1, borderWidth: 1, borderRadius: 17, paddingVertical: 15, alignItems: "center", gap: 8 },
  amountCard: { borderWidth: 1, borderRadius: 24, padding: 18 }, method: { flexDirection: "row", alignItems: "center", gap: 10 }, amountLabel: { fontSize: 11, textAlign: "center", marginTop: 24 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderBottomWidth: 1, marginBottom: 16, minHeight: 78 }, amountInput: { flex: 1, maxWidth: 230, minHeight: 74, fontSize: 36, fontWeight: "800", textAlign: "center", letterSpacing: -1 },
  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center" }, quick: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9 },
  savedCard: { borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: "row", alignItems: "center", gap: 9 }, after: { flexDirection: "row", justifyContent: "space-between", gap: 10, paddingHorizontal: 4, paddingTop: 15 },
  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 26 }, history: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12 }, historyRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 13 },
  footer: { borderTopWidth: 1, paddingHorizontal: 20, paddingBottom: 10, paddingTop: 6 },
});
