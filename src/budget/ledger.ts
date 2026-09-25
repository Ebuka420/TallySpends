/** Local demo wallet. All calculations use integer kobo; no banking API is invoked. */
export const OPENING_BALANCE = 292678;
export type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: string;
  date: string;
  budgetId?: string;
  paymentReference?: string;
  [key: string]: unknown;
};
export type Budget = {
  id: string;
  userId: string;
  name: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  period: "ongoing" | "custom";
  frequency?: "once" | "weekly" | "biweekly" | "monthly";
  startDate: string;
  endDate?: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};
export type Activity = {
  id: string;
  budgetId: string;
  kind:
    | "fund"
    | "move-in"
    | "move-out"
    | "release"
    | "spend"
    | "reversal"
    | "archive"
    | "restore"
    | "rename";
  amount: number;
  date: string;
  description: string;
  transactionId?: string;
};
export type Wallet = {
  version: 1;
  userId: string;
  openingBalance: number;
  transactions: Transaction[];
  budgets: Budget[];
  activity: Activity[];
  operations: string[];
  deductions: Record<string, { budgetId: string; amount: number }>;
  review: Record<string, string>;
  savings?: SavingsPlan[];
  circles?: AjoCircle[];
};
export type Participant = {
  tag: string;
  displayName?: string;
  avatarUri?: string;
  userId?: string;
  status: "accepted" | "invited" | "declined";
};
export type PlanActivity = {
  id: string;
  type: string;
  amount: number;
  tag: string;
  date: string;
  note: string;
};
export type SavingsPlan = {
  id: string;
  name: string;
  kind: "personal" | "joint";
  ownerTag: string;
  target: number;
  saved: number;
  unlockDate: string;
  status: "active" | "completed" | "archived";
  participants: Participant[];
  activity: PlanActivity[];
  createdAt: string;
  updatedAt: string;
};
export type AjoCircle = {
  id: string;
  trackingMode?: "external" | "legacy-demo";
  name: string;
  ownerTag: string;
  contribution: number;
  frequency: "weekly" | "monthly" | "biweekly";
  nextDate: string;
  firstDate?: string;
  round: number;
  status: "active" | "completed" | "archived";
  participants: Participant[];
  contributions: {
    round: number;
    tag: string;
    amount: number;
    date: string;
    reference?: string;
    recordId?: string;
    voidedAt?: string;
  }[];
  payouts: {
    round: number;
    tag: string;
    amount: number;
    date: string;
    reference?: string;
  }[];
  activity: PlanActivity[];
  createdAt: string;
  updatedAt: string;
};
export type Allocation = {
  name: string;
  category: string;
  amount: number;
  startDate: string;
  endDate?: string;
  frequency?: Budget["frequency"];
};
export type BudgetCommand =
  | { type: "allocate"; allocations: Allocation[] }
  | { type: "add" | "release"; budgetId: string; amount: number }
  | { type: "archive"; budgetId: string }
  | { type: "restore"; budgetId: string }
  | { type: "rename"; budgetId: string; name: string }
  | { type: "move"; budgetId: string; destinationId: string; amount: number };

