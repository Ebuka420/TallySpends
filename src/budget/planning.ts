import { assertWallet, localDate, totals, validDate } from "./ledger";
import type { Wallet, PlanActivity, Participant, AjoCircle } from "./ledger";
import { publicPerson, type Person } from "./people";

export function tallyTag(value: string) {
  const tag = value.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.-]{2,29}$/.test(tag))
    throw new Error(
      "Use a TallyTag of 3–30 letters, numbers, dots, hyphens or underscores.",
    );
  return tag;
}
function participants(
  owner: string,
  tags: string[],
  minimum: number,
  profiles: Person[] = [],
): Participant[] {
  const normalized = tags.map(tallyTag);
  if (normalized.includes(owner))
    throw new Error("You are already included. Add someone else’s TallyTag.");
  if (new Set(normalized).size !== normalized.length)
    throw new Error("Each TallyTag must be unique.");
  if (normalized.length < minimum || normalized.length > 9)
    throw new Error(`Add ${minimum}–9 other people.`);
  return [
    {
      ...publicPerson(profiles.find((p) => tallyTag(p.tag) === owner)),
      tag: owner,
      status: "accepted",
    },
    ...normalized.map((tag) => ({
      ...publicPerson(profiles.find((p) => tallyTag(p.tag) === tag)),
      tag,
      status: "invited" as const,
    })),
  ];
}
function amount(value: number, allowZero = false) {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1))
    throw new Error("Enter a valid amount.");
}
function title(value: string) {
  if (!value.trim() || value.trim().length > 50)
    throw new Error("Use a name of 1–50 characters.");
  return value.trim();
}
function sufficient(wallet: Wallet, value: number) {
  amount(value);
  if (value > totals(wallet).available)
    throw new Error(
      "Insufficient available balance. Release some budget money or add demo funds first.",
    );
}
function event(
  activity: PlanActivity[],
  id: string,
  type: string,
  value: number,
  tag: string,
  date: string,
  note: string,
) {
  activity.push({ id, type, amount: value, tag, date, note });
}
export function advanceDate(
  day: string,
  frequency: AjoCircle["frequency"],
  anchorDay?: number,
) {
  const date = new Date(`${day}T12:00:00`);
  if (frequency === "monthly") {
    const originalDay = anchorDay ?? date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    date.setDate(
      Math.min(
        originalDay,
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
      ),
    );
  } else date.setDate(date.getDate() + (frequency === "weekly" ? 7 : 14));
  return localDate(date);
}
export type PlanCommand =
  | {
      type: "create-savings";
      name: string;
      kind: "personal" | "joint";
      target: number;
      initial: number;
      unlockDate: string;
      owner: string;
      tags: string[];
      profiles?: Person[];
    }
  | { type: "save"; id: string; amount: number }
  | { type: "release-savings"; id: string }
  | { type: "archive-savings"; id: string }
  | {
      type: "create-ajo";
      name: string;
      amount: number;
      frequency: AjoCircle["frequency"];
      firstDate: string;
      owner: string;
      tags: string[];
      profiles?: Person[];
    }
  | {
      type: "record-ajo-contribution";
      id: string;
      tag: string;
      paidOn: string;
      reference?: string;
    }
  | { type: "undo-ajo-contribution"; id: string; tag: string }
  | {
      type: "record-ajo-payout";
      id: string;
      paidOn: string;
      reference?: string;
    }
  | {
      type: "record-membership";
      id: string;
      tag: string;
      response: "accepted" | "declined";
    }
  | { type: "archive-ajo"; id: string }
  | {
      type: "demo-response";
      kind: "savings" | "ajo";
      id: string;
      tag: string;
      response: "accepted" | "declined";
    };

