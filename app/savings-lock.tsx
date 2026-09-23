import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import {
  AmountPad,
  BudgetButton,
  BudgetCard,
  BudgetCopy,
  BudgetFrame,
  BudgetLoading,
  SavingsDate,
  ui,
} from "../components/BudgetUI";
import { ParticipantsInput, usePlanAction } from "../components/PlanningUI";
import {
  localDate,
  minor,
  money,
  today,
  totals,
  validDate,
} from "../src/budget/ledger";
import { operationId, runPlanCommand } from "../src/budget/repository";
import { useAppStore } from "../src/store";
import { PersonRow, usePlanningPeople } from "../components/BudgetPeople";

export default function SavingsLockScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const kind = mode === "joint" ? "joint" : "personal";
  const router = useRouter();
  const store = useAppStore();
  const people = usePlanningPeople(store);
  const {
    theme,
    budgetWallet: wallet,
    budgetError,
    reloadBudgetWallet,
    profileTallyTag,
  } = store;
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [initial, setInitial] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return localDate(d);
  });
  const [tags, setTags] = useState<string[]>([]);
  const [pad, setPad] = useState<"target" | "initial" | null>(null);
  const [review, setReview] = useState(false);
  const action = usePlanAction();
  const id = useRef(operationId());
  const available = wallet ? totals(wallet).available : 0;
  let targetMinor = 0;
  let initialMinor = 0;
  try {
    targetMinor = minor(target);
  } catch {}
  try {
    initialMinor = minor(initial);
  } catch {}
  const valid =
    name.trim().length > 0 &&
    targetMinor > 0 &&
    initialMinor <= Math.min(available, targetMinor) &&
    validDate(date) &&
    date >= today() &&
    (kind !== "joint" || tags.length > 0);
  const save = () =>
    action.run(
      () =>
        runPlanCommand(
          {
            type: "create-savings",
            name,
            kind,
            target: targetMinor,
            initial: kind === "joint" ? 0 : initialMinor,
            unlockDate: date,
            owner: profileTallyTag,
            tags,
            profiles: [
              people.resolve(profileTallyTag),
              ...tags.map(people.resolve),
            ],
          },
          id.current,
        ),
      () =>
        router.replace({
          pathname:
            kind === "joint" ? "/joint-savings-details" : "/savings-details",
          params: { id: id.current },
        }),
    );
  return (
    <BudgetFrame
      theme={theme}
      backTo={kind === "joint" ? "/joint-savings" : "/savingsprogress"}
      backLabel={kind === "joint" ? "Joint savings" : "My savings"}
      title={
        review
          ? "Review savings goal"
          : kind === "joint"
            ? "New joint savings"
            : "New savings goal"
      }
    >
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : (
        <>
          <Text
            style={[ui.heading, { fontSize: 20, color: theme.textPrimary }]}
          >
            {review
              ? "A plan worth keeping."
              : kind === "joint"
                ? "Good things grow together."
                : "Give your next goal a name."}
          </Text>
          {!review ? (
            <>
              <BudgetCopy theme={theme}>What are you saving for?</BudgetCopy>
              <TextInput
                accessibilityLabel="Savings goal name"
                value={name}
                onChangeText={setName}
                maxLength={50}
                placeholder="e.g. A new laptop"
                placeholderTextColor={theme.textSecondary}
                style={[
                  ui.input,
                  { color: theme.textPrimary, borderColor: theme.border },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set savings target"
                onPress={() => setPad("target")}
              >
                <BudgetCard theme={theme}>
                  <BudgetCopy theme={theme}>Your target</BudgetCopy>
                  <Text style={[ui.amount, { color: theme.textPrimary }]}>
                    {money(targetMinor)}
                  </Text>
                  <BudgetCopy theme={theme}>Tap to set an amount</BudgetCopy>
                </BudgetCard>
              </Pressable>
              {kind === "personal" ? (
                <BudgetCard theme={theme}>
                  <BudgetCopy theme={theme}>
                    Start with {money(initialMinor)} · Optional
                  </BudgetCopy>
                  <BudgetButton
                    secondary
                    theme={theme}
                    title="Choose starting amount"
                    disabled={!targetMinor || available <= 0}
                    onPress={() => setPad("initial")}
                  />
                  {initialMinor > 0 && (
                    <BudgetButton
                      secondary
                      theme={theme}
                      title="Start empty instead"
                      onPress={() => setInitial("")}
                    />
                  )}
                  <BudgetCopy theme={theme}>
                    {money(available)} available
                  </BudgetCopy>
                  {initialMinor > Math.min(available, targetMinor) && (
                    <BudgetCopy theme={theme} error>
                      Reduce the starting amount to fit your target and
                      available money.
                    </BudgetCopy>
                  )}
                </BudgetCard>
              ) : (
                <BudgetCard theme={theme}>
                  <ParticipantsInput
                    directory={people}
                    tags={tags}
                    onChange={setTags}
                    owner={profileTallyTag}
                    theme={theme}
                  />
                </BudgetCard>
              )}
              <BudgetCard theme={theme}>
                <SavingsDate
                  label="Unlock date"
                  value={date}
                  onChange={setDate}
                  theme={theme}
                />
                <BudgetCopy theme={theme}>
                  Funds stay locked until this date, even if you reach your
                  target sooner.
                </BudgetCopy>
                {date < today() && (
                  <BudgetCopy theme={theme} error>
                    Choose today or a future date.
                  </BudgetCopy>
                )}
              </BudgetCard>
              <BudgetButton
                theme={theme}
                title="Review goal"
                disabled={!valid}
                onPress={() => setReview(true)}
              />
            </>
          ) : (
            <>
              <BudgetCard theme={theme}>
                <Text style={[ui.heading, { color: theme.textPrimary }]}>
                  {name.trim()}
                </Text>
                <Text style={[ui.amount, { color: theme.textPrimary }]}>
                  {money(targetMinor)}
                </Text>
                <BudgetCopy theme={theme}>Target · Unlocks {date}</BudgetCopy>
                <BudgetCopy theme={theme}>
                  {kind === "joint"
                    ? "Starts empty. Everyone must accept before funding."
                    : `${money(initialMinor)} reserved now · ${money(available - initialMinor)} remains available`}
                </BudgetCopy>
                {kind === "joint" && (
                  <>
                    {[profileTallyTag, ...tags].map((tag) => (
                      <PersonRow
                        key={tag}
                        theme={theme}
                        person={people.resolve(tag)}
                        detail={
                          tag === profileTallyTag ? "You" : "Saving together"
                        }
                      />
                    ))}
                  </>
                )}
              </BudgetCard>
              <BudgetCopy theme={theme}>
                Local demo only. Invitations are stored on this device, not
                sent. No real money moves between accounts.
              </BudgetCopy>
              {action.error ? (
                <BudgetCopy theme={theme} error>
                  {action.error}
                </BudgetCopy>
              ) : null}
              <BudgetButton
                theme={theme}
                title={action.busy ? "Creating…" : "Create savings goal"}
                disabled={action.busy || !valid}
                onPress={save}
              />
              <BudgetButton
                theme={theme}
                secondary
                title="Edit details"
                disabled={action.busy}
                onPress={() => setReview(false)}
              />
            </>
          )}
          <AmountPad
            theme={theme}
            visible={pad !== null}
            title={
              pad === "target" ? "Your savings target" : "Start your savings"
            }
            value={pad === "target" ? target : initial}
            onChange={pad === "target" ? setTarget : setInitial}
            available={
              pad === "target" ? undefined : Math.min(available, targetMinor)
            }
            limitLabel={
              pad === "target" ? "Maximum target" : "Available to save"
            }
            onClose={() => setPad(null)}
            onDone={() => setPad(null)}
          />
        </>
      )}
    </BudgetFrame>
  );
}
