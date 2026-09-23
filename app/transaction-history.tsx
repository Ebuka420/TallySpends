import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AmountInput, BudgetButton, BudgetLoading } from "../components/BudgetUI";
import { BudgetDate, PlanningSheet } from "../components/PlanningUI";
import { money } from "../src/budget/ledger";
import { useAppStore } from "../src/store";
import { transactionPresentation } from "../src/transactionPresentation";
import { defaultHistoryFilters, filterHistory, historySections, historyTotals, validateHistoryFilters, transactionDate, type HistoryFilters, type HistoryType, type HistoryRange, type HistorySort } from "../src/transactions/history";

const types: { value: HistoryType; label: string }[] = [{ value: "all", label: "All" }, { value: "income", label: "Money in" }, { value: "expense", label: "Money out" }, { value: "transfer", label: "Transfers" }, { value: "deposit", label: "Deposits" }, { value: "withdrawal", label: "Withdrawals" }];
const ranges: { value: HistoryRange; label: string }[] = [{ value: "all", label: "Any time" }, { value: "today", label: "Today" }, { value: "week", label: "Last 7 days" }, { value: "month", label: "This month" }, { value: "custom", label: "Custom dates" }];
const sorts: { value: HistorySort; label: string }[] = [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "largest", label: "Largest amount" }, { value: "smallest", label: "Smallest amount" }];

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; type?: string }>();
  const { transactions, theme, themeMode, budgetWallet, budgetError, reloadBudgetWallet } = useAppStore();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<HistoryFilters>(() => ({ ...defaultHistoryFilters(), category: params.category || null, type: types.some(item => item.value === params.type) ? params.type as HistoryType : "all" }));
  const [draft, setDraft] = useState(filters);
  const [sheet, setSheet] = useState<"filters" | "sort" | null>(null);
  useEffect(() => { setFilters(current => ({ ...current, category: params.category || null, type: types.some(item => item.value === params.type) ? params.type as HistoryType : "all" })); }, [params.category, params.type]);
  const categories = useMemo(() => [...new Set(transactions.map(tx => tx.category).filter(Boolean))].sort(), [transactions]);
  const results = useMemo(() => filterHistory(transactions, filters, search), [transactions, filters, search]);
  const totals = useMemo(() => historyTotals(results), [results]);
  const sections = useMemo(() => historySections(results, filters.sort), [results, filters.sort]);
  const error = validateHistoryFilters(draft);
  const previewCount = filterHistory(transactions, draft, search).length;
  const count = Number(filters.type !== "all") + Number(filters.range !== "all") + Number(!!filters.category) + Number(!!filters.minimum || !!filters.maximum);
  const reset = () => { setFilters(defaultHistoryFilters()); setSearch(""); };
  const openFilters = () => { Keyboard.dismiss(); setDraft(filters); setSheet("filters"); };
  const chip = (label: string, selected: boolean, onPress: () => void, key = label) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[s.chip, { backgroundColor: selected ? theme.accent : theme.surface, borderColor: selected ? theme.accent : theme.border }]}><Text style={{ color: selected ? theme.background : theme.textSecondary, fontSize: 12, fontWeight: "600" }}>{label}</Text></Pressable>;
  const removable = (label: string, onPress: () => void) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={`Remove ${label} filter`} onPress={onPress} style={[s.removable, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.accent, fontSize: 11 }}>{label}</Text><Ionicons name="close" size={13} color={theme.accent} /></Pressable>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={s.header}><Pressable accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")} style={[s.iconButton, { backgroundColor: theme.surface }]}><Ionicons name="chevron-back" size={22} color={theme.textPrimary} /></Pressable><View style={{ flex: 1 }}><Text style={[s.title, { color: theme.textPrimary }]}>Transaction history</Text><Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 3 }}>Every money moment, in one place.</Text></View></View>
    <View style={s.controls}>
      <View style={s.searchRow}><View style={[s.search, { backgroundColor: theme.surface, borderColor: theme.border }]}><Ionicons name="search-outline" size={18} color={theme.textSecondary} /><TextInput accessibilityLabel="Search transactions" placeholder="Name, note, amount or reference" placeholderTextColor={theme.textSecondary} value={search} onChangeText={setSearch} style={{ flex: 1, color: theme.textPrimary, fontSize: 12, paddingVertical: 12 }} returnKeyType="search" autoCorrect={false} />{!!search && <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch("")}><Ionicons name="close-circle" size={18} color={theme.textSecondary} /></Pressable>}</View><Pressable accessibilityRole="button" accessibilityLabel={`Filters, ${count} active`} onPress={openFilters} style={[s.filterButton, { backgroundColor: theme.accentSoft }]}><Ionicons name="options-outline" size={21} color={theme.accent} /><Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>{count ? `Filter (${count})` : "Filter"}</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>{types.map(item => chip(item.label, filters.type === item.value, () => setFilters({ ...filters, type: item.value })))}</ScrollView>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {filters.range !== "all" && removable(filters.range === "custom" ? `${filters.from} – ${filters.to}` : ranges.find(r => r.value === filters.range)!.label, () => setFilters({ ...filters, range: "all" }))}
        {filters.category && removable(filters.category, () => setFilters({ ...filters, category: null }))}
        {(filters.minimum || filters.maximum) && removable(`${filters.minimum ? `₦${Number(filters.minimum).toLocaleString()}` : "₦0"} – ${filters.maximum ? `₦${Number(filters.maximum).toLocaleString()}` : "No limit"}`, () => setFilters({ ...filters, minimum: "", maximum: "" }))}
      </View>
    </View>
    {!budgetWallet || budgetError ? <View style={{ padding: 20 }}><BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /></View> : <SectionList
      sections={sections} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} stickySectionHeadersEnabled={false}
      initialNumToRender={15} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 35 }}
      ListHeaderComponent={<View>
        <View style={s.summaryRow}>{[{ label: "Money in", value: totals.income, icon: "arrow-down-outline" as const }, { label: "Money out", value: totals.expense, icon: "arrow-up-outline" as const }].map(item => <View key={item.label} style={[s.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Ionicons name={item.icon} size={14} color={theme.accent} /><Text style={{ color: theme.textSecondary, fontSize: 11 }}>{item.label}</Text></View><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 10 }}>{money(item.value)}</Text><Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 5 }}>For these results</Text></View>)}</View>
        <View style={s.resultsRow}><Text style={{ color: theme.textSecondary, fontSize: 12 }}>{results.length} {results.length === 1 ? "transaction" : "transactions"}</Text><Pressable accessibilityRole="button" accessibilityLabel="Sort transactions" onPress={() => { Keyboard.dismiss(); setSheet("sort"); }} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Text style={{ color: theme.accent, fontSize: 11, fontWeight: "600" }}>{sorts.find(item => item.value === filters.sort)!.label}</Text><Ionicons name="swap-vertical" size={14} color={theme.accent} /></Pressable></View>
      </View>}
      renderSectionHeader={({ section }) => <Text style={[s.day, { color: theme.textSecondary }]}>{section.title}</Text>}
      renderItem={({ item, index, section }) => {
        const details = transactionPresentation(item, themeMode === "dark");
        const date = transactionDate(item.date);
        const time = /^\d{4}-\d{2}-\d{2}$/.test(item.date) || !Number.isFinite(date.getTime()) ? "" : date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
        const last = index === section.data.length - 1;
        return <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}, ${item.type === "income" ? "received" : "spent"} ${money(Math.round(item.amount * 100))}`} onPress={() => router.push({ pathname: "/transaction-details", params: { id: item.id } })}
          style={({ pressed }) => [s.transaction, { backgroundColor: pressed ? theme.accentSoft : theme.surface, borderColor: theme.border, borderTopWidth: index ? 0 : 1, borderTopLeftRadius: index ? 0 : 18, borderTopRightRadius: index ? 0 : 18, borderBottomLeftRadius: last ? 18 : 0, borderBottomRightRadius: last ? 18 : 0 }]}>
          <View style={[s.transactionIcon, { backgroundColor: theme.accentSoft }]}><Ionicons name={details.icon} size={20} color={theme.accent} /></View>
          <View style={{ flex: 1, gap: 5 }}><Text numberOfLines={1} style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "700" }}>{details.type === "transfer" ? `To ${details.title}` : item.title}</Text><Text numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 10.5 }}>{item.category}{time ? ` · ${time}` : ""}</Text></View>
          <View style={{ alignItems: "flex-end", gap: 6, maxWidth: "43%" }}><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: item.type === "income" ? theme.success : theme.textPrimary, fontSize: 13, fontWeight: "800" }}>{item.type === "income" ? "+" : "−"}{money(Math.round(item.amount * 100))}</Text><Ionicons name="chevron-forward" color={theme.textSecondary} size={12} /></View>
        </Pressable>;
      }}
      ListEmptyComponent={<View style={s.empty}><View style={[s.emptyIcon, { backgroundColor: theme.accentSoft }]}><Ionicons name={transactions.length ? "search-outline" : "receipt-outline"} size={29} color={theme.accent} /></View><Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: "800" }}>{transactions.length ? "No matching transactions" : "Your story starts here"}</Text><Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 12, lineHeight: 19 }}>{transactions.length ? "Try another search or adjust your filters." : "Recorded transactions will appear here with their receipts."}</Text>{(count > 0 || search) ? <BudgetButton theme={theme} title="Clear filters & search" secondary onPress={reset} /> : null}</View>}
    />}
    <PlanningSheet visible={sheet === "filters"} theme={theme} title="Filter transactions" onClose={() => setSheet(null)}>
      <Text style={[s.filterLabel, { color: theme.textPrimary }]}>Transaction type</Text><View style={s.wrap}>{types.map(item => chip(item.label, draft.type === item.value, () => setDraft({ ...draft, type: item.value })))}</View>
      <Text style={[s.filterLabel, { color: theme.textPrimary }]}>Date range</Text><View style={s.wrap}>{ranges.map(item => chip(item.label, draft.range === item.value, () => setDraft({ ...draft, range: item.value })))}</View>
      {draft.range === "custom" && <><BudgetDate theme={theme} label="From" value={draft.from} onChange={from => setDraft({ ...draft, from })} /><BudgetDate theme={theme} label="To" value={draft.to} onChange={to => setDraft({ ...draft, to })} /></>}
      <Text style={[s.filterLabel, { color: theme.textPrimary }]}>Category</Text><View style={s.wrap}>{chip("All categories", !draft.category, () => setDraft({ ...draft, category: null }))}{categories.map(category => chip(category, category === draft.category, () => setDraft({ ...draft, category })))}</View>
      <Text style={[s.filterLabel, { color: theme.textPrimary }]}>Amount range</Text><View style={{ flexDirection: "row", gap: 12 }}>{(["minimum", "maximum"] as const).map(key => <View key={key} style={{ flex: 1, gap: 6 }}><Text style={{ color: theme.textSecondary, fontSize: 11 }}>{key === "minimum" ? "Minimum (₦)" : "Maximum (₦)"}</Text><AmountInput allowEmpty theme={theme} title={key === "minimum" ? "Minimum amount" : "Maximum amount"} value={draft[key]} placeholder={key === "minimum" ? "0" : "No limit"} onChangeText={value => setDraft({ ...draft, [key]: value })} style={[s.amountField, { borderColor: theme.border }]} /></View>)}</View>
      {!!error && <Text accessibilityLiveRegion="polite" style={{ color: theme.danger, fontSize: 12 }}>{error}</Text>}
      <BudgetButton theme={theme} title={`Show ${previewCount} ${previewCount === 1 ? "transaction" : "transactions"}`} disabled={!!error} onPress={() => { setFilters(draft); setSheet(null); }} />
      <BudgetButton theme={theme} title="Reset filters" secondary onPress={() => setDraft(defaultHistoryFilters())} />
    </PlanningSheet>
    <PlanningSheet visible={sheet === "sort"} theme={theme} title="Sort transactions" onClose={() => setSheet(null)}>{sorts.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ checked: filters.sort === item.value }} onPress={() => { setFilters({ ...filters, sort: item.value }); setSheet(null); }} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 14 }}><Text style={{ color: theme.textPrimary, fontSize: 15 }}>{item.label}</Text><Ionicons name={filters.sort === item.value ? "radio-button-on" : "radio-button-off"} size={22} color={theme.accent} /></Pressable>)}</PlanningSheet>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 }, iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, title: { fontSize: 21, fontWeight: "800", letterSpacing: -.4 },
  controls: { paddingHorizontal: 20, paddingBottom: 6 }, searchRow: { flexDirection: "row", gap: 9 }, search: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12 }, filterButton: { paddingHorizontal: 12, borderRadius: 15, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 3 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: 24 }, removable: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, marginBottom: 8 },
  summaryRow: { flexDirection: "row", gap: 12, marginTop: 6 }, summary: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 15 }, resultsRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 22, paddingBottom: 2 }, day: { fontSize: 11, fontWeight: "700", paddingTop: 22, paddingBottom: 10 },
  transaction: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, paddingVertical: 16, borderWidth: 1 }, transactionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 44, paddingHorizontal: 24, gap: 12 }, emptyIcon: { width: 66, height: 66, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  filterLabel: { fontSize: 13, fontWeight: "700", marginTop: 8 }, wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, amountField: { borderWidth: 1, borderRadius: 13, minHeight: 52, padding: 13, fontSize: 16 },
});
