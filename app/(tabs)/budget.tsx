import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";
import { PlanTip, PlanningSheet } from "../../components/PlanningUI";
import {
  BudgetButton,
  BudgetCopy,
  BudgetLoading,
} from "../../components/BudgetUI";
import { money, reservedSavings, totals } from "../../src/budget/ledger";

const actions = [
  {
    title: "My budget",
    subtitle: "Give your spending money a purpose.",
    icon: "pie-chart-outline" as const,
    route: "/budgetspending",
  },
  {
    title: "My savings",
    subtitle: "Track goals and lock money aside.",
    icon: "wallet-outline" as const,
    route: "/savingsprogress",
  },
  {
    title: "Ajo Circles",
    subtitle: "Save together with people you trust.",
    icon: "people-outline" as const,
    route: "/ajo",
  },
];

export default function BudgetScreen() {
  const router = useRouter();
  const {
    themePreference,
    themeMode,
    budgetWallet: wallet,
    budgetError,
    reloadBudgetWallet,
  } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const [create, setCreate] = useState(false);
  const summary = wallet ? totals(wallet) : null;
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={[s.title, { color: theme.textPrimary }]}>Budget</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="How Budget works" onPress={() => setCreate(true)} style={[s.overviewIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="information-circle-outline" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>
          <Text style={[s.subtitle, { color: theme.textSecondary }]}>
            Plan a little. Make room for more.
          </Text>
        </View>
        {!wallet || budgetError ? (
          <BudgetLoading
            theme={theme}
            error={budgetError}
            retry={reloadBudgetWallet}
          />
        ) : (
          summary && (
            <View
              style={[
                s.overview,
                {
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  flexDirection: "column",
                  alignItems: "stretch",
                },
              ]}
            >
              <Text style={[s.overviewCopy, { color: theme.textSecondary }]}>
                AVAILABLE TO PLAN
              </Text>
              <Text style={[s.title, { color: theme.textPrimary }]}>
                {money(summary.available)}
              </Text>
              <BudgetCopy theme={theme}>
                {money(summary.remaining)} in budgets ·{" "}
                {money(reservedSavings(wallet))} in savings
              </BudgetCopy>
            </View>
          )
        )}
        <View style={s.list}>
          {actions.map((item) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.78}
              onPress={() =>
                router.push(
                  item.route as "/budgetspending" | "/savingsprogress" | "/ajo",
                )
              }
              style={[
                s.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={[s.icon, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name={item.icon} size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: theme.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[s.cardCopy, { color: theme.textSecondary }]}>
                  {item.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.accent} />
            </TouchableOpacity>
          ))}
        </View>
        <PlanTip theme={theme} title="A little planning goes a long way" text="Start with your everyday essentials, save towards one goal, then build from there. Small amounts count too." />
      </ScrollView>
      <PlanningSheet
        visible={create}
        theme={theme}
        title="Make the most of Budget"
        onClose={() => setCreate(false)}
      >
        {[
          { title: "My budget", icon: "pie-chart-outline" as const, text: "1. Open My budget and tap Add.\n2. Name a category and set aside an amount.\n3. Record spending and keep an eye on what is left." },
          { title: "My savings", icon: "wallet-outline" as const, text: "1. Choose a personal or joint goal.\n2. Set your target and unlock date.\n3. Add money as you go and withdraw once it unlocks." },
          { title: "Ajo Circles", icon: "people-outline" as const, text: "1. Create a circle and add your people.\n2. Agree on contributions, dates and payout order.\n3. Record payments made outside Tally and follow each turn." },
        ].map(item => <View key={item.title} style={{ gap: 8, paddingVertical: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}><Ionicons name={item.icon} size={21} color={theme.accent} /><Text style={[s.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text></View>
          <BudgetCopy theme={theme}>{item.text}</BudgetCopy>
        </View>)}
        <BudgetButton theme={theme} title="Got it" pill onPress={() => setCreate(false)} />
      </PlanningSheet>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingTop: 24, paddingBottom: 110 },
  header: { marginBottom: 22 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { fontSize: 13.5, lineHeight: 20, marginTop: 7, maxWidth: 280 },
  overview: {
    minHeight: 88,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  overviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewTitle: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  overviewCopy: { fontSize: 11.5, lineHeight: 16 },
  list: { gap: 12 },
  card: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 19,
    borderWidth: 1,
    padding: 15,
  },
  icon: {
    height: 48,
    width: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: 3 },
  cardCopy: { fontSize: 12, lineHeight: 17, paddingRight: 4 },
  tip: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 17,
    padding: 15,
    marginTop: 16,
  },
  tipCopy: { flex: 1, fontSize: 11.5, lineHeight: 17 },
});
