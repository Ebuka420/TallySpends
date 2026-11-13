import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { planningCards } from "../src/budget/dashboard";
import type { Wallet } from "../src/budget/ledger";
import type { ThemeId, ThemeMode, ThemePalette } from "../src/theme";
import type { PeopleDirectory } from "./BudgetPeople";
import { BudgetLoading } from "./BudgetUI";
import { HomeCarousel, type HomeCard } from "./HomeCarousel";

export function PlanningCarousels({ wallet, trackedBudgetSpending = {}, theme, themeMode, themePreference, people, error, retry, showSavings = true, showBudgets = false, autoAdjustLayout = false }: {
  wallet: Wallet | null; theme: ThemePalette; themeMode: ThemeMode; themePreference: ThemeId;
  trackedBudgetSpending?: Record<string, number>;
  people: PeopleDirectory; error: string | null; retry: () => void;
  showSavings?: boolean; showBudgets?: boolean; autoAdjustLayout?: boolean;
}) {
  const router = useRouter();
  if (!wallet || error) return <View style={{ marginTop: 20 }}><BudgetLoading theme={theme} error={error} retry={retry} /></View>;
  const plans = planningCards(wallet);
  const ajo: HomeCard[] = plans.ajo.map(card => ({
    id: card.id, title: card.title, icon: "people-outline", tint: "#F3EBF1",
    text: card.detail + ". " + (card.subtitle === "Next to receive" ? "Next: " + (people.resolve(card.tag).displayName || "@" + card.tag) : card.subtitle) + ".",
    onPress: () => router.push({ pathname: "/ajo-details", params: { id: card.id } }),
  }));
  const joint: HomeCard[] = plans.joint.map(card => ({
    id: card.id, title: card.title, icon: "wallet-outline", tint: "#EEE4F0",
    text: card.detail + ". " + card.date + ".",
    onPress: () => router.push({ pathname: "/joint-savings-details", params: { id: card.id } }),
  }));
  if (!ajo.length) ajo.push({ id: "create-ajo", title: "Create your first circle", text: "Save with your people and keep track of everyone's turn.", icon: "people-outline", tint: "#F3EBF1", onPress: () => router.push("/ajo-create") });
  if (!joint.length) joint.push({ id: "create-joint", title: "Start saving together", text: "Choose a shared goal and take the first step with someone you trust.", icon: "wallet-outline", tint: "#EEE4F0", onPress: () => router.push("/savings-lock?mode=joint") });
  const budgets: HomeCard[] = wallet.budgets.filter(b => b.status === "active").map(b => ({
    id: b.id, title: b.name, text: `${Math.round(b.allocatedAmount ? (trackedBudgetSpending[b.id] ?? b.spentAmount) / b.allocatedAmount * 100 : 0)}% of tracked category spending against this budget.`,
    icon: "pie-chart-outline", tint: "#EEE4F0", onPress: () => router.push("/(tabs)/budget"),
  }));
  if (!budgets.length) budgets.push({ id: "create-budget", title: "Plan your spending", text: "Set category limits and follow your budget progress.", icon: "pie-chart-outline", tint: "#EEE4F0", onPress: () => router.push("/(tabs)/budget") });
  const sections = [
    { id: "ajo", title: "Ajo group activity", link: "Open Ajo", route: "/ajo" as const, cards: ajo, visible: true, count: plans.ajo.length },
    { id: "joint", title: "Joint savings", link: "View goals", route: "/joint-savings" as const, cards: joint, visible: showSavings, count: plans.joint.length },
    { id: "budgets", title: "Budgets", link: "View budgets", route: "/(tabs)/budget" as const, cards: budgets, visible: showBudgets, count: wallet.budgets.filter(b => b.status === "active").length },
  ].filter(s => s.visible);
  if (autoAdjustLayout) sections.sort((a, b) => b.count - a.count);
  return <>{sections.map(section => <HomeCarousel key={section.id} title={section.title} link={section.link} onViewAll={() => router.push(section.route)} cards={section.cards} theme={theme} themeMode={themeMode} themePreference={themePreference} interval={6000} />)}</>;
}
