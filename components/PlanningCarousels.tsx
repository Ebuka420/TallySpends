import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { planningCards } from "../src/budget/dashboard";
import type { Wallet } from "../src/budget/ledger";
import type { ThemeId, ThemeMode, ThemePalette } from "../src/theme";
import type { PeopleDirectory } from "./BudgetPeople";
import { BudgetLoading } from "./BudgetUI";
import { HomeCarousel, type HomeCard } from "./HomeCarousel";

export function PlanningCarousels({ wallet, theme, themeMode, themePreference, people, error, retry }: {
  wallet: Wallet | null; theme: ThemePalette; themeMode: ThemeMode; themePreference: ThemeId;
  people: PeopleDirectory; error: string | null; retry: () => void;
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
  return <>
    <HomeCarousel title="Ajo group activity" link="Open Ajo" onViewAll={() => router.push("/ajo")} cards={ajo} theme={theme} themeMode={themeMode} themePreference={themePreference} interval={6000} />
    <HomeCarousel title="Joint savings" link="View goals" onViewAll={() => router.push("/joint-savings")} cards={joint} theme={theme} themeMode={themeMode} themePreference={themePreference} interval={7000} />
  </>;
}
