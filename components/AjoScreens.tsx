import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
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
  ActionNotice,
  AddAction,
  BudgetDate,
  Disclosure,
  ParticipantsInput,
  PlanHistory,
  PlanningSheet,
  PlanTabs,
  PlanTip,
  usePlanAction,
} from "./PlanningUI";
import { PeopleStrip, PersonRow, PersonAvatar, usePlanningPeople } from "./BudgetPeople";
import { money, minor, today, type AjoCircle } from "../src/budget/ledger";
import { operationId, runPlanCommand } from "../src/budget/repository";
import { useAppStore } from "../src/store";

const frequencies = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};
export function AjoList() {
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
  const circles = wallet?.circles || [];
  const visible = circles.filter((c) =>
    filter === "history"
      ? c.status === "archived" || c.trackingMode === "legacy-demo"
      : c.trackingMode === "external" && c.status === filter,
  );
  const activeCircles = circles.filter(c => c.trackingMode === "external" && c.status === "active");
  return (
    <BudgetFrame
      theme={theme}
      title="Ajo Circles"
      backTo="/(tabs)/budget"
      backLabel="Budget"
      action={
        <AddAction theme={theme} onPress={() => router.push("/ajo-create")} />
      }
    >
      <BudgetCopy theme={theme}>
        Your people. Your payout order. One shared record.
      </BudgetCopy>
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : (
        <>
          <View style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 16 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "800" }}>Your circle overview</Text>
            <View style={{ flexDirection: "row" }}>{[
              [String(activeCircles.length), "Active circles"],
              [money(activeCircles.reduce((sum, c) => sum + c.contribution, 0)), "Per cycle commitments"],
              [String(circles.filter(c => c.status === "completed").length), "Completed"],
            ].map(([value, label]) => <View key={label} style={{ flex: 1, alignItems: "center", gap: 5 }}><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "800" }}>{value}</Text><Text style={{ color: theme.textSecondary, fontSize: 10, textAlign: "center" }}>{label}</Text></View>)}</View>
          </View>
          <PlanTabs
            values={["active", "completed", "history"]}
            selected={filter}
            onChange={setFilter}
            theme={theme}
          />
          {filter !== "history" &&
            circles.some((circle) => circle.trackingMode === "legacy-demo") && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setFilter("history")}
                style={{ paddingVertical: 6 }}
              >
                <Text style={{ color: theme.accent, fontSize: 12 }}>
                  Earlier demo circles are in History →
                </Text>
              </Pressable>
            )}
          {!visible.length && (
            <BudgetCard theme={theme}>
              <Ionicons name="people-outline" size={30} color={theme.accent} />
              <Text style={[ui.heading, { color: theme.textPrimary }]}>
                {filter === "active"
                  ? "Start your first circle"
                  : "Nothing here yet"}
              </Text>
              <BudgetCopy theme={theme}>
                Track what everyone has paid and whose turn comes next.
              </BudgetCopy>
              {filter === "active" && (
                <BudgetButton
                  theme={theme}
                  title="Create a circle"
                  onPress={() => router.push("/ajo-create")}
                />
              )}
            </BudgetCard>
          )}
          {visible.map((circle) => (
            <Pressable
              key={circle.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${circle.name}`}
              onPress={() =>
                router.push({
                  pathname: "/ajo-details",
                  params: { id: circle.id },
                })
              }
            >
              <View style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 17, padding: 15, gap: 16 }}>
                <View style={ui.row}>
                  <PersonAvatar person={people.resolve(circle.ownerTag)} theme={theme} size={51} />
                  <View style={{ flex: 1, gap: 5 }}><Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "800" }}>{circle.name}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{circle.status === "active" ? `Next collection: ${circle.nextDate}` : circle.status === "completed" ? "All turns completed" : "Archived circle"}</Text>
                  </View><Ionicons name="chevron-forward" color={theme.textSecondary} size={18} />
                </View>
                <View style={[ui.row, { justifyContent: "space-between", alignItems: "flex-end", gap: 8 }]}>
                  <View style={{ gap: 4 }}><Text style={{ color: theme.textPrimary, fontWeight: "800", fontSize: 12 }}>{money(circle.contribution)}</Text><Text style={{ color: theme.textSecondary, fontSize: 10 }}>{frequencies[circle.frequency]} contribution</Text></View>
                  <View style={{ gap: 4 }}><Text style={{ color: theme.textPrimary, fontWeight: "800", fontSize: 12 }}>{money(circle.contribution * circle.participants.length)}</Text><Text style={{ color: theme.textSecondary, fontSize: 10 }}>Total pot</Text></View>
                  <Text style={{ color: theme.accent, fontWeight: "800", fontSize: 10 }}>{circle.participants.length} members</Text>
                </View>
                <PeopleStrip tags={circle.participants.map(p => p.tag)} directory={people} theme={theme} />
                <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16 }}>{circle.trackingMode === "legacy-demo" ? "Earlier demo - read-only history" : circle.status !== "active" ? "History kept" : circle.participants.some(p => p.status !== "accepted") ? "Waiting for member agreement" : `Round ${circle.round + 1} of ${circle.participants.length}`}</Text>
              </View>
            </Pressable>
          ))}
          <PlanTip theme={theme} title="Ajo tip" text="Set your contribution date just after payday so every collection feels easier to keep up with." />
          <Disclosure
            title="How Ajo works"
            detail="Tracking only · no in-app payments"
            theme={theme}
          >
            <BudgetCopy theme={theme}>
              Members pay each other outside Tally. Record contributions and
              payouts here; your wallet is never charged or credited. Records
              are currently saved on this device, not synced to the group.
            </BudgetCopy>
            {circles.some((c) => c.trackingMode === "legacy-demo") && (
              <BudgetCopy theme={theme}>
                Earlier demo circles are kept in History. Their unspent demo
                reservations have been released; earlier simulated transactions
                remain in the wallet history.
              </BudgetCopy>
            )}
          </Disclosure>
        </>
      )}
    </BudgetFrame>
  );
}

export function AjoCreate() {
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
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<AjoCircle["frequency"]>("monthly");
  const [date, setDate] = useState(today());
  const [tags, setTags] = useState<string[]>([]);
  const [pad, setPad] = useState(false);
  const [step, setStep] = useState(0);
  const action = usePlanAction();
  const id = useRef(operationId());
  let value = 0;
  try {
    value = minor(amount);
  } catch {}
  const valid = name.trim().length > 0 && value > 0 && date >= today();
  return (
    <BudgetFrame
      theme={theme}
      title={["New circle", "Choose your people", "Review circle"][step]}
      backTo="/ajo"
      backLabel="Ajo Circles"
    >
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 3,
                  backgroundColor: i <= step ? theme.accent : theme.border,
                }}
              />
            ))}
          </View>
          {step === 0 && (
            <>
              <BudgetCopy theme={theme}>
                A name, an amount and a rhythm.
              </BudgetCopy>
              <TextInput
                accessibilityLabel="Circle name"
                value={name}
                onChangeText={setName}
                maxLength={50}
                placeholder="Circle name"
                placeholderTextColor={theme.textSecondary}
                style={[
                  ui.input,
                  { color: theme.textPrimary, borderColor: theme.border },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set contribution per person"
                onPress={() => setPad(true)}
              >
                <BudgetCard theme={theme}>
                  <BudgetCopy theme={theme}>Each person contributes</BudgetCopy>
                  <BudgetAmount theme={theme} amount={value} />
                  <BudgetCopy theme={theme}>Tap to set amount</BudgetCopy>
                </BudgetCard>
              </Pressable>
              <PlanTabs
                theme={theme}
                values={Object.values(frequencies)}
                selected={frequencies[frequency]}
                onChange={(label) =>
                  setFrequency(
                    (Object.keys(frequencies) as AjoCircle["frequency"][]).find(
                      (key) => frequencies[key] === label,
                    )!,
                  )
                }
              />
              <BudgetDate
                theme={theme}
                label="First collection"
                value={date}
                onChange={setDate}
              />
              {date < today() && (
                <BudgetCopy theme={theme} error>
                  Choose today or a future date.
                </BudgetCopy>
              )}
              <BudgetButton
                theme={theme}
                title="Choose people"
                disabled={!valid}
                onPress={() => setStep(1)}
              />
            </>
          )}
          {step === 1 && (
            <>
              <ParticipantsInput
                theme={theme}
                tags={tags}
                onChange={setTags}
                owner={profileTallyTag}
                minimum={2}
                directory={people}
              />
              <BudgetCopy theme={theme}>
                You receive first. Use the arrows to set the remaining payout
                order.
              </BudgetCopy>
              <BudgetButton
                theme={theme}
                title="Review circle"
                disabled={tags.length < 2}
                onPress={() => setStep(2)}
              />
            </>
          )}
          {step === 2 && (
            <>
              <BudgetCard theme={theme}>
                <Text style={[ui.heading, { color: theme.textPrimary }]}>
                  {name.trim()}
                </Text>
                <BudgetAmount
                  theme={theme}
                  amount={value * (tags.length + 1)}
                />
                <BudgetCopy theme={theme}>
                  Per round · {money(value)} each · {frequencies[frequency]}
                </BudgetCopy>
                <BudgetCopy theme={theme}>First collection {date}</BudgetCopy>
              </BudgetCard>
              <Text style={[ui.label, { color: theme.textSecondary }]}>
                PAYOUT ORDER
              </Text>
              {[profileTallyTag, ...tags].map((tag, index) => (
                <PersonRow
                  key={tag}
                  theme={theme}
                  person={people.resolve(tag)}
                  detail={
                    index === 0 ? "You · first turn" : `Turn ${index + 1}`
                  }
                  trailing={
                    <Text style={{ color: theme.accent, fontWeight: "800" }}>
                      {index + 1}
                    </Text>
                  }
                />
              ))}
              <BudgetCopy theme={theme}>
                Members pay outside Tally. This creates a local tracker, not a
                payment or delivered invitation.
              </BudgetCopy>
              {action.error ? (
                <BudgetCopy theme={theme} error>
                  {action.error}
                </BudgetCopy>
              ) : null}
              <BudgetButton
                theme={theme}
                title={action.busy ? "Creating…" : "Create circle"}
                disabled={!valid || tags.length < 2 || action.busy}
                onPress={() =>
                  action.run(
                    () =>
                      runPlanCommand(
                        {
                          type: "create-ajo",
                          name,
                          amount: value,
                          frequency,
                          firstDate: date,
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
                        pathname: "/ajo-details",
                        params: { id: id.current },
                      }),
                  )
                }
              />
            </>
          )}
          {step > 0 && (
            <BudgetButton
              theme={theme}
              secondary
              title="Previous step"
              disabled={action.busy}
              onPress={() => setStep(step - 1)}
            />
          )}
          <AmountPad
            theme={theme}
            title="Contribution per person"
            visible={pad}
            value={amount}
            onChange={setAmount}
            onClose={() => setPad(false)}
            onDone={() => setPad(false)}
          />
        </>
      )}
    </BudgetFrame>
  );
}

export function AjoDetails() {
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
  const [sheet, setSheet] = useState<
    "contribution" | "payout" | "membership" | "manage" | null
  >(null);
  const [memberTag, setMemberTag] = useState("");
  const [paidOn, setPaidOn] = useState(today());
  const [reference, setReference] = useState("");
  const [notice, setNotice] = useState("");
  const op = useRef(operationId());
  const circle = wallet?.circles?.find((c) => c.id === id);
  const legacy = circle?.trackingMode !== "external";
  const active = circle?.status === "active" && !legacy;
  const paid =
    circle?.contributions.filter(
      (c) => c.round === circle.round && !c.voidedAt,
    ) || [];
  const agreed = circle?.participants.every((p) => p.status === "accepted");
  const open = (next: typeof sheet, tag = "") => {
    setMemberTag(tag);
    setPaidOn(today());
    setReference("");
    action.setError("");
    op.current = operationId();
    setSheet(next);
  };
  const finish = (message: string) => {
    setSheet(null);
    setNotice(message);
  };
  const archive = () => {
    if (circle)
      Alert.alert(
        "Archive circle?",
        "The circle leaves your active list. All records stay in History.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Archive",
            onPress: () =>
              action.run(
                () =>
                  runPlanCommand(
                    { type: "archive-ajo", id: circle.id },
                    operationId(),
                  ),
                () => finish("Circle archived."),
              ),
          },
        ],
      );
  };
  return (
    <BudgetFrame
      theme={theme}
      title={circle?.name || "Ajo circle"}
      backTo="/ajo"
      backLabel="Ajo Circles"
      action={
        circle && !legacy ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Circle options"
            onPress={() => open("manage")}
            style={ui.back}
          >
            <Ionicons
              name="ellipsis-horizontal"
              color={theme.textPrimary}
              size={22}
            />
          </Pressable>
        ) : undefined
      }
    >
      {!wallet || budgetError ? (
        <BudgetLoading
          theme={theme}
          error={budgetError}
          retry={reloadBudgetWallet}
        />
      ) : !circle ? (
        <BudgetCopy theme={theme}>This circle could not be found.</BudgetCopy>
      ) : (
        <>
          {legacy && (
            <BudgetCard theme={theme} soft>
              <BudgetCopy theme={theme}>
                Earlier demo · read-only. These are not actual payment records.
                Unspent demo reservations were released; past simulated
                transactions were kept.
              </BudgetCopy>
              <BudgetButton
                theme={theme}
                title="Create a tracking circle"
                onPress={() => router.push("/ajo-create")}
              />
            </BudgetCard>
          )}
          <BudgetCard theme={theme}>
            <Text style={[ui.label, { color: theme.textSecondary }]}>
              {active
                ? `ROUND ${circle.round + 1} OF ${circle.participants.length}`
                : legacy
                  ? "EARLIER DEMO"
                  : circle.status.toUpperCase()}
            </Text>
            <BudgetAmount
              theme={theme}
              amount={circle.contribution * circle.participants.length}
            />
            <BudgetCopy theme={theme}>
              Round total · {money(circle.contribution)} each
            </BudgetCopy>
            {active && (
              <>
                <PersonRow
                  theme={theme}
                  person={people.resolve(circle.participants[circle.round].tag)}
                  detail="Next to receive"
                />
                <View style={[ui.row, { justifyContent: "space-between" }]}>
                  <BudgetCopy theme={theme}>
                    {circle.nextDate}
                    {circle.nextDate < today() ? " · Overdue" : ""}
                  </BudgetCopy>
                  <BudgetCopy theme={theme}>
                    {paid.length}/{circle.participants.length} recorded
                  </BudgetCopy>
                </View>
              </>
            )}
            {circle.status === "completed" && (
              <BudgetCopy theme={theme}>
                Everyone has received their turn.
              </BudgetCopy>
            )}
          </BudgetCard>
          {notice && (
            <ActionNotice
              message={notice}
              theme={theme}
              destination="/ajo"
              label="Ajo Circles"
            />
          )}
          {action.error && !sheet ? (
            <BudgetCopy theme={theme} error>
              {action.error}
            </BudgetCopy>
          ) : null}
          {active && (
            <>
              <BudgetButton
                theme={theme}
                title={
                  agreed ? "Record contribution" : "Record member agreement"
                }
                disabled={
                  action.busy ||
                  (agreed && paid.length === circle.participants.length)
                }
                onPress={() => open(agreed ? "contribution" : "membership")}
              />
              {agreed && paid.length === circle.participants.length && (
                <BudgetButton
                  theme={theme}
                  title="Record payout received"
                  disabled={action.busy}
                  onPress={() => open("payout")}
                />
              )}
              <BudgetCopy theme={theme}>
                {agreed
                  ? "Record payments made outside Tally. Your wallet is unchanged."
                  : "Record each person’s agreement before contributions begin."}
              </BudgetCopy>
            </>
          )}
          <Text style={[ui.label, { color: theme.textSecondary }]}>
            PEOPLE & PAYOUT ORDER
          </Text>
          <BudgetCard theme={theme}>
            {circle.participants.map((member, index) => (
              <PersonRow
                key={member.tag}
                theme={theme}
                person={people.resolve(member.tag)}
                detail={
                  member.status !== "accepted"
                    ? member.status === "invited"
                      ? "Awaiting agreement"
                      : "Declined"
                    : circle.payouts.some((p) => p.tag === member.tag)
                      ? "Payout recorded"
                      : `Turn ${index + 1}`
                }
                trailing={
                  active && member.status === "invited" ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Update agreement for ${member.tag}`}
                      onPress={() => open("membership", member.tag)}
                      style={{ padding: 10 }}
                    >
                      <Text
                        style={{
                          color: theme.accent,
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        Update
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {active
                        ? paid.some((p) => p.tag === member.tag)
                          ? "Recorded"
                          : "Pending"
                        : index + 1}
                    </Text>
                  )
                }
              />
            ))}
          </BudgetCard>
          {active && paid.length > 0 && (
            <Disclosure
              title="This round’s records"
              detail={`${paid.length} contributions recorded`}
              theme={theme}
            >
              {paid.map((record) => (
                <View key={record.tag} style={{ gap: 6 }}>
                  <PersonRow
                    theme={theme}
                    person={people.resolve(record.tag)}
                    detail={`${record.date.slice(0, 10)} · ${money(record.amount)}`}
                    trailing={
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Correct ${record.tag} contribution`}
                        onPress={() =>
                          Alert.alert(
                            "Mark record as a mistake?",
                            "The original stays in the audit history. No money is refunded or transferred.",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Correct record",
                                onPress: () =>
                                  action.run(
                                    () =>
                                      runPlanCommand(
                                        {
                                          type: "undo-ajo-contribution",
                                          id: circle.id,
                                          tag: record.tag,
                                        },
                                        operationId(),
                                      ),
                                    () =>
                                      setNotice(
                                        "Record corrected. Wallet unchanged.",
                                      ),
                                  ),
                              },
                            ],
                          )
                        }
                        style={ui.back}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={theme.textSecondary}
                        />
                      </Pressable>
                    }
                  />
                  {record.reference && (
                    <BudgetCopy theme={theme}>
                      Reference: {record.reference}
                    </BudgetCopy>
                  )}
                </View>
              ))}
            </Disclosure>
          )}
          {circle.payouts.length > 0 && (
            <Disclosure
              title={legacy ? "Earlier demo payouts" : "Payout records"}
              detail={`${circle.payouts.length} completed turns`}
              theme={theme}
            >
              {circle.payouts.map((payout) => (
                <View key={payout.round} style={{ gap: 6 }}>
                  <PersonRow
                    theme={theme}
                    person={people.resolve(payout.tag)}
                    detail={`Turn ${payout.round + 1} · ${payout.date.slice(0, 10)}`}
                    trailing={
                      <Text
                        style={{
                          color: theme.textPrimary,
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        {money(payout.amount)}
                      </Text>
                    }
                  />
                  {payout.reference && (
                    <BudgetCopy theme={theme}>
                      Reference: {payout.reference}
                    </BudgetCopy>
                  )}
                </View>
              ))}
            </Disclosure>
          )}
          <PlanHistory
            activity={circle.activity}
            theme={theme}
            directory={people}
          />
          <PlanningSheet
            visible={sheet !== null}
            title={
              sheet === "contribution"
                ? "Record contribution"
                : sheet === "payout"
                  ? "Record payout"
                  : sheet === "membership"
                    ? "Member agreement"
                    : "Circle options"
            }
            theme={theme}
            onClose={() => {
              if (!action.busy) setSheet(null);
            }}
          >
            {sheet === "manage" ? (
              <>
                <BudgetCopy theme={theme}>
                  External payments only. Records are saved on this device until
                  the group service is connected.
                </BudgetCopy>
                <BudgetButton
                  secondary
                  theme={theme}
                  title="Archive circle"
                  disabled={
                    action.busy ||
                    circle.status === "archived" ||
                    (circle.status !== "completed" &&
                      circle.contributions.some((c) => !c.voidedAt))
                  }
                  onPress={archive}
                />
                {circle.status !== "completed" &&
                  circle.contributions.some((c) => !c.voidedAt) && (
                    <BudgetCopy theme={theme}>
                      Finish every turn before closing a circle with recorded
                      contributions.
                    </BudgetCopy>
                  )}
              </>
            ) : sheet === "membership" ? (
              <>
                {!memberTag ? (
                  circle.participants
                    .filter((p) => p.status === "invited")
                    .map((member) => (
                      <Pressable
                        key={member.tag}
                        accessibilityRole="button"
                        accessibilityLabel={`Record response for ${member.tag}`}
                        onPress={() => setMemberTag(member.tag)}
                      >
                        <PersonRow
                          theme={theme}
                          person={people.resolve(member.tag)}
                          detail="Awaiting agreement"
                          trailing={
                            <Ionicons
                              name="chevron-forward"
                              size={18}
                              color={theme.accent}
                            />
                          }
                        />
                      </Pressable>
                    ))
                ) : (
                  <>
                    <PersonRow
                      theme={theme}
                      person={people.resolve(memberTag)}
                    />
                    <BudgetCopy theme={theme}>
                      Record the answer this person gave you. This does not send
                      an invitation.
                    </BudgetCopy>
                    {(["accepted", "declined"] as const).map((response) => (
                      <BudgetButton
                        key={response}
                        theme={theme}
                        secondary={response === "declined"}
                        title={
                          response === "accepted"
                            ? "Record acceptance"
                            : "Record decline"
                        }
                        disabled={action.busy}
                        onPress={() =>
                          action.run(
                            () =>
                              runPlanCommand(
                                {
                                  type: "record-membership",
                                  id: circle.id,
                                  tag: memberTag,
                                  response,
                                },
                                op.current,
                              ),
                            () => finish("Member response recorded."),
                          )
                        }
                      />
                    ))}
                  </>
                )}
                {circle.participants.some((p) => p.status === "declined") && (
                  <BudgetCopy theme={theme}>
                    A member declined. Archive this unfunded circle and create a
                    new group.
                  </BudgetCopy>
                )}
              </>
            ) : sheet === "contribution" && !memberTag ? (
              circle.participants
                .filter((p) => !paid.some((c) => c.tag === p.tag))
                .map((member) => (
                  <Pressable
                    key={member.tag}
                    accessibilityRole="button"
                    accessibilityLabel={`Record contribution from ${member.tag}`}
                    onPress={() => setMemberTag(member.tag)}
                  >
                    <PersonRow
                      theme={theme}
                      person={people.resolve(member.tag)}
                      trailing={
                        <Ionicons
                          name="add-circle-outline"
                          size={23}
                          color={theme.accent}
                        />
                      }
                    />
                  </Pressable>
                ))
            ) : sheet === "contribution" || sheet === "payout" ? (
              <>
                <PersonRow
                  theme={theme}
                  person={people.resolve(
                    sheet === "payout"
                      ? circle.participants[circle.round]?.tag ||
                          circle.ownerTag
                      : memberTag,
                  )}
                  detail={
                    sheet === "payout"
                      ? "Received the payout"
                      : "Paid the contribution"
                  }
                />
                <BudgetAmount
                  theme={theme}
                  amount={
                    sheet === "payout"
                      ? circle.contribution * circle.participants.length
                      : circle.contribution
                  }
                />
                <BudgetDate
                  theme={theme}
                  label="Date paid"
                  value={paidOn}
                  onChange={setPaidOn}
                />
                <TextInput
                  accessibilityLabel="Payment reference, optional"
                  value={reference}
                  onChangeText={setReference}
                  maxLength={80}
                  placeholder="Payment reference (optional)"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    ui.input,
                    { color: theme.textPrimary, borderColor: theme.border },
                  ]}
                />
                <BudgetCopy theme={theme}>
                  Only save after payment has happened outside Tally. This
                  records it; it does not send or verify money.
                </BudgetCopy>
                {paidOn > today() && (
                  <BudgetCopy theme={theme} error>
                    Payment dates cannot be in the future.
                  </BudgetCopy>
                )}
                <BudgetButton
                  theme={theme}
                  title={action.busy ? "Saving…" : "Save payment record"}
                  disabled={action.busy || paidOn > today()}
                  onPress={() =>
                    action.run(
                      () =>
                        runPlanCommand(
                          sheet === "payout"
                            ? {
                                type: "record-ajo-payout",
                                id: circle.id,
                                paidOn,
                                reference,
                              }
                            : {
                                type: "record-ajo-contribution",
                                id: circle.id,
                                tag: memberTag,
                                paidOn,
                                reference,
                              },
                          op.current,
                        ),
                      () => finish("Payment recorded. Wallet unchanged."),
                    )
                  }
                />
              </>
            ) : null}
            {action.error ? (
              <BudgetCopy theme={theme} error>
                {action.error}
              </BudgetCopy>
            ) : null}
          </PlanningSheet>
        </>
      )}
    </BudgetFrame>
  );
}
