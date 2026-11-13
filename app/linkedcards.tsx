import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ScrollViewInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import BankLogo from "../components/BankLogo";
import BrandMark from "../components/BrandMark";
import { useThemeTokens } from "../src/ThemeExperience";
import { accountInsights, accountMoney, selectLinkedAccount, type AccountPeriod } from "../src/banking/insights";
import { BANK_COLORS } from "../src/banking/carousel";
import type { BankSession, LinkedBankAccount } from "../src/banking/backend";
import { useDashboardAccounts } from "../src/banking/useDashboardAccounts";
import { getProfileSnapshot, subscribeProfile } from "../src/profile/repository";
import { usePreferences } from "../src/settings";
import { useAppStore } from "../src/store";
import { NIGERIAN_BANKS } from "../src/data/banks";
import type { ThemePalette } from "../src/theme";

export default function LinkedCardsScreen() {
  const store = useAppStore();
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const { accountId } = useLocalSearchParams<{ accountId?: string | string[] }>();
  const requested = typeof accountId === "string" ? accountId : undefined;
  return <LinkedAccounts key={`${profile.scope ?? "signed-out"}:${requested ?? "all"}`} owner={profile.scope ?? ""}
    requested={requested} session={{ token: store.token, refreshToken: store.refreshToken,
      saveTokens: async (token, refresh) => { await store.login(token, refresh); } }} />;
}

function bankColor(account: LinkedBankAccount, theme: ThemePalette) {
  const bank = NIGERIAN_BANKS.find(item => item.slug === account.bankSlug || item.name.toLowerCase() === account.bankName.toLowerCase()
    || (account.bankName.toLowerCase() === "gtbank" && item.slug === "guaranty-trust-bank"));
  return BANK_COLORS[bank?.slug ?? ""] || theme.hero;
}

