import type { LinkedBankAccount } from "./backend";

export type AccountPeriod = "month" | "30days";
type AccountTransaction = NonNullable<LinkedBankAccount["transactions"]>[number];

export function accountMoney(amount: number | undefined, currency?: string) {
  if (amount === undefined || !Number.isFinite(amount) || !currency || !/^[A-Z]{3}$/.test(currency)) return "Unavailable";
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch { return "Unavailable"; }
}

function transactionTime(value: string) {
  if (typeof value !== "string") return NaN;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!dateOnly && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return NaN;
  const datePart = value.slice(0, 10);
  const check = new Date(datePart + "T00:00:00Z");
  if (!Number.isFinite(check.getTime()) || check.toISOString().slice(0, 10) !== datePart) return NaN;
  return new Date(dateOnly ? value + "T00:00:00" : value).getTime();
}

/** Only the selected account's supplied records are used; amounts are major units. */
export function accountInsights(account: LinkedBankAccount, period: AccountPeriod, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "month") start.setDate(1);
  else start.setDate(start.getDate() - 29);
  const available = Array.isArray(account.transactions);
  const ids = new Set<string>();
  let skipped = 0;
  const records: (AccountTransaction & { minor: number; time: number })[] = [];
  for (const tx of account.transactions ?? []) {
    const time = transactionTime(tx.date);
    const minor = Math.round(tx.amount * 100);
    if (!tx.id || ids.has(tx.id) || !["income", "expense"].includes(tx.type) ||
      !Number.isFinite(time) || !Number.isSafeInteger(minor) || minor < 0 || Math.abs(tx.amount * 100 - minor) > 0.00001) {
      skipped++; continue;
    }
    ids.add(tx.id);
    if (time >= start.getTime() && time <= now.getTime()) records.push({ ...tx, minor, time });
  }
  records.sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
  const income = records.filter(tx => tx.type === "income").reduce((sum, tx) => sum + tx.minor, 0);
  const expense = records.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + tx.minor, 0);
  const safe = Number.isSafeInteger(income) && Number.isSafeInteger(expense);
  const totalsAvailable = available && safe && !!account.currency && /^[A-Z]{3}$/.test(account.currency);
  const categories = new Map<string, number>();
  let largest: typeof records[number] | null = null;
  for (const tx of records) if (tx.type === "expense") {
    const category = tx.category?.trim() || "Uncategorised";
    categories.set(category, (categories.get(category) ?? 0) + tx.minor);
    if (!largest || tx.minor > largest.minor) largest = tx;
  }
  return {
    available, totalsAvailable, skipped, start,
    incoming: totalsAvailable ? income / 100 : undefined,
    outgoing: totalsAvailable ? expense / 100 : undefined,
    net: totalsAvailable ? (income - expense) / 100 : undefined,
    count: records.length, records, largest,
    categories: [...categories].map(([name, value]) => ({ name, amount: value / 100, share: expense ? value / expense : 0 }))
      .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name)),
  };
}

export function selectLinkedAccount(accounts: LinkedBankAccount[], requested?: string) {
  return accounts.find(account => account.id === requested) ?? accounts[0] ?? null;
}
