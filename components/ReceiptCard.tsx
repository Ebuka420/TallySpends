import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { money, type Transaction } from "../src/budget/ledger";
import type { ThemePalette } from "../src/theme";
import { transactionPresentation } from "../src/transactionPresentation";

export const ReceiptCard = forwardRef<View, { transaction: Transaction; theme: ThemePalette }>(function ReceiptCard({ transaction, theme }, ref) {
  const details = transactionPresentation(transaction, false);
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(transaction.date) ? `${transaction.date}T12:00:00` : transaction.date);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(transaction.date);
  const timestamp = Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) + (dateOnly ? "" : ` · ${date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`) : "Date unavailable";
  const rows = [["Date & time", timestamp], ["Category", transaction.category], ["Reference", transaction.id]];
  if (typeof transaction.memo === "string" && transaction.memo !== transaction.category && transaction.memo.trim()) rows.splice(2, 0, ["Note", transaction.memo]);
  return <View ref={ref} collapsable={false} style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <View style={s.brandRow}>
      <View style={s.brand}><Ionicons name="wallet-outline" size={17} color={theme.accent} /><Text style={[s.brandName, { color: theme.accent }]}>TALLYSPENDS</Text></View>
      <View style={[s.badge, { backgroundColor: theme.accentSoft }]}><Ionicons name="checkmark-circle" size={12} color={theme.accent} /><Text style={{ color: theme.accent, fontSize: 10, fontWeight: "700" }}>Recorded</Text></View>
    </View>
    <View style={s.hero}>
      <View style={[s.check, { backgroundColor: theme.accentSoft }]}><Ionicons name="checkmark" size={26} color={theme.accent} /></View>
      <Text style={[s.heading, { color: theme.textSecondary }]}>{details.heading}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[s.amount, { color: theme.textPrimary }]}>{money(Math.round(transaction.amount * 100))}</Text>
    </View>
    <View style={[s.party, { backgroundColor: theme.surfaceSoft }]}>
      <View style={[s.partyIcon, { backgroundColor: theme.surface }]}><Ionicons name={details.icon} size={21} color={theme.accent} /></View>
      <View style={{ flex: 1, gap: 4 }}><Text style={{ color: theme.textSecondary, fontSize: 10 }}>{transaction.type === "income" ? "FROM" : details.type === "merchant" ? "PAID FOR" : "TO"}</Text><Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 14 }}>{details.title}</Text><Text style={{ color: theme.textSecondary, fontSize: 11 }}>{details.subtitle}</Text></View>
    </View>
    <View style={[s.divider, { borderColor: theme.border }]} />
    {rows.map(([label, value]) => <View key={label} style={s.row}><Text style={[s.label, { color: theme.textSecondary }]}>{label}</Text><Text selectable style={[s.value, { color: theme.textPrimary }]}>{value}</Text></View>)}
    <View style={[s.footer, { borderColor: theme.border }]}><Ionicons name="receipt-outline" size={14} color={theme.textSecondary} /><Text style={{ flex: 1, color: theme.textSecondary, fontSize: 10.5, lineHeight: 16 }}>{transaction.demo ? "Demo wallet receipt · no bank transfer was made." : "Saved in your transaction history."}</Text></View>
  </View>;
});

const s = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 20, width: "100%" },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  brand: { flexDirection: "row", alignItems: "center", gap: 7 }, brandName: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, padding: 7 },
  hero: { alignItems: "center", paddingVertical: 24, gap: 9 },
  check: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heading: { fontSize: 12, fontWeight: "500" }, amount: { fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  party: { padding: 14, borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 12 },
  partyIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  divider: { borderTopWidth: 1, borderStyle: "dashed", marginVertical: 18 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 16, paddingBottom: 14 },
  label: { fontSize: 11, width: 80 }, value: { flex: 1, fontSize: 11.5, fontWeight: "600", textAlign: "right", lineHeight: 17 },
  footer: { borderTopWidth: 1, paddingTop: 14, flexDirection: "row", alignItems: "center", gap: 7 },
});
