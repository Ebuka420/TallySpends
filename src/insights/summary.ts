import type { Transaction } from "../budget/ledger";
export type Period = "week" | "month" | "custom";
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateLabel = (date: Date) => date.toLocaleDateString("en-NG", {
  day: "numeric",
  month: "short"
});
const currency = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG", {
  maximumFractionDigits: 2
})}`;
const dayNumber = (date: Date) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

/** Transaction amounts are naira; aggregate in kobo to avoid decimal drift. */
export function spendingSummary(transactions: Transaction[], period: Period, now = new Date(), customStart?: Date | null, customEnd?: Date | null) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start = new Date(end);
  if (period === "week") start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  if (period === "month") start.setDate(1);
  if (period === "custom" && customStart) {
    start = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate());
    end.setTime((customEnd || customStart).getTime());
  }
  if (start > end) {
    const old = new Date(start);
    start = new Date(end);
    end.setTime(old.getTime());
  }
  const days = dayNumber(end) - dayNumber(start) + 1;
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);
  const records = transactions.flatMap(tx => {
    // Parse date-only records in local time, matching the app's calendar.
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(tx.date) ? `${tx.date}T12:00:00` : tx.date);
    const amount = Math.round(Number(tx.amount) * 100);
    return Number.isFinite(date.getTime()) && Number.isSafeInteger(amount) && amount > 0 && ["expense", "income"].includes(tx.type) ? [{
      ...tx,
      dateKey: dayKey(date),
      day: dayNumber(date),
      kobo: amount
    }] : [];
  });
  const selected = records.filter(tx => tx.dateKey >= dayKey(start) && tx.dateKey <= dayKey(end));
  const previous = records.filter(tx => tx.type === "expense" && tx.dateKey >= dayKey(previousStart) && tx.dateKey <= dayKey(previousEnd));
  const expenses = selected.filter(tx => tx.type === "expense");
  const spent = expenses.reduce((sum, tx) => sum + tx.kobo, 0);
  const income = selected.filter(tx => tx.type === "income").reduce((sum, tx) => sum + tx.kobo, 0);
  const previousSpent = previous.reduce((sum, tx) => sum + tx.kobo, 0);
  const categories = [...new Set(expenses.map(tx => tx.category || "Others"))].map(name => ({
    name,
    amount: expenses.filter(tx => (tx.category || "Others") === name).reduce((sum, tx) => sum + tx.kobo, 0),
    previous: previous.filter(tx => (tx.category || "Others") === name).reduce((sum, tx) => sum + tx.kobo, 0)
  })).sort((a, b) => b.amount - a.amount);
  // Keep the original 7-column, 3-row design. Long periods use equal date buckets.
  const buckets = Array.from({
    length: 21
  }, (_, index) => {
    const from = Math.floor(index * days / 21);
    const to = Math.floor((index + 1) * days / 21);
    const first = new Date(start);
    first.setDate(first.getDate() + from);
    const last = new Date(start);
    last.setDate(last.getDate() + Math.max(from, to - 1));
    const matching = expenses.filter(tx => tx.day - dayNumber(start) >= from && tx.day - dayNumber(start) < to);
    return {
      label: to === from ? "No date in this cell" : `${dateLabel(first)}${to - from > 1 ? ` – ${dateLabel(last)}` : ""}`,
      count: matching.length,
      amount: matching.reduce((sum, tx) => sum + tx.kobo, 0)
    };
  });
  const max = Math.max(1, ...buckets.map(bucket => bucket.amount));
  const points = buckets.map((bucket, i) => ({
    x: 5 + i * 107 / 20,
    y: 60 - bucket.amount / max * 48
  }));
  const change = previousSpent ? (spent - previousSpent) / previousSpent * 100 : null;
  const top = categories[0];
  const periodLabel = `${dateLabel(start)} – ${dateLabel(end)}`;
  return {
    start,
    end,
    days,
    selected,
    expenses,
    spent,
    income,
    previousSpent,
    categories,
    top,
    buckets,
    max,
    change,
    periodLabel,
    dateTitle: period === "month" ? now.toLocaleDateString("en-NG", {
      month: "long",
      year: "numeric"
    }) : periodLabel,
    headline: !selected.length ? "A fresh start for this period" : change === null ? "Your spending at a glance" : change < 0 ? "Your spending is down this period" : change > 0 ? "Your spending is up this period" : "Your spending is holding steady",
    description: !selected.length ? "No transactions recorded in this range. Add a transaction or choose another date range." : `${currency(spent)} spent · ${currency(income)} received.${change !== null ? ` Spending is ${Math.abs(change).toFixed(1)}% ${change <= 0 ? "lower" : "higher"} than the previous ${days} days.` : " Record more days to compare your spending."}`,
    changeLabel: change === null ? "No earlier spending" : `${Math.abs(change).toFixed(1)}% ${change <= 0 ? "less spent" : "more spent"}`,
    balanceLabel: !selected.length ? "Awaiting transactions" : `Net flow: ${currency(income - spent)}`,
    highlight: top ? `Top category: ${top.name} · ${currency(top.amount)}` : "Your biggest spending category will appear here",
    path: points.map((p, i) => `${i ? "L" : "M"} ${p.x},${p.y}`).join(" "),
    lastPoint: points[20]
  };
}
export function answerSpending(question: string, data: ReturnType<typeof spendingSummary>, availableNaira = 0) {
  const q = question.toLowerCase();
  const base = {
    query: question,
    summary: data.description,
    details: [`Period: ${data.periodLabel}`, `${data.expenses.length} expense transactions`, `Daily average: ${currency(Math.round(data.spent / data.days))}`],
    actionableTip: "Choose a date range above to explore a different period."
  };
  const requested = q.match(/(?:₦\s*|(?:save|afford)\s+)([\d,]+(?:\.\d{1,2})?)(k)?/);
  const target = requested ? Math.round(Number(requested[1].replace(/,/g, "")) * (requested[2] ? 1000 : 1) * 100) : 0;
  if (q.includes("afford")) return {
    ...base,
    summary: target ? `${currency(target)} ${target <= Math.round(availableNaira * 100) ? "fits within" : "exceeds"} your current available balance of ${currency(Math.round(availableNaira * 100))}.` : `Your available balance is ${currency(Math.round(availableNaira * 100))}.`,
    actionableTip: "Keep upcoming bills in mind before spending. Unrecorded commitments are not included."
  };
  if (!data.selected.length) return {
    ...base,
    details: [`Period: ${data.periodLabel}`, "No recorded transactions in this range."],
    actionableTip: "Record an expense or select a period with transactions to see a breakdown."
  };
  if (/save|budget/.test(q)) return {
    ...base,
    summary: target ? `Saving ${currency(target)} would mean setting aside ${currency(Math.ceil(target / 4))} each week over four weeks.` : `Your recorded income minus spending is ${currency(data.income - data.spent)} for this period.`,
    details: data.categories.slice(0, 3).map(c => `${c.name}: ${currency(c.amount)} recorded; a 10% reduction would free ${currency(Math.round(c.amount * .1))}.`),
    actionableTip: "These are planning scenarios, not guaranteed savings. Set a target you can cover after essentials."
  };
  if (/why|more|increase|less|compar/.test(q)) return {
    ...base,
    summary: data.change === null ? "There is no spending in the comparison period yet." : `Spending changed by ${currency(data.spent - data.previousSpent)} compared with the previous ${data.days} days.`,
    details: [`Previous spending: ${currency(data.previousSpent)}`, `Selected spending: ${currency(data.spent)}`, ...[...data.categories].sort((a, b) => b.amount - b.previous - (a.amount - a.previous)).slice(0, 2).map(c => `${c.name}: ${currency(c.amount - c.previous)} change`)],
    actionableTip: "Compare the same number of days when reviewing a partial week or month."
  };
  if (/where|most|category|spent|spend/.test(q) && data.top) return {
    ...base,
    summary: `${data.top.name} is your largest category at ${currency(data.top.amount)} (${Math.round(data.top.amount / data.spent * 100)}% of spending).`,
    details: data.categories.slice(0, 3).map(c => `${c.name}: ${currency(c.amount)}`),
    actionableTip: `Review your ${data.top.name.toLowerCase()} transactions before choosing a spending limit.`
  };
  return {
    ...base,
    summary: "I can summarise recorded spending, compare periods, explore savings targets or check an amount against your available balance.",
    actionableTip: "Try one of the suggested questions above."
  };
}
