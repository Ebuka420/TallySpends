import type { Transaction } from "../budget/ledger";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hourLabel = (hour: number) => `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;

// Pass the report's selected transactions so this uses the same period and
// validation as the rest of Analytics. Times follow the device's local timezone.
export function spendingRhythm(transactions: Transaction[]) {
  const expenses = transactions.filter(tx => tx.type === "expense");
  const hourly = expenses.length > 0 && expenses.every(tx =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(tx.date));
  const labels = hourly ? Array.from({ length: 24 }, (_, hour) => hourLabel(hour)) : weekdays;
  const counts = labels.map(() => 0);
  expenses.forEach(tx => {
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(tx.date) ? tx.date + "T12:00:00" : tx.date);
    if (!Number.isFinite(date.getTime())) return;
    counts[hourly ? date.getHours() : (date.getDay() + 6) % 7]++;
  });
  const peak = Math.max(...counts);
  const busiest = labels.filter((_, index) => counts[index] === peak);
  const caption = !peak ? "No expenses recorded for this period."
    : busiest.length === labels.length ? `Your recorded expenses are evenly spread across ${hourly ? "hours" : "weekdays"}.`
    : busiest.length > 1 ? `${busiest.join(", ")} are tied for the most expense transactions.`
    : `${busiest[0]} has the most expense transactions (${peak}).`;
  return {
    hourly,
    caption,
    note: peak ? `Based on ${expenses.length} recorded expense ${expenses.length === 1 ? "transaction" : "transactions"}${hourly ? "; times are local to your device." : "; showing weekdays because transaction times are missing."}` : null,
    cells: labels.map((label, index) => ({ label, count: counts[index],
      intensity: counts[index] ? Math.max(1, Math.ceil(counts[index] / peak * 4)) : 0 })),
  };
}
