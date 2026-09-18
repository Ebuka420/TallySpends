import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  AmountPad,
  BudgetButton,
  BudgetCard,
  BudgetCopy,
  BudgetDate,
  BudgetFrame,
  BudgetLoading,
  ui,
} from "../components/BudgetUI";
import { minor, money, today, totals, validDate } from "../src/budget/ledger";
import { operationId, runBudgetCommand } from "../src/budget/repository";
import { useAppStore } from "../src/store";

const categories = [
  ["Food", "Food & Dining"],
  ["Transport", "Transport"],
  ["Groceries", "Groceries"],
  ["Bills", "Bills & Utilities"],
  ["Entertainment", "Entertainment"],
  ["Shopping", "Shopping"],
  ["School", "Education"],
  ["Custom", ""],
];
export default function AddBudgetScreen() {
  const router = useRouter();
  const {
    theme,
    budgetWallet: wallet,
    budgetError,
    reloadBudgetWallet,
  } = useAppStore();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState("Food");
  const [custom, setCustom] = useState("");
  const [amount, setAmount] = useState("");
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [hasEnd, setHasEnd] = useState(false);
  const [pad, setPad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const id = useRef(operationId());
  const name = selected === "Custom" ? custom.trim() : selected;
  const category =
    selected === "Custom"
      ? custom.trim()
      : categories.find((c) => c[0] === selected)![1];
  const available = wallet ? totals(wallet).available : 0;
  let amountMinor = 0;
  try {
    amountMinor = minor(amount);
  } catch {}
  const datesValid =
    validDate(start) &&
    (!hasEnd || (validDate(end) && end >= start && end >= today()));
  const save = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await runBudgetCommand(
        {
          type: "allocate",
          allocations: [
            {
              name,
              category,
              amount: minor(amount),
              startDate: start,
              endDate: hasEnd ? end : undefined,
            },
          ],
        },
        id.current,
      );
      const created = next.budgets.find((b) => b.id === `${id.current}-0`)!;
      router.replace({
        pathname: "/budget-details",
        params: { id: created.id },
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not create your budget. Please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <BudgetFrame title="Create Budget" theme={theme}>
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : (
        <>
          <View style={[ui.row, { gap: 6 }]}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  height: 4,
                  flex: 1,
                  borderRadius: 2,
                  backgroundColor: i <= step ? theme.accent : theme.border,
                }}
              />
            ))}
          </View>
          <BudgetCopy theme={theme}>Step {step + 1} of 3</BudgetCopy>
          <Text
            style={[
              ui.heading,
              { fontSize: 29, lineHeight: 36, color: theme.textPrimary },
            ]}
          >
            {
              [
                "What are you setting money aside for?",
                "How much do you want available?",
                "Fund your budget",
              ][step]
            }
          </Text>
          {step === 0 && (
            <>
              <BudgetCopy theme={theme}>
                Choose a purpose. Make it yours.
              </BudgetCopy>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {categories.map(([label]) => (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selected === label }}
                    onPress={() => setSelected(label)}
                    style={{
                      width: "48%",
                      padding: 20,
                      minHeight: 70,
                      borderRadius: 18,
                      backgroundColor:
                        selected === label ? theme.accentSoft : theme.surface,
                      borderWidth: 1,
                      borderColor:
                        selected === label ? theme.accent : theme.border,
                    }}
                  >
                    <Text
                      style={{ color: theme.textPrimary, fontWeight: "700" }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {selected === "Custom" && (
                <TextInput
                  accessibilityLabel="Custom budget name"
                  value={custom}
                  onChangeText={setCustom}
                  maxLength={40}
                  placeholder="e.g. Weekend plans"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    ui.input,
                    { color: theme.textPrimary, borderColor: theme.border },
                  ]}
                />
              )}
              <BudgetButton
                theme={theme}
                title="Continue"
                disabled={!name}
                onPress={() => setStep(1)}
              />
            </>
          )}
          {step === 1 && (
            <>
              <BudgetCopy theme={theme}>
                {name} · {money(available)} available to allocate
              </BudgetCopy>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enter budget amount"
                onPress={() => setPad(true)}
              >
                <BudgetCard theme={theme}>
                  <Text style={[ui.amount, { color: theme.textPrimary }]}>
                    {money(amountMinor)}
                  </Text>
                  <BudgetCopy theme={theme}>Tap to enter an amount</BudgetCopy>
                </BudgetCard>
              </Pressable>
              <BudgetCard theme={theme}>
                <BudgetDate
                  label="Start date"
                  value={start}
                  onChange={setStart}
                  theme={theme}
                />
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: hasEnd }}
                  onPress={() => setHasEnd(!hasEnd)}
                  style={{ paddingVertical: 12 }}
                >
                  <Text style={{ color: theme.accent, fontWeight: "700" }}>
                    {hasEnd
                      ? "✓ End on a date"
                      : "+ Add an end date (optional)"}
                  </Text>
                </Pressable>
                {hasEnd && (
                  <BudgetDate
                    label="End date"
                    value={end}
                    onChange={setEnd}
                    theme={theme}
                  />
                )}
                <BudgetCopy theme={theme}>
                  Dates guide transaction matching. Money never expires or
                  resets automatically.
                </BudgetCopy>
                {!datesValid && (
                  <BudgetCopy theme={theme} error>
                    Choose an end date on or after the start date and today.
                  </BudgetCopy>
                )}
              </BudgetCard>
              <BudgetButton
                theme={theme}
                title="Choose funding source"
                disabled={
                  !amountMinor || amountMinor > available || !datesValid
                }
                onPress={() => setStep(2)}
              />
            </>
          )}
          {step === 2 && (
            <>
              <BudgetCard theme={theme}>
                <Text style={[ui.heading, { color: theme.textPrimary }]}>
                  Demo available balance
                </Text>
                <BudgetCopy theme={theme}>
                  {money(available)} available · Selected funding source
                </BudgetCopy>
                <BudgetCopy theme={theme}>
                  This is your app’s local balance. Funding a budget reserves
                  money here; it does not charge a card or transfer money from a
                  bank.
                </BudgetCopy>
              </BudgetCard>
              <BudgetCard theme={theme}>
                <Text style={[ui.heading, { color: theme.textPrimary }]}>
                  {name}
                </Text>
                <Text style={[ui.amount, { color: theme.textPrimary }]}>
                  {money(amountMinor)}
                </Text>
                <BudgetCopy theme={theme}>
                  {start}
                  {hasEnd ? ` → ${end}` : " · Ongoing"}
                </BudgetCopy>
                <BudgetCopy theme={theme}>
                  {money(available - amountMinor)} left unallocated
                </BudgetCopy>
              </BudgetCard>
              {error ? (
                <BudgetCopy theme={theme} error>
                  {error}
                </BudgetCopy>
              ) : null}
              <BudgetButton
                theme={theme}
                title={busy ? "Creating…" : `Fund ${name}`}
                disabled={busy || amountMinor > available}
                onPress={save}
              />
            </>
          )}
          {step > 0 && (
            <BudgetButton
              secondary
              theme={theme}
              title="Previous step"
              disabled={busy}
              onPress={() => {
                setError("");
                setStep(step - 1);
              }}
            />
          )}
          <AmountPad
            theme={theme}
            visible={pad}
            value={amount}
            onChange={setAmount}
            onClose={() => setPad(false)}
            onDone={() => setPad(false)}
            title={`Set aside for ${name}`}
            available={available}
          />
        </>
      )}
    </BudgetFrame>
  );
}
