import type { TransactionFeedState } from "../transactions/feed";

export const EXPENSE_CHART_STYLES = ["line", "area", "bar", "donut", "table"] as const;
export type ExpenseChartStyle = typeof EXPENSE_CHART_STYLES[number];
export const EXPENSE_CHART_LABELS: Record<ExpenseChartStyle, string> = {
  line: "Line", area: "Area", bar: "Bar", donut: "Donut", table: "Table",
};
export const EXPENSE_CHART_HINTS: Record<ExpenseChartStyle, string> = {
  line: "Spending over time", area: "Spending over time, shaded",
  bar: "Tap a bar for the exact amount", donut: "Spending share by category", table: "Amounts and transaction counts",
};
export type ExpensePoint = { label: string; range: string; value: number; count: number };
type ExpenseRecord = { type: string; date: string; amount: number | string; category?: string };

// Cached rows are not evidence of a successful refresh. Only a confirmed feed
// can produce amounts; an unavailable feed must not look like a zero balance.
export function expenseReportData<T extends ExpenseRecord>(rows: T[], state: TransactionFeedState, date: Date, period: "month" | "year") {
  return state === "ready" ? expenseChartData(rows, date, period) : null;
}

export function expenseChartData<T extends ExpenseRecord>(rows: T[], date: Date, period: "month" | "year") {
  const transactions = rows.filter(tx => {
    if (!tx || (typeof tx.amount !== "number" && (typeof tx.amount !== "string" || !tx.amount.trim()))) return false;
    const when = new Date(tx.date);
    return tx.type === "expense" && Number.isFinite(Number(tx.amount)) && Number(tx.amount) >= 0
      && Number.isFinite(when.getTime()) && when.getFullYear() === date.getFullYear()
      && (period === "year" || when.getMonth() === date.getMonth());
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const points: ExpensePoint[] = Array.from({ length: period === "year" ? 12 : Math.ceil(days / 7) }, (_, index) => ({
    label: period === "year" ? new Date(date.getFullYear(), index, 1).toLocaleDateString("en-US", { month: "short" }) : `W${index + 1}`,
    range: period === "year" ? new Date(date.getFullYear(), index, 1).toLocaleDateString("en-US", { month: "long" })
      : `Days ${index * 7 + 1}–${Math.min((index + 1) * 7, days)}`,
    value: 0, count: 0,
  }));
  const categoryMap = new Map<string, number>();
  let total = 0;
  for (const tx of transactions) {
    const amount = Number(tx.amount);
    const when = new Date(tx.date);
    const bucket = points[period === "year" ? when.getMonth() : Math.floor((when.getDate() - 1) / 7)];
    bucket.value += amount; bucket.count++;
    const category = typeof tx.category === "string" && tx.category.trim() ? tx.category.trim() : "Uncategorized";
    categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
    total += amount;
  }
  return { transactions, points, total, categories: [...categoryMap.entries()].sort((a, b) => b[1] - a[1]) };
}

export function expenseDonutSlices(categories: [string, number][]) {
  const positive = categories.filter(([, value]) => value > 0);
  const grouped = positive.length <= 6 ? positive : [...positive.slice(0, 5),
    [`Remaining ${positive.length - 5} categories`, positive.slice(5).reduce((sum, [, value]) => sum + value, 0)] as [string, number]];
  const total = grouped.reduce((sum, [, value]) => sum + value, 0);
  let offset = 0;
  return grouped.map(([label, value]) => {
    const share = value / total;
    const slice = { label, value, share, offset };
    offset += share;
    return slice;
  });
}

