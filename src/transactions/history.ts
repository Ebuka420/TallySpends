import type { Transaction } from "../budget/ledger";

export type HistoryType = "all" | "income" | "expense" | "transfer" | "deposit" | "withdrawal";
export type HistoryRange = "all" | "today" | "week" | "month" | "custom";
export type HistorySort = "newest" | "oldest" | "largest" | "smallest";
export type HistoryFilters = { type: HistoryType; range: HistoryRange; category: string | null; from: string; to: string; minimum: string; maximum: string; sort: HistorySort };
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const transactionDate = (value: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
export function defaultHistoryFilters(now = new Date()): HistoryFilters {
  return { type: "all", range: "all", category: null, from: dateKey(new Date(now.getFullYear(), now.getMonth(), 1)), to: dateKey(now), minimum: "", maximum: "", sort: "newest" };
}
function inputMinor(value: string) { return value === "" ? null : /^\d{1,10}(?:\.\d{0,2})?$/.test(value) ? Math.round(Number(value) * 100) : NaN; }
export function validateHistoryFilters(filters: HistoryFilters) {
  if (filters.range === "custom") {
    const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(transactionDate(value)) === value;
    if (!valid(filters.from) || !valid(filters.to)) return "Choose valid start and end dates.";
    if (filters.from > filters.to) return "The end date must be on or after the start date.";
  }
  const min = inputMinor(filters.minimum), max = inputMinor(filters.maximum);
  if (Number.isNaN(min) || Number.isNaN(max)) return "Enter valid amounts with up to two decimal places.";
  if (min !== null && max !== null && min > max) return "The maximum amount must be at least the minimum.";
  return "";
}
export function transactionKind(tx: Transaction): HistoryType {
  if (/^transfer to/i.test(tx.title)) return "transfer";
  if (/^withdraw/i.test(tx.title)) return "withdrawal";
  if (/^deposit/i.test(tx.title) && tx.type === "income") return "deposit";
  return tx.type === "income" ? "income" : "expense";
}
export function filterHistory(transactions: Transaction[], filters: HistoryFilters, search = "", now = new Date()) {
  if (validateHistoryFilters(filters)) return [];
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (filters.range === "week") start.setDate(start.getDate() - 6);
  if (filters.range === "month") start.setDate(1);
  const from = filters.range === "custom" ? filters.from : dateKey(start);
  const to = filters.range === "custom" ? filters.to : dateKey(now);
  const min = inputMinor(filters.minimum), max = inputMinor(filters.maximum);
  const tokens = search.trim().toLowerCase().replace(/[₦,]/g, "").split(/\s+/).filter(Boolean);
  return transactions.filter(tx => {
    const amount = Math.round(Number(tx.amount) * 100);
    if (!Number.isSafeInteger(amount) || amount < 0) return false;
    if (filters.type !== "all" && (filters.type === "income" || filters.type === "expense" ? tx.type !== filters.type : transactionKind(tx) !== filters.type)) return false;
    if (filters.category && tx.category !== filters.category) return false;
    if ((min !== null && amount < min) || (max !== null && amount > max)) return false;
    if (filters.range !== "all") {
      const date = transactionDate(tx.date);
      if (!Number.isFinite(date.getTime())) return false;
      const key = dateKey(date);
      if (key < from || key > to) return false;
    }
    const haystack = [tx.title, tx.category, tx.memo, tx.id, tx.recipientName, tx.method, tx.methodDetail, tx.amount, (amount / 100).toFixed(2)].filter(item => typeof item === "string" || typeof item === "number").join(" ").toLowerCase().replace(/[₦,]/g, "");
    return tokens.every(token => haystack.includes(token));
  }).sort((a, b) => {
    const aTime = transactionDate(a.date).getTime(), bTime = transactionDate(b.date).getTime();
    const dateOrder = (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    const primary = filters.sort === "largest" ? b.amount - a.amount : filters.sort === "smallest" ? a.amount - b.amount : filters.sort === "oldest" ? -dateOrder : dateOrder;
    return primary || dateOrder || a.id.localeCompare(b.id);
  });
}
export function historyTotals(transactions: Transaction[]) {
  return transactions.reduce((sum, tx) => { const amount = Math.round(Number(tx.amount) * 100); if (tx.type === "income") sum.income += amount; else sum.expense += amount; return sum; }, { income: 0, expense: 0 });
}
export function historySections(transactions: Transaction[], sort: HistorySort, now = new Date()) {
  if (!transactions.length) return [];
  if (sort === "largest" || sort === "smallest") return [{ title: sort === "largest" ? "Largest amounts first" : "Smallest amounts first", key: sort, data: transactions }];
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const groups = new Map<string, { title: string; key: string; data: Transaction[] }>();
  transactions.forEach(tx => {
    const date = transactionDate(tx.date);
    const key = Number.isFinite(date.getTime()) ? dateKey(date) : "unknown";
    if (!groups.has(key)) groups.set(key, { key, title: key === dateKey(now) ? "Today" : key === dateKey(yesterday) ? "Yesterday" : key === "unknown" ? "Date unavailable" : date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }), data: [] });
    groups.get(key)!.data.push(tx);
  });
  return [...groups.values()];
}
