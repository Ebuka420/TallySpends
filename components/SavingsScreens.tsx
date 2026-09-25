import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
  AmountPad,
  BudgetAmount,
  BudgetButton,
  BudgetCard,
  BudgetCopy,
  BudgetFrame,
  BudgetLoading,
  ui,
} from "./BudgetUI";
import {
  AddAction,
  ActionNotice,
  Disclosure,
  PlanHistory,
  PlanProgress,
  PlanTabs,
  PlanTip,
  usePlanAction,
} from "./PlanningUI";
import { minor, money, today, totals } from "../src/budget/ledger";
import { operationId, runPlanCommand } from "../src/budget/repository";
import { useAppStore } from "../src/store";
import { PeopleStrip, PersonRow, usePlanningPeople } from "./BudgetPeople";

export function SavingsList({ kind }: { kind: "personal" | "joint" }) {
  const router = useRouter();
  const store = useAppStore();
  const people = usePlanningPeople(store);
  const {
    theme,
    budgetWallet: wallet,
    budgetError,
    reloadBudgetWallet,
  } = store;
  const [filter, setFilter] = useState("active");
  const plans = (wallet?.savings || []).filter((p) => p.kind === kind);
  const active = plans.filter((p) => p.status === "active");
  const saved = active.reduce((sum, p) => sum + p.saved, 0);
  const target = active.reduce((sum, p) => sum + p.target, 0);
  const create = () =>
    router.push({ pathname: "/savings-lock", params: { mode: kind } });
  return (
    <BudgetFrame
      title="Savings"
      backTo="/(tabs)/budget"
      backLabel="Budget"
      theme={theme}
      action={<AddAction theme={theme} onPress={create} />}
    >
      <PlanTabs
        values={["My savings", "Joint savings"]}
        selected={kind === "personal" ? "My savings" : "Joint savings"}
        onChange={(value) => {
          if ((value === "My savings") !== (kind === "personal"))
            router.replace(
              value === "My savings" ? "/savingsprogress" : "/joint-savings",
            );
        }}
        theme={theme}
      />
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : (
        <>
          <BudgetCard theme={theme}>
            <View style={ui.row}>
              <Text style={[ui.label, { color: theme.textSecondary, flex: 1 }]}>
                {kind === "joint" ? "YOUR JOINT CONTRIBUTIONS" : "TOTAL SAVED"}
              </Text>
              <Ionicons
                name="lock-closed-outline"
                color={theme.accent}
                size={22}
              />
            </View>
            <BudgetAmount amount={saved} theme={theme} />
            <BudgetCopy theme={theme}>
              of {money(target)} across {active.length} active{" "}
              {active.length === 1 ? "goal" : "goals"}
            </BudgetCopy>
            <PlanProgress current={saved} target={target} theme={theme} />
          </BudgetCard>
          <Pressable accessibilityRole="button" onPress={create} style={{ backgroundColor: theme.accent, borderRadius: 19, padding: 18, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}><Text style={{ color: theme.background, fontSize: 14, fontWeight: "800" }}>{kind === "personal" ? "Start a personal lock" : "Start a joint goal"}</Text><Text style={{ color: theme.background, opacity: .8, fontSize: 11.5 }}>Choose a target and an unlock date.</Text></View><Ionicons name="arrow-forward" size={20} color={theme.background} />
          </Pressable>
          <PlanTabs
            values={["active", "completed", "archived"]}
            selected={filter}
            onChange={setFilter}
            theme={theme}
          />
          {!plans.some((p) => p.status === filter) && (
            <BudgetCard theme={theme}>
              <Ionicons
                name={kind === "joint" ? "people-outline" : "flag-outline"}
                size={30}
                color={theme.accent}
              />
              <Text style={[ui.heading, { color: theme.textPrimary }]}>
                {filter === "active"
                  ? "Your next goal starts here"
                  : `No ${filter} goals yet`}
              </Text>
              <BudgetCopy theme={theme}>
                {filter === "active"
                  ? kind === "joint"
                    ? "Choose a goal and invite people by TallyTag. Everyone accepts before saving starts."
                    : "Name your goal, set a target and choose when it unlocks. Start from any amount."
                  : "Your goals and their history will appear here."}
              </BudgetCopy>
              {filter === "active" && (
                <BudgetButton
                  theme={theme}
                  title={
                    kind === "joint" ? "New joint goal" : "New savings goal"
                  }
                  onPress={create}
                />
              )}
            </BudgetCard>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[ui.label, { color: theme.textSecondary }]}>{filter === "active" ? "MY GOALS" : filter.toUpperCase() + " GOALS"}</Text>
            {kind === "personal" && <Pressable onPress={() => router.replace("/joint-savings")}><Text style={{ color: theme.accent, fontWeight: "700", fontSize: 12 }}>Save with someone</Text></Pressable>}
          </View>
          {plans.some(p => p.status === filter) && <View style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 21, paddingHorizontal: 15 }}>
            {plans.filter(p => p.status === filter).map((plan, index) => <Pressable key={plan.id} accessibilityRole="button" accessibilityLabel={`Open ${plan.name}`}
              onPress={() => router.push({ pathname: kind === "joint" ? "/joint-savings-details" : "/savings-details", params: { id: plan.id } })}
              style={{ paddingVertical: 16, gap: 10, borderTopWidth: index ? 1 : 0, borderColor: theme.border }}>
              <View style={[ui.row, { gap: 11 }]}>
                <View style={[ui.back, { backgroundColor: theme.accentSoft }]}><Ionicons name={kind === "joint" ? "people-outline" : /trip|holiday|travel/i.test(plan.name) ? "airplane-outline" : /laptop|phone/i.test(plan.name) ? "laptop-outline" : "shield-checkmark-outline"} size={20} color={theme.accent} /></View>
                <View style={{ flex: 1, gap: 5 }}>
                  <View style={{ flexDirection: "row", gap: 6, justifyContent: "space-between" }}><Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "800", flex: 1 }}>{plan.name}</Text><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "800" }}>{Math.min(100, Math.round(plan.saved / plan.target * 100))}%</Text></View>
                  <Text style={{ color: theme.textSecondary, fontSize: 11.2 }}>{money(plan.saved)} of {money(plan.target)}</Text>
                  <View style={{ height: 4, borderRadius: 4, backgroundColor: theme.surfaceSoft, overflow: "hidden" }}><View style={{ height: 4, backgroundColor: theme.accent, width: `${Math.min(100, Math.round(plan.saved / plan.target * 100))}%` }} /></View>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16 }}>{plan.status !== "active" ? "History kept" : plan.participants.some(p => p.status === "declined") ? "Invitation declined" : plan.participants.some(p => p.status === "invited") ? "Awaiting acceptance" : plan.unlockDate <= today() ? "Unlocked and ready" : `Unlocks ${plan.unlockDate}`}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </View>
              {kind === "joint" && <PeopleStrip tags={plan.participants.map(member => member.tag)} directory={people} theme={theme} />}
            </Pressable>)}
          </View>}
          <PlanTip theme={theme} title="Small steps, real progress" text="Choose an amount you can set aside regularly. Your locked savings stay reserved until the date you chose." />
          <Disclosure
            title="About savings"
            detail="Saved on this device"
            theme={theme}
          >
            <BudgetCopy theme={theme}>
              Savings currently uses your local demo balance. Joint goals track
              your contributions only; shared balances and invitation delivery
              need the connected service.
            </BudgetCopy>
          </Disclosure>
        </>
      )}
    </BudgetFrame>
  );
}