function LinkedAccounts({ owner, requested, session }: { owner: string; requested?: string; session: BankSession }) {
  const theme = useThemeTokens();
  const router = useRouter();
  const preferences = usePreferences();
  const linked = useDashboardAccounts(owner, session);
  const [selectedId, setSelectedId] = useState(requested);
  const [period, setPeriod] = useState<AccountPeriod>("month");
  const [hiddenOverride, setHiddenOverride] = useState<boolean | null>(null);
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const hidden = hiddenOverride ?? (!preferences.loaded || preferences.values.privateMode);
  const selected = selectLinkedAccount(linked.accounts, selectedId);
  const insights = useMemo(() => selected ? accountInsights(selected, period) : null, [selected, period]);
  const { width, fontScale } = useWindowDimensions();
  const cardWidth = Math.min(320, Math.max(240, width - 72));
  const branches = useRef<ScrollViewInstance>(null);
  const selectedIndex = linked.accounts.findIndex(account => account.id === selected?.id);
  useEffect(() => {
    if (selectedIndex >= 0) branches.current?.scrollTo({ x: selectedIndex * (cardWidth + 14), animated: false });
  }, [selectedIndex, cardWidth]);
  const money = (amount: number | undefined) => hidden ? "••••" : accountMoney(amount, selected?.currency);
  const activePeriod = period === "month" ? "This month" : "Last 30 days";
  const topCategory = insights?.categories[0];
  const net = insights?.net;
  const openLink = () => router.push("/linkbank");
  const text = { color: theme.textPrimary };
  const muted = { color: theme.textSecondary };
  const surface = { backgroundColor: theme.surface, borderColor: theme.border };
  const title = (value: string) => <Text accessibilityRole="header" style={[s.sectionTitle, text]}>{value}</Text>;

  return <SafeAreaView style={[s.screen, { backgroundColor: theme.background }]}>
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        style={[s.iconButton, surface]}><Ionicons name="arrow-back" size={21} color={theme.textPrimary} /></Pressable>
      <Text style={[s.headerTitle, text]}>Linked accounts</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Link another bank account" onPress={openLink}
        style={[s.iconButton, { backgroundColor: theme.accent, borderColor: theme.accent }]}><Ionicons name="add" size={23} color={theme.onAccent} /></Pressable>
    </View>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={linked.loading} onRefresh={linked.retry} tintColor={theme.accent} />}>
      <View style={s.intro}>
        <Text style={[s.eyebrow, { color: theme.accent }]}>YOUR MONEY, CONNECTED</Text>
        <Text accessibilityRole="header" style={[s.pageTitle, text]}>A clearer view.{"\n"}Account by account.</Text>
        <Text style={[s.copy, muted]}>Follow each account from its balance to the little details behind your spending.</Text>
      </View>

      <View style={s.network}>
        <View style={[s.root, surface]}>
          <BrandMark size={23} palette={theme} />
          <Text style={[s.rootText, text]}>Your account network</Text>
          <View style={[s.count, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.accent, fontWeight: "800" }}>{!linked.accounts.length && (linked.loading || linked.error) ? "—" : linked.accounts.length}</Text></View>
        </View>
        <View style={[s.trunk, { backgroundColor: theme.border }]} />
        {linked.accounts.length > 0 ? <ScrollView horizontal ref={branches} showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.branches} snapToInterval={cardWidth + 14} decelerationRate="fast">
          {linked.accounts.map(account => {
            const active = selected?.id === account.id;
            const color = bankColor(account, theme);
            return <View key={account.id} style={{ width: cardWidth + 14, alignItems: "center" }}>
              <View style={{ height: 1, width: "100%", backgroundColor: theme.border }} />
              <View style={[s.stem, { backgroundColor: active ? theme.accent : theme.border }]} />
              <Pressable accessibilityRole="button" accessibilityLabel={`View ${account.bankName} ${account.maskedAccountNumber ?? "account"}`}
                accessibilityState={{ selected: active }} onPress={() => { setSelectedId(account.id); setVisibleTransactions(5); }}
                style={[s.accountCard, { width: cardWidth, backgroundColor: color, borderColor: active ? theme.accentHighlight : color, borderWidth: active ? 2 : 1, opacity: active ? 1 : .76 }]}>
                <Svg pointerEvents="none" width={cardWidth} height={220} viewBox="0 0 320 220" style={StyleSheet.absoluteFill}>
                  <Path d="M210 -30 C120 100 350 90 290 250 M280 -30 C175 70 365 140 310 250" fill="none" stroke="#FFFFFF" opacity={.13} strokeWidth={1} />
                </Svg>
                <View style={s.row}>
                  <View style={s.bankIcon}><BankLogo bank={account} size={25} color="#FFFFFF" /></View>
                  <Text numberOfLines={2} style={s.bankName}>{account.bankName}</Text>
                  <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} size={20} color="#FFFFFF" />
                </View>
                <View style={{ gap: 5, marginTop: 23 }}>
                  <Text style={s.cardLabel}>AVAILABLE BALANCE</Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={s.cardAmount}>{hidden ? "••••" : accountMoney(account.availableBalance, account.currency)}</Text>
                </View>
                <View style={[s.row, { marginTop: 20 }]}>
                  <Text numberOfLines={1} style={s.cardHolder}>{account.accountName}</Text>
                  <Text style={s.cardNumber}>{account.maskedAccountNumber ?? account.currency ?? "Linked"}</Text>
                </View>
              </Pressable>
            </View>;
          })}
        </ScrollView> : <View style={[s.emptyNetwork, surface]}>
          <View style={[s.emptyIcon, { backgroundColor: theme.accentSoft }]}><Ionicons name="git-network-outline" size={30} color={theme.accent} /></View>
          <Text style={[s.emptyTitle, text]}>{linked.loading ? "Finding your connections" : linked.error ? "Your connections will appear here" : "One connection. More clarity."}</Text>
          <Text style={[s.copy, muted, { textAlign: "center" }]}>{linked.loading ? "Loading your linked bank accounts…" : linked.error ? "We couldn't load your accounts just now. Refresh to try again." : "Link a bank to bring its balance, activity and spending patterns into one view."}</Text>
          {linked.loading ? <ActivityIndicator color={theme.accent} /> : <Pressable accessibilityRole="button" onPress={linked.error ? linked.retry : openLink} style={[s.primaryButton, { backgroundColor: theme.accent }]}>
            <Text style={{ color: theme.onAccent, fontWeight: "700" }}>{linked.error ? "Refresh accounts" : "Link a bank account"}</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.onAccent} />
          </Pressable>}
        </View>}
      </View>

      {!linked.accounts.length && <View style={{ alignItems: "center", paddingHorizontal: 28, marginTop: -20 }}>
        <View style={[s.trunk, { backgroundColor: theme.border }]} />
        <View style={{ flexDirection: "row", width: "100%" }}>
          {([['wallet-outline', 'Balances'], ['swap-vertical-outline', 'Cash flow'], ['analytics-outline', 'Patterns']] as const).map(([icon, label]) => <View key={label} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ width: "100%", height: 1, backgroundColor: theme.border }} />
            <View style={[s.stem, { backgroundColor: theme.border, height: 16 }]} />
            <View style={[surface, { borderWidth: 1, borderRadius: 17, paddingVertical: 16, paddingHorizontal: 6, alignItems: "center", gap: 8, alignSelf: "stretch", marginHorizontal: 4 }]}>
              <Ionicons name={icon} size={22} color={theme.accent} /><Text style={[s.small, text, { fontWeight: "600", textAlign: "center" }]}>{label}</Text>
            </View>
          </View>)}
        </View>
      </View>}

      {linked.accounts.length > 0 && <View style={[s.row, s.sectionPad, { justifyContent: "space-between" }]}>
        <Text style={[s.small, muted, { flex: 1 }]}>{linked.accounts.length > 1 ? "Swipe to explore · tap to select" : "Your linked bank, in focus"}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={hidden ? "Show account amounts" : "Hide account amounts"} onPress={() => setHiddenOverride(!hidden)} style={s.visibility}>
          <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={17} color={theme.accent} /><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>{hidden ? "Show" : "Hide"}</Text>
        </Pressable>
      </View>}
      {linked.error && linked.accounts.length > 0 && <View style={[s.notice, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name="cloud-offline-outline" size={20} color={theme.accent} />
        <Text style={[s.copy, muted, { flex: 1 }]}>Account details could not be refreshed. Pull down to try again.</Text>
      </View>}

      {selected && insights ? <View style={s.details}>
        <View style={s.sectionHeading}>
          <View style={{ flex: 1, gap: 4 }}>{title("The account story")}<Text style={[s.small, muted]}>{selected.bankName} · {selected.currency ?? "Currency unavailable"}</Text></View>
          <Ionicons name="analytics-outline" color={theme.accent} size={24} />
        </View>
        <View accessibilityRole="tablist" style={[s.periods, { backgroundColor: theme.surfaceSoft }]}>
          {([['month', 'This month'], ['30days', 'Last 30 days']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: period === value }}
            onPress={() => { setPeriod(value); setVisibleTransactions(5); }} style={[s.period, period === value && { backgroundColor: theme.surface }]}>
            <Text style={{ color: period === value ? theme.accent : theme.textSecondary, fontWeight: "700", fontSize: 13 }}>{label}</Text>
          </Pressable>)}
        </View>
        <View style={[s.insightHero, { backgroundColor: theme.accentSoft }]}>
          <View style={s.row}><Ionicons name="sparkles-outline" size={19} color={theme.accent} /><Text style={[s.eyebrow, { color: theme.accent }]}>IN FOCUS</Text></View>
          <Text style={[s.insightHeadline, text]}>{!insights.available ? "Your story starts with your activity." : !insights.count ? "A quiet chapter so far." : !insights.totalsAvailable ? "Activity is here. Amounts need context." : hidden ? "Your account story is private." : topCategory ? `${topCategory.name} leads your outgoings.` : "Money in, a little clearer."}</Text>
          <Text style={[s.copy, muted]}>{!insights.available ? "Transactions aren't available for this account yet. Insights will appear when activity is supplied." : !insights.count ? `No recorded transactions in this period. Try another period or refresh your account.` : !insights.totalsAvailable ? "Totals are unavailable until the account currency and amounts can be confirmed." : hidden ? "Reveal amounts when you're ready to explore the details." : topCategory ? `${Math.round(topCategory.share * 100)}% of recorded money out went to this category — ${money(topCategory.amount)} ${period === "month" ? "this month" : "over the last 30 days"}.` : `${money(insights.incoming)} recorded coming into this account ${period === "month" ? "this month" : "over the last 30 days"}.`}</Text>
        </View>

        <View style={{ alignItems: "center", marginTop: -16 }}>
          <View style={[s.trunk, { backgroundColor: theme.border }]} />
          <View style={[s.flowFork, { borderColor: theme.border }]} />
        </View>
        <View style={[s.flowRow, fontScale > 1.4 && { flexDirection: "column" }]}>
          <FlowCard label="Money in" amount={money(insights.incoming)} icon="arrow-down" theme={theme} incoming />
          <FlowCard label="Money out" amount={money(insights.outgoing)} icon="arrow-up" theme={theme} />
        </View>
        <View style={[s.netRow, surface]}>
          <Text style={[s.copy, muted]}>Recorded net flow</Text>
          <Text style={[s.netAmount, { color: net !== undefined && net < 0 ? theme.textPrimary : theme.accent }]}>{money(net)}</Text>
        </View>
        <Text style={[s.small, muted]}>Based on available records for this account only. Transfers may appear in money in or money out; net flow is not a savings total.{insights.skipped ? ` ${insights.skipped} invalid or duplicate records excluded.` : ""}</Text>

        <View style={[s.panel, surface]}>
          <View style={s.sectionHeading}>{title("Where it went")}<Text style={[s.small, muted]}>{activePeriod}</Text></View>
          {insights.totalsAvailable && insights.categories.length ? insights.categories.slice(0, 5).map((category, index) => <View key={category.name} style={{ gap: 8 }}>
            <View style={s.row}><View style={[s.categoryDot, { backgroundColor: theme.chart[index % theme.chart.length] }]} /><Text style={[s.categoryName, text]}>{category.name}</Text><Text style={[s.categoryValue, text]}>{money(category.amount)}</Text></View>
            <View style={[s.bar, { backgroundColor: theme.surfaceSoft }]}><View style={{ width: hidden ? "0%" : `${category.share * 100}%`, height: 5, borderRadius: 4, backgroundColor: theme.chart[index % theme.chart.length] }} /></View>
          </View>) : <Text style={[s.copy, muted]}>{!insights.available ? "Spending categories will appear with your account activity." : "No spending breakdown available for this period."}</Text>}
          {insights.categories.length > 5 && <Text style={[s.small, muted]}>Showing your five largest categories.</Text>}
        </View>

        {insights.largest && insights.totalsAvailable && <View style={[s.spotlight, { backgroundColor: theme.surfaceSoft }]}>
          <View style={[s.spotlightIcon, { backgroundColor: theme.surface }]}><Ionicons name="scan-outline" size={23} color={theme.accent} /></View>
          <View style={{ flex: 1, gap: 5 }}><Text style={[s.eyebrow, muted]}>LARGEST RECORDED OUTGOING</Text><Text style={[s.categoryName, text]}>{insights.largest.title || "Outgoing transaction"}</Text><Text style={[s.copy, { color: theme.accent }]}>{money(insights.largest.amount)}</Text></View>
        </View>}

        <View style={[s.panel, surface]}>
          <View style={s.sectionHeading}>{title("Account activity")}<Text style={[s.small, muted]}>{insights.available ? `${insights.count} records` : "Awaiting activity"}</Text></View>
          {insights.records.slice(0, visibleTransactions).map(tx => <View key={tx.id} style={[s.transaction, { borderColor: theme.border }]}>
            <View style={[s.transactionIcon, { backgroundColor: theme.surfaceSoft }]}><Ionicons name={tx.type === "income" ? "arrow-down" : "arrow-up"} size={18} color={theme.accent} /></View>
            <View style={{ flex: 1, gap: 5 }}><Text numberOfLines={2} style={[s.transactionTitle, text]}>{tx.title || "Transaction"}</Text><Text style={[s.small, muted]}>{new Date(tx.time).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} · {tx.category || (tx.type === "income" ? "Money in" : "Money out")}</Text></View>
            <Text style={[s.transactionAmount, text]}>{hidden ? "••••" : `${tx.type === "income" ? "+" : "−"}${accountMoney(tx.amount, selected.currency)}`}</Text>
          </View>)}
          {!insights.records.length && <Text style={[s.copy, muted]}>{insights.available ? "No recorded activity in this period." : "Your linked account's activity will appear here when available."}</Text>}
          {insights.count > visibleTransactions && <Pressable accessibilityRole="button" onPress={() => setVisibleTransactions(value => value + 10)} style={[s.moreButton, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.accent, fontWeight: "700" }}>Show more activity</Text></Pressable>}
        </View>
      </View> : !linked.loading && <View style={s.details}>
        <View style={[s.panel, surface]}>{title("Each connection opens a new view")}
          {[
            ["git-branch-outline", "A space for every account", "Choose a bank and see only the activity that belongs to it."],
            ["swap-vertical-outline", "Understand the movement", "Follow recorded money in, money out and the categories behind it."],
            ["sparkles-outline", "Details that tell a story", "Spot your largest outgoings and explore your recent activity."],
          ].map(([icon, name, copy]) => <View key={name} style={[s.row, { alignItems: "flex-start" }]}><View style={[s.spotlightIcon, { backgroundColor: theme.accentSoft }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={21} color={theme.accent} /></View><View style={{ flex: 1, gap: 5 }}><Text style={[s.transactionTitle, text]}>{name}</Text><Text style={[s.copy, muted]}>{copy}</Text></View></View>)}
        </View>
      </View>}
      <View style={s.footer}><Ionicons name="lock-closed-outline" size={14} color={theme.textSecondary} /><Text style={[s.small, muted, { flex: 1 }]}>Account insights only. Linking an account does not create a payment card.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

function FlowCard({ label, amount, icon, theme, incoming = false }: { label: string; amount: string; icon: "arrow-up" | "arrow-down"; theme: ThemePalette; incoming?: boolean }) {
  return <View style={[s.flowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <View style={[s.flowIcon, { backgroundColor: incoming ? theme.accentSoft : theme.surfaceSoft }]}><Ionicons name={icon} size={19} color={theme.accent} /></View>
    <Text style={[s.small, { color: theme.textSecondary }]}>{label}</Text>
    <Text adjustsFontSizeToFit numberOfLines={1} style={[s.flowAmount, { color: theme.textPrimary }]}>{amount}</Text>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  iconButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 36, gap: 20, maxWidth: 760, width: "100%", alignSelf: "center" },
  intro: { paddingHorizontal: 24, paddingTop: 10, gap: 12 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: "800" },
  pageTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1.2, lineHeight: 39 },
  copy: { fontSize: 13, lineHeight: 20 }, small: { fontSize: 11, lineHeight: 17 },
  network: { alignItems: "center", paddingTop: 6 },
  root: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderRadius: 18, paddingVertical: 11, paddingHorizontal: 14 },
  rootText: { fontSize: 12, fontWeight: "700" },
  count: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9 },
  trunk: { width: 1, height: 23 }, stem: { width: 1, height: 25 },
  branches: { paddingHorizontal: 13, paddingBottom: 6 },
  accountCard: { padding: 21, borderRadius: 24, minHeight: 208, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  bankIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: "#FFFFFF18", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  bankName: { flex: 1, fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  cardLabel: { color: "#FFFFFFBB", fontSize: 9, letterSpacing: 1.5, fontWeight: "600" },
  cardAmount: { color: "#FFFFFF", fontSize: 29, fontWeight: "700", letterSpacing: -.8 },
  cardHolder: { flex: 1, color: "#FFFFFFCC", fontSize: 11 }, cardNumber: { color: "#FFFFFFCC", fontSize: 11, letterSpacing: .8 },
  sectionPad: { paddingHorizontal: 24 }, visibility: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 44, paddingLeft: 10 },
  details: { paddingHorizontal: 20, gap: 16 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 12, justifyContent: "space-between", flexWrap: "wrap" },
  sectionTitle: { fontSize: 19, fontWeight: "700", letterSpacing: -.5 },
  periods: { flexDirection: "row", padding: 4, borderRadius: 15, gap: 4 }, period: { flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: 12 },
  insightHero: { padding: 22, borderRadius: 23, gap: 12 }, insightHeadline: { fontSize: 23, lineHeight: 29, fontWeight: "700", letterSpacing: -.6 },
  flowFork: { width: "52%", height: 17, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  flowRow: { flexDirection: "row", gap: 12, marginTop: -16 }, flowCard: { flex: 1, padding: 17, borderRadius: 20, borderWidth: 1, gap: 8 },
  flowIcon: { width: 33, height: 33, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 3 }, flowAmount: { fontSize: 21, fontWeight: "700", letterSpacing: -.5 },
  netRow: { borderWidth: 1, borderRadius: 15, padding: 15, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }, netAmount: { fontSize: 15, fontWeight: "700" },
  panel: { borderWidth: 1, borderRadius: 23, padding: 19, gap: 22 },
  categoryDot: { height: 7, width: 7, borderRadius: 4 }, categoryName: { flex: 1, fontSize: 13, fontWeight: "600" }, categoryValue: { fontSize: 12, fontWeight: "600" }, bar: { height: 5, borderRadius: 4, overflow: "hidden", marginLeft: 17 },
  spotlight: { flexDirection: "row", alignItems: "center", gap: 13, padding: 18, borderRadius: 20 }, spotlightIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  transaction: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 14, borderTopWidth: 1 }, transactionIcon: { height: 33, width: 33, borderRadius: 11, alignItems: "center", justifyContent: "center" }, transactionTitle: { fontSize: 13, fontWeight: "600" }, transactionAmount: { fontSize: 12, fontWeight: "700", maxWidth: "40%" },
  moreButton: { padding: 14, borderRadius: 13, alignItems: "center" },
  emptyNetwork: { marginHorizontal: 24, padding: 27, borderWidth: 1, borderRadius: 25, alignItems: "center", gap: 14, alignSelf: "stretch" }, emptyIcon: { width: 66, height: 66, borderRadius: 22, alignItems: "center", justifyContent: "center" }, emptyTitle: { fontSize: 21, lineHeight: 27, fontWeight: "700", textAlign: "center" },
  primaryButton: { paddingHorizontal: 19, paddingVertical: 15, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  notice: { marginHorizontal: 20, padding: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  footer: { paddingHorizontal: 27, flexDirection: "row", alignItems: "center", gap: 8 },
});
