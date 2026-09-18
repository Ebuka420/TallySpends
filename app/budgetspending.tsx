import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  BudgetAmount,
  BudgetButton,
  BudgetCard,
  BudgetCopy,
  BudgetFrame,
  BudgetLoading,
  ui,
} from "../components/BudgetUI";
import { money, today, totals } from "../src/budget/ledger";
import { operationId, runBudgetCommand } from "../src/budget/repository";
import { useAppStore } from "../src/store";

export default function BudgetSpendingScreen() {
  const router = useRouter();
  const {
    budgetWallet: wallet,
    budgetError,
    reloadBudgetWallet,
    theme,
  } = useAppStore();
  const [showPlan, setShowPlan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const planId = useRef(operationId());
  const summary = wallet ? totals(wallet) : null;
  const month = today().slice(0, 7);
  const monthSpent =
    wallet?.transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.date.startsWith(month) &&
          wallet.deductions[t.id],
      )
      .reduce((sum, t) => sum + wallet.deductions[t.id].amount, 0) || 0;
  // Deterministic preview, not a call to the conversational Coach API.
  const plan = summary
    ? [
        {
          name: "Food",
          category: "Food & Dining",
          amount: Math.floor((summary.available * 30) / 100),
        },
        {
          name: "Transport",
          category: "Transport",
          amount: Math.floor((summary.available * 20) / 100),
        },
        {
          name: "Bills",
          category: "Bills & Utilities",
          amount: Math.floor((summary.available * 30) / 100),
        },
      ]
    : [];
  const planTotal = plan.reduce((sum, p) => sum + p.amount, 0);
  const fundPlan = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await runBudgetCommand(
        {
          type: "allocate",
          allocations: plan.map((p) => ({ ...p, startDate: today() })),
        },
        planId.current,
      );
      setShowPlan(false);
      planId.current = operationId();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not fund the plan. Try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <BudgetFrame
      title="My Budget"
      theme={theme}
      action={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create budget"
          onPress={() => router.push("/add-budget")}
          style={[ui.back, { backgroundColor: theme.accentSoft }]}
        >
          <Ionicons name="add" size={24} color={theme.accent} />
        </Pressable>
      }
    >
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : (
        summary && (
          <>
            <View>
              <Text
                style={[ui.heading, { color: theme.textPrimary, fontSize: 27 }]}
              >
                Your money, given a purpose.
              </Text>
              <BudgetCopy theme={theme}>
                Set aside what you want to spend. Adjust whenever life changes.
              </BudgetCopy>
            </View>
            <BudgetCard theme={theme}>
              <Text style={[ui.label, { color: theme.textSecondary }]}>
                REMAINING IN YOUR BUDGETS
              </Text>
              <BudgetAmount amount={summary.remaining} theme={theme} />
              <View
                style={[
                  ui.row,
                  {
                    borderTopWidth: 1,
                    borderColor: theme.border,
                    paddingTop: 16,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <BudgetCopy theme={theme}>Allocated</BudgetCopy>
                  <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>
                    {money(summary.allocated)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <BudgetCopy theme={theme}>Spent this month</BudgetCopy>
                  <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>
                    {money(monthSpent)}
                  </Text>
                </View>
              </View>
            </BudgetCard>
            <BudgetCard theme={theme} soft>
              <View style={ui.row}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={theme.accent}
                />
                <View style={{ flex: 1 }}>
                  <BudgetCopy theme={theme}>Available to allocate</BudgetCopy>
                  <Text style={[ui.heading, { color: theme.textPrimary }]}>
                    {money(summary.available)}
                  </Text>
                </View>
              </View>
              <BudgetCopy theme={theme}>
                Demo balance · Allocations are saved on this device. No money
                moves between bank accounts.
              </BudgetCopy>
            </BudgetCard>
            <BudgetButton
              theme={theme}
              title="Create Budget"
              onPress={() => router.push("/add-budget")}
            />
            <View style={[ui.row, { marginTop: 10 }]}>
              <Text style={[ui.heading, { color: theme.textPrimary, flex: 1 }]}>
                Your budgets
              </Text>
              <BudgetCopy theme={theme}>
                {wallet.budgets.length} buckets
              </BudgetCopy>
            </View>
            {!wallet.budgets.length && (
              <BudgetCard theme={theme}>
                <Ionicons
                  name="albums-outline"
                  size={32}
                  color={theme.accent}
                />
                <Text style={[ui.heading, { color: theme.textPrimary }]}>
                  Make room for what matters
                </Text>
                <BudgetCopy theme={theme}>
                  Start with food, transport, or something of your own. Your
                  first allocation comes from your available balance.
                </BudgetCopy>
              </BudgetCard>
            )}
            {wallet.budgets.map((b) => (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${b.name}, ${money(b.remainingAmount)} remaining`}
                onPress={() =>
                  router.push({
                    pathname: "/budget-details",
                    params: { id: b.id },
                  })
                }
              >
                <BudgetCard theme={theme}>
                  <View style={ui.row}>
                    <View
                      style={[ui.back, { backgroundColor: theme.accentSoft }]}
                    >
                      <Ionicons
                        name="wallet-outline"
                        size={20}
                        color={theme.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          ui.heading,
                          { color: theme.textPrimary, fontSize: 17 },
                        ]}
                      >
                        {b.name}
                      </Text>
                      <BudgetCopy theme={theme}>
                        {b.endDate && b.endDate < today()
                          ? "Period ended · money still yours"
                          : b.startDate > today()
                            ? `Starts ${b.startDate}`
                            : b.category}
                      </BudgetCopy>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.textSecondary}
                    />
                  </View>
                  <Text
                    style={{
                      color: theme.textPrimary,
                      fontSize: 26,
                      fontWeight: "800",
                    }}
                  >
                    {money(b.remainingAmount)}{" "}
                    <Text style={{ fontSize: 12, fontWeight: "400" }}>
                      remaining
                    </Text>
                  </Text>
                  <View
                    style={{
                      height: 5,
                      backgroundColor: theme.surfaceSoft,
                      borderRadius: 5,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 5,
                        borderRadius: 5,
                        backgroundColor: theme.accent,
                        width: `${b.allocatedAmount ? Math.min(100, (b.spentAmount / b.allocatedAmount) * 100) : 0}%`,
                      }}
                    />
                  </View>
                  <View
                    style={[
                      ui.row,
                      { justifyContent: "space-between", flexWrap: "wrap" },
                    ]}
                  >
                    <BudgetCopy theme={theme}>
                      {money(b.allocatedAmount)} allocated
                    </BudgetCopy>
                    <BudgetCopy theme={theme}>
                      {money(b.spentAmount)} spent
                    </BudgetCopy>
                  </View>
                </BudgetCard>
              </Pressable>
            ))}
            {Object.values(wallet.review).map((message, index) => (
              <BudgetCopy key={index} theme={theme} error>
                {message}
              </BudgetCopy>
            ))}
            <BudgetCard theme={theme} soft>
              <View style={ui.row}>
                <Ionicons
                  name="sparkles-outline"
                  size={20}
                  color={theme.accent}
                />
                <Text
                  style={[
                    ui.heading,
                    { color: theme.textPrimary, fontSize: 16 },
                  ]}
                >
                  A little help getting started
                </Text>
              </View>
              <BudgetCopy theme={theme}>
                Sample plan · Not an AI recommendation. Preview a simple split
                of your available money.
              </BudgetCopy>
              {showPlan ? (
                <>
                  {plan.map((p) => (
                    <View
                      key={p.name}
                      style={[ui.row, { justifyContent: "space-between" }]}
                    >
                      <BudgetCopy theme={theme}>{p.name}</BudgetCopy>
                      <Text
                        style={{ color: theme.textPrimary, fontWeight: "700" }}
                      >
                        {money(p.amount)}
                      </Text>
                    </View>
                  ))}
                  <BudgetCopy theme={theme}>
                    {money(summary.available - planTotal)} stays free to spend.
                    All three allocations are funded together.
                  </BudgetCopy>
                  {error ? (
                    <BudgetCopy theme={theme} error>
                      {error}
                    </BudgetCopy>
                  ) : null}
                  <BudgetButton
                    theme={theme}
                    title={
                      busy ? "Funding…" : `Fund this plan · ${money(planTotal)}`
                    }
                    disabled={busy || plan.some((p) => p.amount <= 0)}
                    onPress={fundPlan}
                  />
                  <BudgetButton
                    theme={theme}
                    secondary
                    title="Close preview"
                    disabled={busy}
                    onPress={() => setShowPlan(false)}
                  />
                </>
              ) : (
                <BudgetButton
                  theme={theme}
                  secondary
                  title="Preview sample plan"
                  disabled={summary.available < 5}
                  onPress={() => setShowPlan(true)}
                />
              )}
            </BudgetCard>
          </>
        )
      )}
    </BudgetFrame>
  );
}