export function SavingsDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useAppStore();
  const people = usePlanningPeople(store);
  const {
    theme,
    budgetWallet: wallet,
    budgetError,
    reloadBudgetWallet,
  } = store;
  const action = usePlanAction();
  const [pad, setPad] = useState(false);
  const [reviewFunding, setReviewFunding] = useState(false);
  const [amount, setAmount] = useState("");
  const [demo, setDemo] = useState(false);
  const [notice, setNotice] = useState("");
  const op = useRef(operationId());
  const plan = wallet?.savings?.find((p) => p.id === id);
  const available = wallet ? totals(wallet).available : 0;
  const perform = (type: "release-savings" | "archive-savings") => {
    if (!plan) return;
    Alert.alert(
      type === "archive-savings"
        ? "Archive this goal?"
        : "Release your savings?",
      `${money(plan.saved)} will return to your available balance. Your history will be kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: type === "archive-savings" ? "Archive" : "Release",
          onPress: () =>
            action.run(
              () => runPlanCommand({ type, id: plan.id }, operationId()),
              () => {
                setReviewFunding(false);
                setNotice(
                  type === "archive-savings"
                    ? "Goal archived. History is still here."
                    : "Savings released to your available balance.",
                );
              },
            ),
        },
      ],
    );
  };
  return (
    <BudgetFrame
      theme={theme}
      title={plan?.name || "Savings goal"}
      backTo={plan?.kind === "joint" ? "/joint-savings" : "/savingsprogress"}
      backLabel={plan?.kind === "joint" ? "Joint savings" : "My savings"}
    >
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : !plan ? (
        <BudgetCard theme={theme}>
          <BudgetCopy theme={theme}>This goal could not be found.</BudgetCopy>
          <BudgetButton
            theme={theme}
            title="Your savings"
            onPress={() => router.replace("/savingsprogress")}
          />
        </BudgetCard>
      ) : (
        <>
          <BudgetCard theme={theme}>
            <Text style={[ui.label, { color: theme.textSecondary }]}>
              {plan.kind === "joint" ? "YOUR CONTRIBUTIONS" : "SAVED SO FAR"}
            </Text>
            <BudgetAmount amount={plan.saved} theme={theme} />
            <BudgetCopy theme={theme}>
              Target {money(plan.target)} · {plan.status}
            </BudgetCopy>
            <PlanProgress
              current={plan.saved}
              target={plan.target}
              theme={theme}
            />
            <BudgetCopy theme={theme}>
              {plan.unlockDate > today()
                ? `Locked until ${plan.unlockDate}`
                : "Unlock date reached"}
              {plan.saved === plan.target ? " · Target reached!" : ""}
            </BudgetCopy>
          </BudgetCard>
          {action.error ? (
            <BudgetCopy theme={theme} error>
              {action.error}
            </BudgetCopy>
          ) : null}
          {notice ? (
            <ActionNotice
              message={notice}
              theme={theme}
              destination={
                plan.kind === "joint" ? "/joint-savings" : "/savingsprogress"
              }
              label={plan.kind === "joint" ? "Joint savings" : "My savings"}
            />
          ) : null}
          {reviewFunding && (
            <BudgetCard theme={theme} soft>
              <Text style={[ui.heading, { color: theme.textPrimary }]}>
                Confirm your savings
              </Text>
              <BudgetCopy theme={theme}>
                {money(minor(amount))} will be reserved until {plan.unlockDate}.
              </BudgetCopy>
              <BudgetButton
                theme={theme}
                title={action.busy ? "Saving…" : "Confirm savings"}
                disabled={action.busy}
                onPress={() =>
                  action.run(
                    () =>
                      runPlanCommand(
                        { type: "save", id: plan.id, amount: minor(amount) },
                        op.current,
                      ),
                    () => {
                      setReviewFunding(false);
                      setNotice("Money added to your savings.");
                    },
                  )
                }
              />
              <BudgetButton
                theme={theme}
                secondary
                title="Cancel"
                disabled={action.busy}
                onPress={() => setReviewFunding(false)}
              />
            </BudgetCard>
          )}
          {plan.status === "active" && (
            <>
              {plan.participants.some((p) => p.status !== "accepted") ? (
                <BudgetCard theme={theme} soft>
                  <BudgetCopy theme={theme}>
                    {plan.participants.some((p) => p.status === "declined")
                      ? "An invitation was declined. Archive this unfunded goal and start again with a different group."
                      : "Waiting for everyone to accept. Contributions stay disabled until then."}
                  </BudgetCopy>
                </BudgetCard>
              ) : (
                <>
                  <BudgetButton
                    theme={theme}
                    title={
                      plan.saved === plan.target
                        ? "Target reached"
                        : "Add to savings"
                    }
                    disabled={
                      action.busy ||
                      plan.saved === plan.target ||
                      available <= 0
                    }
                    onPress={() => {
                      setAmount("");
                      op.current = operationId();
                      setPad(true);
                      setReviewFunding(false);
                    }}
                  />
                  {available <= 0 && plan.saved < plan.target && (
                    <BudgetCopy theme={theme}>
                      No available money. Release money from a budget or add
                      demo funds first.
                    </BudgetCopy>
                  )}
                </>
              )}
              {plan.unlockDate <= today() && plan.saved > 0 && (
                <BudgetButton
                  secondary
                  theme={theme}
                  title={
                    plan.unlockDate > today()
                      ? `Unlocks ${plan.unlockDate}`
                      : "Release savings"
                  }
                  disabled={
                    action.busy || !plan.saved || plan.unlockDate > today()
                  }
                  onPress={() => perform("release-savings")}
                />
              )}
            </>
          )}
          {plan.kind === "joint" && (
            <BudgetCard theme={theme}>
              <Text style={[ui.heading, { color: theme.textPrimary }]}>
                Saving together
              </Text>
              {plan.participants.map((member) => (
                <PersonRow
                  key={member.tag}
                  person={people.resolve(member.tag)}
                  theme={theme}
                  detail={member.tag === plan.ownerTag ? "You" : member.status}
                />
              ))}
              <Disclosure
                title="Invitations"
                detail="Local preview · not delivered"
                theme={theme}
              >
                {plan.status === "active" &&
                  plan.participants.some((p) => p.status === "invited") && (
                    <>
                      <BudgetButton
                        secondary
                        theme={theme}
                        title={
                          demo
                            ? "Hide demo controls"
                            : "Try invitation flow (demo)"
                        }
                        onPress={() => setDemo(!demo)}
                      />
                      {demo &&
                        plan.participants
                          .filter((p) => p.status === "invited")
                          .map((p) => (
                            <View key={p.tag} style={{ gap: 8 }}>
                              <PersonRow
                                theme={theme}
                                person={people.resolve(p.tag)}
                                detail="Simulate invitation response"
                              />
                              {(["accepted", "declined"] as const).map(
                                (response) => (
                                  <BudgetButton
                                    key={response}
                                    secondary
                                    theme={theme}
                                    title={`Demo: ${response === "accepted" ? "accept" : "decline"} invitation`}
                                    disabled={action.busy}
                                    onPress={() =>
                                      action.run(() =>
                                        runPlanCommand(
                                          {
                                            type: "demo-response",
                                            kind: "savings",
                                            id: plan.id,
                                            tag: p.tag,
                                            response,
                                          },
                                          operationId(),
                                        ),
                                      )
                                    }
                                  />
                                ),
                              )}
                            </View>
                          ))}
                    </>
                  )}
              </Disclosure>
            </BudgetCard>
          )}
          <Disclosure title="Goal options" theme={theme}>
            {plan.status !== "archived" && (
              <BudgetButton
                theme={theme}
                secondary
                title="Archive goal"
                disabled={
                  action.busy || (plan.saved > 0 && plan.unlockDate > today())
                }
                onPress={() => perform("archive-savings")}
              />
            )}
            <BudgetCopy theme={theme}>
              Local demo · Locked money cannot be withdrawn or archived early.
              No real bank transaction is sent.
            </BudgetCopy>
          </Disclosure>
          <PlanHistory
            activity={plan.activity}
            theme={theme}
            directory={people}
          />
          <AmountPad
            theme={theme}
            title="Add to savings"
            visible={pad}
            value={amount}
            available={Math.min(available, plan.target - plan.saved)}
            limitLabel="You can add"
            onChange={setAmount}
            onClose={() => {
              if (!action.busy) setPad(false);
            }}
            onDone={() => {
              setPad(false);
              setReviewFunding(true);
            }}
          />
        </>
      )}
    </BudgetFrame>
  );
}
