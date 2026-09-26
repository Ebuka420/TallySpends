import { completeTransaction } from "../src/transactionCompletion";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
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
  BudgetFrame,
  BudgetLoading,
  ui,
} from "../components/BudgetUI";
import {
  ActionNotice,
  BudgetDate,
  Disclosure,
  PlanningSheet,
} from "../components/PlanningUI";
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
  const [manage, setManage] = useState(false);
  const [newName, setNewName] = useState("");
  const lock = useRef(false);
  const op = useRef(operationId());
  const changeBudget = async (type: "archive" | "restore" | "rename") => {
    if (!budget || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await runBudgetCommand(
        type === "rename"
          ? { type, budgetId: budget.id, name: newName }
          : { type, budgetId: budget.id },
        operationId(),
      );
      setManage(false);
      setNotice(
        type === "archive"
          ? "Budget archived. Remaining money returned to your available balance."
          : type === "restore"
            ? "Budget restored. Add money when you’re ready."
            : "Budget name updated.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update this budget.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const archive = () => {
    if (budget)
      Alert.alert(
        "Delete this budget?",
        `${money(budget.remainingAmount)} will return to your available balance. The bucket will be archived so its history is kept and it can be restored.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Archive budget", onPress: () => changeBudget("archive") },
        ],
      );
  };
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
      const recordedExpense = action === "record";
      setAction(null);
      if (recordedExpense) completeTransaction(router, op.current);
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
            !tx.planId &&
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
    <BudgetFrame
      backTo="/budgetspending"
      backLabel="My budgets"
      title={budget?.name || "Budget details"}
      theme={theme}
      action={
        budget && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage budget"
            disabled={busy}
            onPress={() => {
              setNewName(budget.name);
              setError("");
              setManage(true);
            }}
            style={ui.back}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={23}
              color={theme.textPrimary}
            />
          </Pressable>
        )
      }
    >
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
          {budget.status === "archived" ? (
            <BudgetCard theme={theme} soft>
              <BudgetCopy theme={theme}>
                This budget is archived. Its remaining money was released and
                its history is still here.
              </BudgetCopy>
              <BudgetButton
                theme={theme}
                title="Restore budget"
                disabled={busy}
                onPress={() => changeBudget("restore")}
              />
            </BudgetCard>
          ) : (
            <>
              {budget.endDate && budget.endDate < today() && (
                <BudgetCard theme={theme} soft>
                  <Text style={[ui.heading, { color: theme.textPrimary }]}>
                    This period has ended.
                  </Text>
                  <BudgetCopy theme={theme}>
                    Your remaining money is still yours. Move it to another
                    bucket or release it when you start a new budget. Nothing
                    resets automatically.
                  </BudgetCopy>
                  <BudgetButton
                    theme={theme}
                    secondary
                    title="Create another budget"
                    onPress={() => router.push("/add-budget")}
                  />
                </BudgetCard>
              )}
              {budget.remainingAmount === 0 && (
                <BudgetCard theme={theme} soft>
                  <Text style={[ui.heading, { color: theme.textPrimary }]}>
                    This bucket is spent up.
                  </Text>
                  <BudgetCopy theme={theme}>
                    Nothing else can be charged to it. Add more money, or
                    archive it when you’re done.
                  </BudgetCopy>
                  <BudgetButton
                    theme={theme}
                    title="Add money"
                    onPress={() => startAction("add")}
                  />
                  <BudgetButton
                    theme={theme}
                    secondary
                    title="Archive empty bucket"
                    disabled={busy}
                    onPress={archive}
                  />
                </BudgetCard>
              )}
              <View style={[ui.row, { gap: 6 }]}>
                {(
                  [
                    { key: "pay", label: "Pay", icon: "arrow-up-outline" },
                    { key: "add", label: "Add Money", icon: "add" },
                    {
                      key: "move",
                      label: "Move Money",
                      icon: "swap-horizontal",
                    },
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
                    disabled={
                      busy ||
                      (budget.remainingAmount === 0 &&
                        (item.key === "move" || item.key === "release"))
                    }
                    onPress={() => startAction(item.key)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      gap: 9,
                      paddingVertical: 8,
                      opacity:
                        budget.remainingAmount === 0 &&
                        (item.key === "move" || item.key === "release")
                          ? 0.4
                          : 1,
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
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color={theme.accent}
                      />
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
            </>
          )}
          {notice ? (
            <ActionNotice
              message={notice}
              theme={theme}
              destination="/budgetspending"
              label="My budgets"
            />
          ) : null}
          {!action && error ? (
            <BudgetCopy theme={theme} error>
              {error}
            </BudgetCopy>
          ) : null}
          {budget.status === "active" && unassigned.length > 0 && (
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
            {budget.status === "active" && (
              <Pressable
                accessibilityRole="button"
                disabled={busy || budget.remainingAmount === 0}
                onPress={() => startAction("record")}
                style={{
                  paddingVertical: 12,
                  opacity: budget.remainingAmount === 0 ? 0.4 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.accent,
                    fontWeight: "700",
                  }}
                >
                  Record expense
                </Text>
              </Pressable>
            )}
          </View>
          <Disclosure title="View activity" theme={theme}>
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
                    {a.amount > 0
                      ? `${["spend", "release", "move-out", "archive"].includes(a.kind) ? "−" : "+"}${money(a.amount)}`
                      : ""}
                  </Text>
                </View>
              ))}
          </Disclosure>
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
                            .filter(
                              (b) =>
                                b.id !== budget.id && b.status === "active",
                            )
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
                          {wallet.budgets.filter((b) => b.status === "active")
                            .length < 2 && (
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
                          {(date > today() ||
                            date < budget.startDate ||
                            (budget.endDate && date > budget.endDate)) && (
                            <BudgetCopy theme={theme} error>
                              Choose a date within this budget’s period, no
                              later than today.
                            </BudgetCopy>
                          )}
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
                          (action === "record" &&
                            (!title.trim() ||
                              date > today() ||
                              date < budget.startDate ||
                              !!(budget.endDate && date > budget.endDate)))
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
          <PlanningSheet
            visible={manage}
            title="Manage budget"
            theme={theme}
            onClose={() => {
              if (!busy) setManage(false);
            }}
          >
            <BudgetCopy theme={theme}>Budget name</BudgetCopy>
            <TextInput
              accessibilityLabel="Rename budget"
              value={newName}
              onChangeText={setNewName}
              maxLength={40}
              editable={!busy}
              style={[
                ui.input,
                { borderColor: theme.border, color: theme.textPrimary },
              ]}
            />
            <BudgetButton
              theme={theme}
              title="Save name"
              disabled={
                busy || !newName.trim() || newName.trim() === budget.name
              }
              onPress={() => changeBudget("rename")}
            />
            {budget.status === "active" ? (
              <>
                <BudgetCopy theme={theme}>
                  Deleting archives this bucket and releases{" "}
                  {money(budget.remainingAmount)}. Transaction history is never
                  deleted.
                </BudgetCopy>
                <BudgetButton
                  theme={theme}
                  secondary
                  title="Delete budget (archive)"
                  disabled={busy}
                  onPress={archive}
                />
              </>
            ) : (
              <BudgetButton
                theme={theme}
                secondary
                title="Restore budget"
                disabled={busy}
                onPress={() => changeBudget("restore")}
              />
            )}
            {error ? (
              <BudgetCopy theme={theme} error>
                {error}
              </BudgetCopy>
            ) : null}
          </PlanningSheet>
        </>
      )}
    </BudgetFrame>
  );
}
