import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { planningCards } from "../src/budget/dashboard";
import { money, type Wallet } from "../src/budget/ledger";
import type { ThemeId, ThemeMode, ThemePalette } from "../src/theme";
import type { PeopleDirectory } from "./BudgetPeople";
import { BudgetLoading } from "./BudgetUI";
import { HomeCarousel, type HomeCard } from "./HomeCarousel";
import { TutorialTarget } from "./SmartCoachTutorialLayer";

export function PlanningCarousels({ wallet, trackedBudgetSpending = {}, theme, themeMode, themePreference, people, error, retry, showSavings = true, showBudgets = false, autoAdjustLayout = false, tutorialScrollRef, tutorialScrollOffsetRef }: {
  wallet: Wallet | null; theme: ThemePalette; themeMode: ThemeMode; themePreference: ThemeId;
  trackedBudgetSpending?: Record<string, number>;
  people: PeopleDirectory; error: string | null; retry: () => void;
  showSavings?: boolean; showBudgets?: boolean; autoAdjustLayout?: boolean;
  tutorialScrollRef?: React.RefObject<any>; tutorialScrollOffsetRef?: React.RefObject<number>;
}) {
  const router = useRouter();
  if (!wallet || error) return <View style={{ marginTop: 20 }}><BudgetLoading theme={theme} error={error} retry={retry} /></View>;
  const plans = planningCards(wallet);
  const ajo: HomeCard[] = plans.ajo.map(card => ({
    id: card.id, title: card.title, icon: "people-outline", tint: "#F3EBF1",
    text: card.detail + ". " + (card.subtitle === "Next to receive" ? "Next: " + (people.resolve(card.tag).displayName || "@" + card.tag) : card.subtitle) + ".",
    onPress: () => router.push({ pathname: "/ajo-details", params: { id: card.id } }),
  }));
  const goals = (wallet.savings || []).filter(goal => goal.status !== "archived");
  const savings: HomeCard[] = goals.map(goal => ({
    id: goal.id, title: goal.name, icon: "wallet-outline", tint: "#EEE4F0",
    text: `${money(goal.saved)} saved toward ${money(goal.target)}.${goal.status === "completed" ? " Goal completed." : ""}`,
    onPress: () => router.push({ pathname: goal.kind === "joint" ? "/joint-savings-details" : "/savings-details", params: { id: goal.id } }),
  }));
  if (!ajo.length) ajo.push({ id: "create-ajo", title: "No Ajo groups yet", text: "You have no active Ajo groups. Create or join a circle to get started.", icon: "people-outline", tint: "#F3EBF1", onPress: () => router.push("/ajo") });
  if (!savings.length) savings.push({ id: "create-savings", title: "No savings goals yet", text: "You haven't started saving toward a goal. Create your first savings goal.", icon: "wallet-outline", tint: "#EEE4F0", onPress: () => router.push("/savings-lock?mode=personal") });
  const budgets: HomeCard[] = wallet.budgets.filter(b => b.status === "active").map(b => ({
    id: b.id, title: b.name, text: `${Math.round(b.allocatedAmount ? (trackedBudgetSpending[b.id] ?? b.spentAmount) / b.allocatedAmount * 100 : 0)}% of tracked category spending against this budget.`,
    icon: "pie-chart-outline", tint: "#EEE4F0", onPress: () => router.push("/(tabs)/budget"),
  }));
  if (!budgets.length) budgets.push({ id: "create-budget", title: "No budgets yet", text: "You have no active budgets. Set category limits to start planning your spending.", icon: "pie-chart-outline", tint: "#EEE4F0", onPress: () => router.push("/(tabs)/budget") });
  const sections = [
    { id: "ajo", title: "Ajo group activity", link: "Open Ajo", route: "/ajo" as const, cards: ajo, visible: true, count: plans.ajo.length },
    { id: "savings", title: "Savings", link: "View goals", route: "/savingsprogress" as const, cards: savings, visible: showSavings, count: goals.length },
    { id: "budgets", title: "Budgets", link: "View budgets", route: "/(tabs)/budget" as const, cards: budgets, visible: showBudgets, count: wallet.budgets.filter(b => b.status === "active").length },
  ].filter(s => s.visible);
  if (autoAdjustLayout) sections.sort((a, b) => b.count - a.count);
  return <>{sections.map(section => {
    const carousel = <HomeCarousel title={section.title} link={section.link} onViewAll={() => router.push(section.route)} cards={section.cards} theme={theme} themeMode={themeMode} themePreference={themePreference} interval={6000} />;
    return section.id === "budgets"
      ? <TutorialTarget key={section.id} id="home-budgets" scrollRef={tutorialScrollRef} scrollOffsetRef={tutorialScrollOffsetRef}>{carousel}</TutorialTarget>
      : <React.Fragment key={section.id}>{carousel}</React.Fragment>;
  })}</>;
}
