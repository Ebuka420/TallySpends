import type { Transaction } from "../budget/ledger";
export type AnalyticsTimeframe = "weekly" | "monthly" | "yearly";
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateOf = (value: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
export const reportMoney = (kobo: number) => `${kobo < 0 ? "−" : ""}₦${(Math.abs(kobo) / 100).toLocaleString("en-NG", {
  minimumFractionDigits: kobo % 100 ? 2 : 0,
  maximumFractionDigits: 2
})}`;
export function analyticsRange(timeframe: AnalyticsTimeframe, period: string, now = new Date()) {
  const year = timeframe === "yearly" && /^\d{4}$/.test(period) ? Number(period) : now.getFullYear();
  const month = timeframe === "monthly" && months.includes(period) ? months.indexOf(period) : now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const week = Math.min(Math.floor((lastDay - 1) / 7), /^W[1-5]$/.test(period) ? Number(period.slice(1)) - 1 : 0);
  const start = new Date(year, timeframe === "yearly" ? 0 : month, timeframe === "weekly" ? week * 7 + 1 : 1, 12);
  const end = new Date(year, timeframe === "yearly" ? 12 : month + 1, 0, 12);
  if (timeframe === "weekly") end.setDate(Math.min(lastDay, week * 7 + 7));
  const label = timeframe === "yearly" ? String(year) : timeframe === "monthly" ? start.toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric"
  }) : `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString("en-NG", {
    month: "short",
    year: "numeric"
  })}`;
  return {
    start,
    end,
    label,
    timeframe,
    heading: timeframe === "yearly" ? String(year) : timeframe === "monthly" ? start.toLocaleDateString("en-NG", {
      month: "long"
    }) : "Your week",
    edition: timeframe === "yearly" ? "YEAR IN REVIEW" : timeframe === "monthly" ? "MONTHLY EDITION" : "WEEKLY EDITION"
  };
}
export function analyticsReport(transactions: Transaction[], range: ReturnType<typeof analyticsRange>) {
  const records = transactions.flatMap(tx => {
    const date = dateOf(tx.date),
      amount = Math.round(Number(tx.amount) * 100);
    if (!Number.isFinite(date.getTime()) || !Number.isSafeInteger(amount) || amount <= 0 || !["income", "expense"].includes(tx.type)) return [];
    const key = dateKey(date);
    return key >= dateKey(range.start) && key <= dateKey(range.end) ? [{
      tx,
      date,
      amount
    }] : [];
  });
  const expenses = records.filter(record => record.tx.type === "expense");
  const spent = expenses.reduce((sum, row) => sum + row.amount, 0);
  const income = records.filter(row => row.tx.type === "income").reduce((sum, row) => sum + row.amount, 0);
  const categories = new Map<string, number>();
  expenses.forEach(({
    tx,
    amount
  }) => {
    const name = tx.category || "Others";
    categories.set(name, (categories.get(name) || 0) + amount);
  });
  const ranked = [...categories].sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({
    name,
    amount,
    share: spent ? amount / spent : 0
  }));
  const breakdown = ranked.slice(0, 3);
  const remaining = ranked.slice(3).reduce((sum, row) => sum + row.amount, 0);
  if (remaining) breakdown.push({
    name: "Everything else",
    amount: remaining,
    share: remaining / spent
  });
  const count = range.timeframe === "yearly" ? 12 : range.timeframe === "monthly" ? Math.ceil(range.end.getDate() / 7) : range.end.getDate() - range.start.getDate() + 1;
  const chart = Array.from({
    length: count
  }, (_, index) => ({
    label: range.timeframe === "yearly" ? months[index] : range.timeframe === "monthly" ? `W${index + 1}` : String(range.start.getDate() + index),
    amount: expenses.filter(row => (range.timeframe === "yearly" ? row.date.getMonth() : range.timeframe === "monthly" ? Math.floor((row.date.getDate() - 1) / 7) : row.date.getDate() - range.start.getDate()) === index).reduce((sum, row) => sum + row.amount, 0)
  }));
  const top = ranked[0];
  return {
    range,
    selected: records.map(row => row.tx),
    spent,
    income,
    net: income - spent,
    count: records.length,
    expenseCount: expenses.length,
    breakdown,
    chart,
    takeaway: top ? `${top.name} made up ${Math.round(top.share * 100)}% of your spending this period.` : records.length ? "Money came in, with no spending recorded in this period." : "A quiet page. No transactions recorded in this period yet."
  };
}
export type AnalyticsReport = ReturnType<typeof analyticsReport>;
export function reportText(report: AnalyticsReport) {
  return [`TallySpends · ${report.range.label}`, "Your money, in focus.", "", `Money out: ${reportMoney(report.spent)}`, `Money in: ${reportMoney(report.income)}`, `Net flow: ${reportMoney(report.net)} (income minus spending)`, `${report.count} recorded transactions`, "", "Where it went", ...report.breakdown.map(row => `${row.name}: ${reportMoney(row.amount)} · ${Math.round(row.share * 100)}%`), "", report.takeaway].join("\n");
}