export function minor(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
    throw new Error("Enter an amount with no more than two decimal places.");
  const [whole, fraction = ""] = value.trim().split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  positive(result);
  return result;
}
function positive(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error("Enter a valid amount greater than zero.");
}
export const money = (amount: number) =>
  `₦${(amount / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const today = () => localDate(new Date());
export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && localDate(date) === value;
}
export function createWallet(transactions: Transaction[]): Wallet {
  const wallet: Wallet = {
    version: 1,
    userId: "local-demo",
    openingBalance: OPENING_BALANCE,
    transactions,
    budgets: [],
    activity: [],
    operations: [],
    deductions: {},
    review: {},
  };
  validateWallet(wallet);
  return wallet;
}
function transactionAmount(tx: Transaction) {
  return minor(String(tx.amount));
}
export function totals(wallet: Wallet) {
  const balance = wallet.transactions.reduce(
    (sum, tx) =>
      sum +
      (tx.type === "income" ? transactionAmount(tx) : -transactionAmount(tx)),
    wallet.openingBalance,
  );
  const remaining = wallet.budgets.reduce(
    (sum, b) => sum + b.remainingAmount,
    0,
  );
  return {
    balance,
    remaining,
    available:
      balance - remaining - reservedSavings(wallet) - reservedAjo(wallet),
    allocated: wallet.budgets
      .filter((b) => b.status === "active")
      .reduce((sum, b) => sum + b.allocatedAmount, 0),
  };
}
export const reservedSavings = (wallet: Wallet) =>
  (wallet.savings || []).reduce((sum, plan) => sum + plan.saved, 0);
export const reservedAjo = (wallet: Wallet) =>
  (wallet.circles || []).reduce(
    (sum, circle) =>
      sum +
      (circle.trackingMode ? [] : circle.contributions)
        .filter(
          (c) =>
            c.tag === circle.ownerTag &&
            !circle.payouts.some((p) => p.round === c.round),
        )
        .reduce((total, c) => total + c.amount, 0),
    0,
  );
function clone(wallet: Wallet): Wallet {
  return JSON.parse(JSON.stringify(wallet));
}
function bucket(wallet: Wallet, id: string) {
  const found = wallet.budgets.find((b) => b.id === id);
  if (!found) throw new Error("This budget is no longer available.");
  return found;
}
function entry(
  wallet: Wallet,
  budgetId: string,
  kind: Activity["kind"],
  amount: number,
  date: string,
  description: string,
  transactionId?: string,
) {
  wallet.activity.push({
    id: `activity-${wallet.activity.length + 1}`,
    budgetId,
    kind,
    amount,
    date,
    description,
    transactionId,
  });
}
function sufficient(balance: number, amount: number) {
  positive(amount);
  if (amount > balance)
    throw new Error(
      "Insufficient balance. Choose a smaller amount or add money first.",
    );
}
export function assertWallet(wallet: Wallet) {
  for (const b of wallet.budgets) {
    if (
      ![b.allocatedAmount, b.remainingAmount, b.spentAmount].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) ||
      b.allocatedAmount !== b.spentAmount + b.remainingAmount ||
      !["active", "archived"].includes(b.status) ||
      (b.status === "archived" && b.remainingAmount !== 0)
    ) {
      throw new Error("Budget balances could not be validated.");
    }
  }
  if (
    (wallet.savings !== undefined && !Array.isArray(wallet.savings)) ||
    (wallet.circles !== undefined && !Array.isArray(wallet.circles))
  )
    throw new Error("Saved plans need review.");
  const planIds = new Set<string>();
  for (const plan of [...(wallet.savings || []), ...(wallet.circles || [])]) {
    if (
      !plan ||
      typeof plan.id !== "string" ||
      planIds.has(plan.id) ||
      typeof plan.name !== "string" ||
      !plan.name.trim() ||
      !["active", "completed", "archived"].includes(plan.status) ||
      !Array.isArray(plan.participants) ||
      !Array.isArray(plan.activity) ||
      !plan.participants.length ||
      plan.participants.length > 10 ||
      plan.participants[0]?.tag !== plan.ownerTag ||
      plan.participants[0]?.status !== "accepted"
    )
      throw new Error("Saved plans need review.");
    const tags = new Set<string>();
    for (const member of plan.participants) {
      if (
        !member ||
        !/^[a-z0-9][a-z0-9_.-]{2,29}$/.test(member.tag) ||
        tags.has(member.tag) ||
        !["accepted", "invited", "declined"].includes(member.status)
      )
        throw new Error("Saved participants need review.");
      tags.add(member.tag);
    }
    planIds.add(plan.id);
  }
  for (const plan of wallet.savings || []) {
    if (
      !Number.isSafeInteger(plan.saved) ||
      plan.saved < 0 ||
      !Number.isSafeInteger(plan.target) ||
      plan.target <= 0 ||
      plan.saved > plan.target
    )
      throw new Error("Savings balances could not be validated.");
    if (
      !validDate(plan.unlockDate) ||
      !["personal", "joint"].includes(plan.kind) ||
      (plan.kind === "joint" && plan.participants.length < 2) ||
      (plan.kind === "personal" && plan.participants.length !== 1) ||
      (plan.status !== "active" && plan.saved !== 0) ||
      (plan.saved > 0 && plan.participants.some((p) => p.status !== "accepted"))
    )
      throw new Error("Saved savings goals need review.");
  }
  for (const circle of wallet.circles || []) {
    const count = circle.participants.length;
    if (
      !Number.isSafeInteger(circle.contribution) ||
      (circle.trackingMode !== undefined &&
        !["external", "legacy-demo"].includes(circle.trackingMode)) ||
      circle.contribution <= 0 ||
      !Number.isSafeInteger(circle.contribution * count) ||
      count < 3 ||
      !Number.isInteger(circle.round) ||
      circle.round < 0 ||
      circle.round > count ||
      (circle.status === "active" && circle.round === count) ||
      (circle.status === "completed" && circle.round !== count) ||
      !validDate(circle.nextDate) ||
      (circle.firstDate !== undefined && !validDate(circle.firstDate)) ||
      !["weekly", "monthly", "biweekly"].includes(circle.frequency) ||
      !Array.isArray(circle.contributions) ||
      !Array.isArray(circle.payouts) ||
      circle.payouts.length !== circle.round
    )
      throw new Error("Saved circle balances need review.");
    const contributions = new Set<string>();
    for (const contribution of circle.contributions) {
      const key = `${contribution.round}:${contribution.tag}`;
      if (
        !Number.isInteger(contribution.round) ||
        contribution.round < 0 ||
        contribution.round >= count ||
        contribution.round > circle.round ||
        !circle.participants.some(
          (p) => p.tag === contribution.tag && p.status === "accepted",
        ) ||
        contribution.amount !== circle.contribution ||
        !validDate(contribution.date?.slice(0, 10)) ||
        (contribution.voidedAt !== undefined &&
          !validDate(contribution.voidedAt.slice(0, 10))) ||
        (!contribution.voidedAt && contributions.has(key))
      )
        throw new Error("Saved circle contributions need review.");
      if (!contribution.voidedAt) contributions.add(key);
    }
    for (let round = 0; round < circle.payouts.length; round++) {
      const payout = circle.payouts[round];
      if (
        payout.round !== round ||
        payout.tag !== circle.participants[round].tag ||
        payout.amount !== circle.contribution * count ||
        circle.participants.some((p) => !contributions.has(`${round}:${p.tag}`))
      )
        throw new Error("Saved circle payouts need review.");
    }
    if (
      circle.status === "archived" &&
      circle.round < count &&
      circle.contributions.some((c) => !c.voidedAt)
    )
      throw new Error("A funded circle cannot be archived before completion.");
  }
  const summary = totals(wallet);
  if (
    !Number.isSafeInteger(summary.balance) ||
    !Number.isSafeInteger(summary.available) ||
    summary.balance < 0 ||
    summary.available < 0
  ) {
    throw new Error(
      "Not enough unallocated money. Release money from a budget or add demo funds before recording this transaction.",
    );
  }
}
/** Reject malformed storage without overwriting it or silently inventing a new balance. */
export function validateWallet(value: unknown): asserts value is Wallet {
  const w = value as Wallet;
  if (
    !w ||
    w.version !== 1 ||
    typeof w.userId !== "string" ||
    !Number.isSafeInteger(w.openingBalance) ||
    !Array.isArray(w.transactions) ||
    !Array.isArray(w.budgets) ||
    !Array.isArray(w.activity) ||
    !Array.isArray(w.operations) ||
    !w.deductions ||
    !w.review
  )
    throw new Error("Saved budget data is invalid. It has not been replaced.");
  const ids = new Set<string>();
  const references = new Set<string>();
  for (const tx of w.transactions) {
    if (
      !tx ||
      typeof tx.id !== "string" ||
      ids.has(tx.id) ||
      !["income", "expense"].includes(tx.type) ||
      typeof tx.category !== "string" ||
      typeof tx.title !== "string" ||
      !validDate(tx.date?.slice(0, 10))
    )
      throw new Error(
        "Saved transactions need review before budgets can load.",
      );
    transactionAmount(tx);
    if (tx.paymentReference && references.has(tx.paymentReference))
      throw new Error(
        "Duplicate payment references need review before budgets can load.",
      );
    ids.add(tx.id);
    if (tx.paymentReference) references.add(tx.paymentReference);
  }
  const budgetIds = new Set<string>();
  for (const b of w.budgets) {
    if (
      !b ||
      typeof b.id !== "string" ||
      budgetIds.has(b.id) ||
      typeof b.name !== "string" ||
      typeof b.category !== "string" ||
      !validDate(b.startDate) ||
      (b.endDate && !validDate(b.endDate))
    )
      throw new Error("Saved budgets need review before they can load.");
    budgetIds.add(b.id);
  }
  for (const [id, deduction] of Object.entries(w.deductions)) {
    if (!ids.has(id) || !budgetIds.has(deduction.budgetId))
      throw new Error("Saved spending references need review.");
    positive(deduction.amount);
  }
  assertWallet(w);
}
export function applyBudgetCommand(
  original: Wallet,
  command: BudgetCommand,
  operationId: string,
  now = new Date().toISOString(),
): Wallet {
  if (!operationId) throw new Error("An operation reference is required.");
  if (original.operations.includes(operationId)) return original;
  const wallet = clone(original);
  if (command.type === "allocate") {
    if (!command.allocations.length)
      throw new Error("Choose at least one allocation.");
    command.allocations.forEach((a, index) => {
      if (!a.name.trim() || !a.category.trim() || a.name.trim().length > 40)
        throw new Error("Choose a budget name of 1–40 characters.");
      if (
        a.frequency &&
        !["once", "monthly", "weekly", "biweekly"].includes(a.frequency)
      )
        throw new Error("Choose a valid budget frequency.");
      if (
        !validDate(a.startDate) ||
        (a.endDate && (!validDate(a.endDate) || a.endDate < a.startDate))
      )
        throw new Error("Choose a valid date range.");
      if (a.endDate && a.endDate < localDate(new Date(now)))
        throw new Error("The end date cannot be in the past.");
      sufficient(totals(wallet).available, a.amount);
      const id = `${operationId}-${index}`;
      wallet.budgets.push({
        id,
        userId: wallet.userId,
        name: a.name.trim(),
        category: a.category.trim(),
        allocatedAmount: a.amount,
        spentAmount: 0,
        remainingAmount: a.amount,
        period: a.endDate ? "custom" : "ongoing",
        frequency: a.frequency || "once",
        startDate: a.startDate,
        endDate: a.endDate,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      entry(wallet, id, "fund", a.amount, now, "Allocated from demo balance");
    });
  } else if (
    command.type === "archive" ||
    command.type === "restore" ||
    command.type === "rename"
  ) {
    const b = bucket(wallet, command.budgetId);
    if (command.type === "archive") {
      if (b.status === "archived") return original;
      const released = b.remainingAmount;
      b.allocatedAmount -= released;
      b.remainingAmount = 0;
      b.status = "archived";
      entry(
        wallet,
        b.id,
        "archive",
        released,
        now,
        "Archived; remaining money returned to available balance",
      );
    } else if (command.type === "restore") {
      b.status = "active";
      entry(wallet, b.id, "restore", 0, now, "Budget restored");
    } else {
      if (!command.name.trim() || command.name.trim().length > 40)
        throw new Error("Use a name of 1–40 characters.");
      b.name = command.name.trim();
      entry(wallet, b.id, "rename", 0, now, `Renamed to ${b.name}`);
    }
    b.updatedAt = now;
  } else {
    const from = bucket(wallet, command.budgetId);
    if (from.status !== "active")
      throw new Error("Restore this budget before adding or moving money.");
    positive(command.amount);
    if (command.type === "add") {
      sufficient(totals(wallet).available, command.amount);
      from.allocatedAmount += command.amount;
      from.remainingAmount += command.amount;
      entry(
        wallet,
        from.id,
        "fund",
        command.amount,
        now,
        "Added from demo balance",
      );
    } else {
      sufficient(from.remainingAmount, command.amount);
      from.allocatedAmount -= command.amount;
      from.remainingAmount -= command.amount;
      if (command.type === "move") {
        if (command.destinationId === from.id)
          throw new Error("Choose a different budget.");
        const to = bucket(wallet, command.destinationId);
        if (to.status !== "active")
          throw new Error("Choose an active destination budget.");
        to.allocatedAmount += command.amount;
        to.remainingAmount += command.amount;
        to.updatedAt = now;
        entry(
          wallet,
          from.id,
          "move-out",
          command.amount,
          now,
          `Moved to ${to.name}`,
        );
        entry(
          wallet,
          to.id,
          "move-in",
          command.amount,
          now,
          `Moved from ${from.name}`,
        );
      } else
        entry(
          wallet,
          from.id,
          "release",
          command.amount,
          now,
          "Released to available balance",
        );
    }
    from.updatedAt = now;
  }
  wallet.operations.push(operationId);
  assertWallet(wallet);
  return wallet;
}

export function canonicalCategory(category: string) {
  const normalized = category.trim().toLowerCase();
  return (
    (
      {
        food: "food & dining",
        restaurant: "food & dining",
        bills: "bills & utilities",
        school: "education",
      } as Record<string, string>
    )[normalized] || normalized
  );
}
/** One canonical transaction per provider reference. A feed echo never becomes a second cash debit. */
export function upsertTransaction(
  original: Wallet,
  tx: Transaction,
  now = new Date().toISOString(),
): Wallet {
  if (
    !tx.id ||
    !tx.title?.trim() ||
    !validDate(tx.date?.slice(0, 10)) ||
    !["income", "expense"].includes(tx.type)
  )
    throw new Error("A valid transaction, date and type are required.");
  const amount = transactionAmount(tx);
  const echo =
    tx.paymentReference &&
    original.transactions.find(
      (t) => t.paymentReference === tx.paymentReference && t.id !== tx.id,
    );
  if (echo) {
    if (transactionAmount(echo) !== amount || echo.type !== tx.type)
      throw new Error(
        "This payment reference conflicts with an existing transaction.",
      );
    return original;
  }
  const old = original.transactions.find((t) => t.id === tx.id);
  if (old && JSON.stringify(old) === JSON.stringify(tx)) return original;
  if (old?.planId || tx.planId)
    throw new Error(
      "Ajo settlement records cannot be edited from the transaction feed. Open the circle to view its history.",
    );
  const wallet = clone(original);
  undoDeduction(wallet, tx.id, now);
  wallet.transactions = [
    tx,
    ...wallet.transactions.filter((t) => t.id !== tx.id),
  ];
  delete wallet.review[tx.id];
  if (tx.type === "expense") {
    const day = tx.date.slice(0, 10);
    const candidates = wallet.budgets.filter(
      (b) =>
        b.status === "active" &&
        day >= b.startDate &&
        (!b.endDate || day <= b.endDate) &&
        (tx.budgetId
          ? b.id === tx.budgetId
          : canonicalCategory(b.category) === canonicalCategory(tx.category)),
    );
    if (tx.budgetId && candidates.length !== 1)
      throw new Error("Choose a budget whose dates include this transaction.");
    const target = candidates.length === 1 ? candidates[0] : undefined;
    if (target && target.remainingAmount >= amount) {
      target.remainingAmount -= amount;
      target.spentAmount += amount;
      target.updatedAt = now;
      wallet.deductions[tx.id] = { budgetId: target.id, amount };
      entry(wallet, target.id, "spend", amount, tx.date, tx.title, tx.id);
    } else if (tx.budgetId)
      throw new Error(
        "This budget does not have enough money for that expense.",
      );
    else if (candidates.length)
      wallet.review[tx.id] = target
        ? `${tx.title}: budget balance too low. Recorded against unallocated money.`
        : `${tx.title}: more than one matching budget. Open a budget to assign this expense.`;
  }
  assertWallet(wallet);
  return wallet;
}
function undoDeduction(wallet: Wallet, id: string, now: string) {
  const previous = wallet.deductions[id];
  if (!previous) return;
  const b = bucket(wallet, previous.budgetId);
  b.spentAmount -= previous.amount;
  if (b.status === "archived") b.allocatedAmount -= previous.amount;
  else b.remainingAmount += previous.amount;
  b.updatedAt = now;
  entry(
    wallet,
    b.id,
    "reversal",
    previous.amount,
    now,
    "Expense edited or removed",
    id,
  );
  delete wallet.deductions[id];
}
export function removeTransaction(
  original: Wallet,
  id: string,
  now = new Date().toISOString(),
) {
  if (original.transactions.some((tx) => tx.id === id && tx.planId))
    throw new Error(
      "Ajo settlement records cannot be deleted. Their history keeps the circle balance correct.",
    );
  const wallet = clone(original);
  undoDeduction(wallet, id, now);
  wallet.transactions = wallet.transactions.filter((t) => t.id !== id);
  delete wallet.review[id];
  assertWallet(wallet);
  return wallet;
}
/** Deliberately unavailable until a payment provider supplies confirmed references. */
export const budgetPayments = {
  available: false,
  async pay(
    _budgetId: string,
    _amount: number,
    _recipient: string,
  ): Promise<never> {
    throw new Error(
      "Budget payments are not connected yet. You can record an expense you have already paid.",
    );
  },
};