/** All actions operate on the existing local demo wallet; no invitations or payments are sent. */
export function applyPlanCommand(
  original: Wallet,
  command: PlanCommand,
  operationId: string,
  now = new Date().toISOString(),
): Wallet {
  if (!operationId) throw new Error("Missing operation reference.");
  if (original.operations.includes(operationId)) return original;
  const wallet: Wallet = JSON.parse(JSON.stringify(original));
  wallet.savings ??= [];
  wallet.circles ??= [];
  const day = localDate(new Date(now));
  if (command.type === "create-savings") {
    if (!["personal", "joint"].includes(command.kind))
      throw new Error("Choose personal or joint savings.");
    amount(command.target);
    amount(command.initial, true);
    if (!validDate(command.unlockDate) || command.unlockDate < day)
      throw new Error("Choose an unlock date today or later.");
    if (command.initial > command.target)
      throw new Error("The starting amount cannot exceed the target.");
    const owner = tallyTag(command.owner);
    const people = participants(
      owner,
      command.kind === "joint" ? command.tags : [],
      command.kind === "joint" ? 1 : 0,
      command.profiles,
    );
    if (command.kind === "joint" && command.initial)
      throw new Error(
        "Wait for all participants to accept before funding a joint goal.",
      );
    if (command.initial) sufficient(wallet, command.initial);
    const activity: PlanActivity[] = [];
    event(
      activity,
      operationId,
      "created",
      command.initial,
      owner,
      now,
      command.kind === "joint"
        ? "Joint goal created; invitations saved locally"
        : "Personal goal created",
    );
    wallet.savings.push({
      id: operationId,
      name: title(command.name),
      kind: command.kind,
      ownerTag: owner,
      target: command.target,
      saved: command.initial,
      unlockDate: command.unlockDate,
      status: "active",
      participants: people,
      activity,
      createdAt: now,
      updatedAt: now,
    });
  } else if (command.type === "create-ajo") {
    amount(command.amount);
    if (!validDate(command.firstDate) || command.firstDate < day)
      throw new Error("Choose a first collection date today or later.");
    const owner = tallyTag(command.owner);
    const people = participants(owner, command.tags, 2, command.profiles);
    if (!["weekly", "monthly", "biweekly"].includes(command.frequency))
      throw new Error("Choose a collection frequency.");
    if (!Number.isSafeInteger(command.amount * people.length))
      throw new Error("The circle total is too large.");
    wallet.circles.push({
      id: operationId,
      trackingMode: "external",
      name: title(command.name),
      ownerTag: owner,
      contribution: command.amount,
      frequency: command.frequency,
      nextDate: command.firstDate,
      firstDate: command.firstDate,
      round: 0,
      status: "active",
      participants: people,
      contributions: [],
      payouts: [],
      activity: [
        {
          id: operationId,
          type: "created",
          amount: 0,
          tag: owner,
          date: now,
          note: "Circle created; member agreement pending",
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
  } else if (
    command.type === "demo-response" ||
    command.type === "record-membership"
  ) {
    const plan = (
      command.type === "demo-response" && command.kind === "savings"
        ? wallet.savings
        : wallet.circles
    ).find((p) => p.id === command.id);
    if (!plan || plan.status !== "active")
      throw new Error("This plan is no longer active.");
    if ("trackingMode" in plan && plan.trackingMode !== "external")
      throw new Error(
        "Earlier demo circles are read-only. Create a tracking circle instead.",
      );
    const member = plan.participants.find(
      (p) => p.tag === tallyTag(command.tag),
    );
    if (!member || member.tag === plan.ownerTag)
      throw new Error("Choose an invited participant.");
    if (!["accepted", "declined"].includes(command.response))
      throw new Error("Choose a valid invitation response.");
    if (member.status !== "invited")
      throw new Error("This invitation has already been answered.");
    member.status = command.response;
    event(
      plan.activity,
      operationId,
      command.type,
      0,
      member.tag,
      now,
      command.type === "record-membership"
        ? `Member agreement recorded: ${command.response}`
        : `Demo invitation ${command.response}`,
    );
    plan.updatedAt = now;
  } else if (
    command.type === "save" ||
    command.type === "release-savings" ||
    command.type === "archive-savings"
  ) {
    const plan = wallet.savings.find((p) => p.id === command.id);
    if (!plan || plan.status === "archived")
      throw new Error("This savings goal is no longer active.");
    if (command.type === "save") {
      if (plan.status !== "active")
        throw new Error("This goal is already completed.");
      if (plan.participants.some((p) => p.status !== "accepted"))
        throw new Error(
          "Everyone must accept before this joint goal can be funded.",
        );
      sufficient(wallet, command.amount);
      if (plan.saved + command.amount > plan.target)
        throw new Error("That amount is more than the goal needs.");
      plan.saved += command.amount;
      event(
        plan.activity,
        operationId,
        "saved",
        command.amount,
        plan.ownerTag,
        now,
        "Added from demo available balance",
      );
    } else {
      if (
        command.type === "release-savings" &&
        (plan.status !== "active" || plan.saved === 0)
      )
        throw new Error("There is no saved money to release.");
      if (plan.saved && day < plan.unlockDate)
        throw new Error(`This money is locked until ${plan.unlockDate}.`);
      const released = plan.saved;
      plan.saved = 0;
      plan.status =
        command.type === "archive-savings" ? "archived" : "completed";
      event(
        plan.activity,
        operationId,
        command.type,
        released,
        plan.ownerTag,
        now,
        released
          ? "Saved money returned to available balance"
          : "Unfunded goal archived",
      );
    }
    plan.updatedAt = now;
  } else {
    const circle = wallet.circles.find((c) => c.id === command.id);
    if (!circle || circle.status === "archived")
      throw new Error("This circle is no longer active.");
    if (circle.trackingMode !== "external")
      throw new Error(
        "Earlier demo circles are read-only. Create a tracking circle instead.",
      );
    if (command.type === "archive-ajo") {
      if (
        circle.status !== "completed" &&
        circle.contributions.some((c) => !c.voidedAt)
      )
        throw new Error(
          "Finish every round before closing a circle with recorded contributions.",
        );
      circle.status = "archived";
      event(
        circle.activity,
        operationId,
        "archived",
        0,
        circle.ownerTag,
        now,
        "Circle archived; records kept",
      );
    } else {
      if (circle.status !== "active")
        throw new Error(
          "Every member has received their turn. This circle is complete.",
        );
      if (circle.participants.some((p) => p.status !== "accepted"))
        throw new Error(
          "Record everyone’s agreement before recording contributions.",
        );
      if (command.type === "undo-ajo-contribution") {
        const paid = circle.contributions.find(
          (c) =>
            c.round === circle.round &&
            c.tag === tallyTag(command.tag) &&
            !c.voidedAt,
        );
        if (!paid) throw new Error("No contribution to correct in this round.");
        paid.voidedAt = now;
        event(
          circle.activity,
          operationId,
          "contribution-corrected",
          paid.amount,
          paid.tag,
          now,
          "Contribution record marked as a mistake; no money moved",
        );
      } else {
        if (!validDate(command.paidOn) || command.paidOn > day)
          throw new Error("Choose the date paid, no later than today.");
        const reference = command.reference?.trim();
        if (reference && reference.length > 80)
          throw new Error("Use a reference of 80 characters or fewer.");
        if (command.type === "record-ajo-payout") {
          if (
            reference &&
            circle.payouts.some((payout) => payout.reference === reference)
          )
            throw new Error("That payout reference is already recorded.");
          const paid = circle.contributions.filter(
            (c) => c.round === circle.round && !c.voidedAt,
          );
          if (paid.length !== circle.participants.length)
            throw new Error(
              "Record every member’s contribution before the payout.",
            );
          if (paid.some((c) => c.date.slice(0, 10) > command.paidOn))
            throw new Error(
              "The payout date cannot be before the contributions.",
            );
          const recipient = circle.participants[circle.round].tag;
          const pot = circle.contribution * circle.participants.length;
          circle.payouts.push({
            round: circle.round,
            tag: recipient,
            amount: pot,
            date: command.paidOn,
            reference,
          });
          event(
            circle.activity,
            operationId,
            "payout-recorded",
            pot,
            recipient,
            now,
            "External payout recorded; no in-app transfer",
          );
          circle.round += 1;
          if (circle.round === circle.participants.length)
            circle.status = "completed";
          else
            circle.nextDate = advanceDate(
              circle.nextDate,
              circle.frequency,
              Number((circle.firstDate || circle.nextDate).slice(8, 10)),
            );
        } else {
          const tag = tallyTag(command.tag);
          if (!circle.participants.some((p) => p.tag === tag))
            throw new Error("Choose a member of this circle.");
          if (
            circle.contributions.some(
              (c) => c.round === circle.round && c.tag === tag && !c.voidedAt,
            )
          )
            throw new Error("This member’s contribution is already recorded.");
          if (
            reference &&
            circle.contributions.some(
              (c) => !c.voidedAt && c.reference === reference,
            )
          )
            throw new Error(
              "That payment reference is already recorded in this circle.",
            );
          circle.contributions.push({
            round: circle.round,
            tag,
            amount: circle.contribution,
            date: command.paidOn,
            reference,
            recordId: operationId,
          });
          event(
            circle.activity,
            operationId,
            "contribution-recorded",
            circle.contribution,
            tag,
            now,
            "External contribution recorded; wallet unchanged",
          );
        }
      }
    }
    circle.updatedAt = now;
  }
  wallet.operations.push(operationId);
  assertWallet(wallet);
  return wallet;
}

/** Keep old wallet-simulation history separate from actual external-payment records. */
export function migrateAjoTracking(
  original: Wallet,
  now = new Date().toISOString(),
): Wallet {
  if (!original.circles?.some((c) => !c.trackingMode)) return original;
  const wallet: Wallet = JSON.parse(JSON.stringify(original));
  for (const circle of wallet.circles || []) {
    if (circle.trackingMode) continue;
    const reserved = circle.contributions
      .filter(
        (c) =>
          c.tag === circle.ownerTag &&
          !circle.payouts.some((p) => p.round === c.round),
      )
      .reduce((sum, c) => sum + c.amount, 0);
    circle.trackingMode = "legacy-demo";
    circle.activity.push({
      id: `tracking-migration-${circle.id}`,
      type: "legacy-demo",
      amount: reserved,
      tag: circle.ownerTag,
      date: now,
      note: reserved
        ? "Earlier demo kept as read-only history; reserved demo funds released"
        : "Earlier demo kept as read-only history; not real payment records",
    });
  }
  assertWallet(wallet);
  return wallet;
}
