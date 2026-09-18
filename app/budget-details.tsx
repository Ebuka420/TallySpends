import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AmountPad,
  BudgetAmount,
  BudgetButton,
  BudgetCard,
  BudgetCopy,
  BudgetDate,
  BudgetFrame,
  BudgetLoading,
  ui,
} from "../components/BudgetUI";
import {
  budgetPayments,
  canonicalCategory,
  minor,
  money,
  today,
  totals,
} from "../src/budget/ledger";
import {
  operationId,
  runBudgetCommand,
  saveWalletTransaction,
} from "../src/budget/repository";
import { useAppStore } from "../src/store";

type Action = "pay" | "add" | "move" | "release" | "record";
export default function BudgetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    theme,
    budgetWallet: wallet,
    budgetError,
    reloadBudgetWallet,
  } = useAppStore();
  const budget = wallet?.budgets.find((b) => b.id === id);
  const [action, setAction] = useState<Action | null>(null);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [pad, setPad] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const op = useRef(operationId());
  let amountMinor = 0;
  try {
    amountMinor = minor(amount);
  } catch {}
  const available = wallet ? totals(wallet).available : 0;
  const limit = action === "add" ? available : budget?.remainingAmount || 0;
  const startAction = (next: Action) => {
    setAction(next);
    setAmount("");
    setError("");
    setNotice("");
    setTitle("");
    setDate(today());
    setDestination("");
    op.current = operationId();
  };
  const close = () => {
    if (!lock.current) {
      setAction(null);
      setPad(false);
    }
  };
  const submit = async () => {
    if (!budget || !action || action === "pay" || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const value = minor(amount);
      if (action === "record") {
        await saveWalletTransaction({
          id: op.current,
          title: title.trim(),
          amount: value / 100,
          category: budget.category,
          type: "expense",
          date,
          budgetId: budget.id,
        });
      } else if (action === "move") {
        await runBudgetCommand(
          {
            type: "move",
            budgetId: budget.id,
            destinationId: destination,
            amount: value,
          },
          op.current,
        );
      } else
        await runBudgetCommand(
          { type: action, budgetId: budget.id, amount: value },
          op.current,
        );
      setNotice(
        action === "record"
          ? "Expense recorded. No payment was sent."
          : action === "add"
            ? "Money added to your budget."
            : action === "move"
              ? "Money moved between your budgets."
              : "Money is available to allocate again.",
      );
      setAction(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save this change. Please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const label =
    action === "add"
      ? "Add Money"
      : action === "move"
        ? "Move Money"
        : action === "release"
          ? "Release Money"
          : action === "record"
            ? "Record paid expense"
            : "Pay";
  const unassigned =
    wallet && budget
      ? wallet.transactions.filter(
          (tx) =>
            tx.type === "expense" &&
            !wallet.deductions[tx.id] &&
            canonicalCategory(tx.category) ===
              canonicalCategory(budget.category) &&
            tx.date.slice(0, 10) >= budget.startDate &&
            (!budget.endDate || tx.date.slice(0, 10) <= budget.endDate),
        )
      : [];
  const assign = async (transactionId: string) => {
    if (!wallet || !budget || lock.current) return;
    const transaction = wallet.transactions.find(
      (tx) => tx.id === transactionId,
    );
    if (!transaction) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await saveWalletTransaction({ ...transaction, budgetId: budget.id });
      setNotice(
        "Existing expense assigned. No second transaction was created.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not assign this expense.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <BudgetFrame title={budget?.name || "Budget details"} theme={theme}>
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : !budget ? (
        <BudgetCard theme={theme}>
          <BudgetCopy theme={theme}>This budget could not be found.</BudgetCopy>
          <BudgetButton
            theme={theme}
            title="Your budgets"
            onPress={() => router.replace("/budgetspending")}
          />
        </BudgetCard>
      ) : (
        <>
          <BudgetCard theme={theme}>
            <Text style={[ui.label, { color: theme.textSecondary }]}>
              AVAILABLE TO SPEND
            </Text>
            <BudgetAmount theme={theme} amount={budget.remainingAmount} />
            <BudgetCopy theme={theme}>
              {money(budget.allocatedAmount)} allocated ·{" "}
              {money(budget.spentAmount)} spent
            </BudgetCopy>
            <BudgetCopy theme={theme}>
              {budget.startDate}
              {budget.endDate ? ` → ${budget.endDate}` : " · Ongoing"}
              {budget.endDate && budget.endDate < today()
                ? " · Period ended"
                : ""}
            </BudgetCopy>
          </BudgetCard>
          <View style={[ui.row, { gap: 6 }]}>
            {(
              [
                { key: "pay", label: "Pay", icon: "arrow-up-outline" },
                { key: "add", label: "Add Money", icon: "add" },
                { key: "move", label: "Move Money", icon: "swap-horizontal" },
                {
                  key: "release",
                  label: "Release",
                  icon: "arrow-down-outline",
                },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => startAction(item.key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 9,
                  paddingVertical: 8,
                }}
              >
                <View
                  style={[
                    ui.back,
                    {
                      backgroundColor: theme.accentSoft,
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={24} color={theme.accent} />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.textPrimary,
                    fontWeight: "700",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {notice ? (
            <BudgetCard theme={theme} soft>
              <Text
                accessibilityLiveRegion="polite"
                style={{ color: theme.accent }}
              >
                {notice}
              </Text>
            </BudgetCard>
          ) : null}
          <BudgetCopy theme={theme}>
            Demo budget · Move or release your money whenever you need it. No
            penalties or waiting periods.
          </BudgetCopy>
          {!action && error ? (
            <BudgetCopy theme={theme} error>
              {error}
            </BudgetCopy>
          ) : null}
          {unassigned.length > 0 && (
            <BudgetCard theme={theme}>
              <Text style={[ui.heading, { color: theme.textPrimary }]}>
                Unassigned expenses
              </Text>
              <BudgetCopy theme={theme}>
                These are already in your history. Assign one here without
                recording it again.
              </BudgetCopy>
              {unassigned.map((tx) => (
                <View key={tx.id}>
                  <BudgetCopy theme={theme}>
                    {tx.title} · {money(minor(String(tx.amount)))}
                  </BudgetCopy>
                  <BudgetButton
                    secondary
                    theme={theme}
                    disabled={busy}
                    title="Use this budget"
                    onPress={() => assign(tx.id)}
                  />
                </View>
              ))}
            </BudgetCard>
          )}
          <View style={ui.row}>
            <Text style={[ui.heading, { color: theme.textPrimary, flex: 1 }]}>
              Activity
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => startAction("record")}
              style={{ paddingVertical: 12 }}
            >
              <Text
                style={{ fontSize: 13, color: theme.accent, fontWeight: "700" }}
              >
                Record expense
              </Text>
            </Pressable>
          </View>
          <BudgetCard theme={theme}>
            {wallet.activity
              .filter((a) => a.budgetId === budget.id)
              .slice()
              .reverse()
              .map((a) => (
                <View
                  key={a.id}
                  style={[
                    ui.row,
                    {
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: theme.textPrimary, fontWeight: "600" }}
                    >
                      {a.description}
                    </Text>
                    <BudgetCopy theme={theme}>
                      {new Date(
                        a.date.length === 10 ? `${a.date}T12:00:00` : a.date,
                      ).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </BudgetCopy>
                  </View>
                  <Text
                    style={{
                      color: ["spend", "release", "move-out"].includes(a.kind)
                        ? theme.textPrimary
                        : theme.success,
                      fontWeight: "700",
                    }}
                  >
                    {["spend", "release", "move-out"].includes(a.kind)
                      ? "−"
                      : "+"}
                    {money(a.amount)}
                  </Text>
                </View>
              ))}
          </BudgetCard>
          <Modal
            visible={!!action}
            transparent
            animationType="slide"
            onRequestClose={close}
          >
            <View style={ui.overlay}>
              <View
                accessibilityViewIsModal
                style={[
                  ui.sheet,
                  { backgroundColor: theme.surface, paddingBottom: 35 },
                ]}
              >
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ gap: 14 }}
                >
                  <View style={ui.row}>
                    <Text
                      style={[
                        ui.heading,
                        { color: theme.textPrimary, flex: 1 },
                      ]}
                    >
                      {label}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close action"
                      onPress={close}
                      disabled={busy}
                      style={ui.back}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={theme.textPrimary}
                      />
                    </Pressable>
                  </View>
                  {action === "pay" && !budgetPayments.available ? (
                    <>
                      <BudgetCopy theme={theme}>
                        Payments aren’t connected yet. Your budget is ready, but
                        TallySpends cannot send money to a recipient from here.
                      </BudgetCopy>
                      <BudgetButton
                        theme={theme}
                        title="Record an expense already paid"
                        onPress={() => startAction("record")}
                      />
                      <BudgetCopy theme={theme}>
                        Recording updates your budget and transaction history
                        only.
                      </BudgetCopy>
                    </>
                  ) : (
                    <>
                      <BudgetCopy theme={theme}>
                        {action === "add"
                          ? `${money(available)} in your demo available balance`
                          : `${money(budget.remainingAmount)} remaining in ${budget.name}`}
                      </BudgetCopy>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Enter amount"
                        disabled={busy}
                        onPress={() => setPad(true)}
                        style={[ui.input, { borderColor: theme.border }]}
                      >
                        <Text
                          style={[
                            ui.amount,
                            { fontSize: 30, color: theme.textPrimary },
                          ]}
                        >
                          {money(amountMinor)}
                        </Text>
                        <BudgetCopy theme={theme}>
                          Tap to enter amount
                        </BudgetCopy>
                      </Pressable>
                      {action === "move" && (
                        <>
                          <BudgetCopy theme={theme}>Move to</BudgetCopy>
                          {wallet.budgets
                            .filter((b) => b.id !== budget.id)
                            .map((b) => (
                              <Pressable
                                key={b.id}
                                accessibilityRole="radio"
                                accessibilityState={{
                                  checked: destination === b.id,
                                }}
                                disabled={busy}
                                onPress={() => setDestination(b.id)}
                                style={[
                                  ui.input,
                                  {
                                    borderColor:
                                      destination === b.id
                                        ? theme.accent
                                        : theme.border,
                                    backgroundColor:
                                      destination === b.id
                                        ? theme.accentSoft
                                        : theme.surface,
                                  },
                                ]}
                              >
                                <Text style={{ color: theme.textPrimary }}>
                                  {b.name} · {money(b.remainingAmount)}
                                </Text>
                              </Pressable>
                            ))}
                          {wallet.budgets.length < 2 && (
                            <BudgetCopy theme={theme}>
                              Create another budget first to move money between
                              buckets.
                            </BudgetCopy>
                          )}
                        </>
                      )}
                      {action === "record" && (
                        <>
                          <TextInput
                            accessibilityLabel="Expense description"
                            editable={!busy}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                            placeholder="What did you pay for?"
                            placeholderTextColor={theme.textSecondary}
                            style={[
                              ui.input,
                              {
                                color: theme.textPrimary,
                                borderColor: theme.border,
                              },
                            ]}
                          />
                          <BudgetDate
                            theme={theme}
                            label="Date paid"
                            value={date}
                            onChange={setDate}
                          />
                          <BudgetCopy theme={theme}>
                            Only record an expense that is not already in your
                            transaction history. No payment will be sent.
                          </BudgetCopy>
                        </>
                      )}
                      {amountMinor > 0 && (
                        <BudgetCopy theme={theme}>
                          {action === "add"
                            ? `${money(available - amountMinor)} left unallocated`
                            : action === "release"
                              ? `${money(available + amountMinor)} will be available to allocate`
                              : `${money(budget.remainingAmount - amountMinor)} will remain in ${budget.name}`}
                        </BudgetCopy>
                      )}
                      {error ? (
                        <BudgetCopy theme={theme} error>
                          {error}
                        </BudgetCopy>
                      ) : null}
                      <BudgetButton
                        theme={theme}
                        title={busy ? "Saving…" : label}
                        disabled={
                          busy ||
                          !amountMinor ||
                          amountMinor > limit ||
                          (action === "move" && !destination) ||
                          (action === "record" && !title.trim())
                        }
                        onPress={submit}
                      />
                    </>
                  )}
                </ScrollView>
              </View>
              <AmountPad
                theme={theme}
                visible={pad}
                value={amount}
                onChange={setAmount}
                onClose={() => setPad(false)}
                onDone={() => setPad(false)}
                available={limit}
                title={label}
              />
            </View>
          </Modal>
        </>
      )}
    </BudgetFrame>
  );
}
