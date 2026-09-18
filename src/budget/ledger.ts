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
  startDate: string;
  endDate?: string;
  status: "active";
  createdAt: string;
  updatedAt: string;
};
export type Activity = {
  id: string;
  budgetId: string;
  kind: "fund" | "move-in" | "move-out" | "release" | "spend" | "reversal";
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
};
export type Allocation = {
  name: string;
  category: string;
  amount: number;
  startDate: string;
  endDate?: string;
};
export type BudgetCommand =
  | { type: "allocate"; allocations: Allocation[] }
  | { type: "add" | "release"; budgetId: string; amount: number }
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
    available: balance - remaining,
    allocated: wallet.budgets.reduce((sum, b) => sum + b.allocatedAmount, 0),
  };
}
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
function assertWallet(wallet: Wallet) {
  const summary = totals(wallet);
  if (
    !Number.isSafeInteger(summary.balance) ||
    summary.balance < 0 ||
    summary.available < 0
  ) {
    throw new Error(
      "Not enough unallocated money. Release money from a budget before recording this transaction.",
    );
  }
  for (const b of wallet.budgets) {
    if (
      ![b.allocatedAmount, b.remainingAmount, b.spentAmount].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) ||
      b.allocatedAmount !== b.spentAmount + b.remainingAmount
    ) {
      throw new Error("Budget balances could not be validated.");
    }
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
        startDate: a.startDate,
        endDate: a.endDate,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      entry(wallet, id, "fund", a.amount, now, "Allocated from demo balance");
    });
  } else {
    const from = bucket(wallet, command.budgetId);
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
  b.remainingAmount += previous.amount;
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
