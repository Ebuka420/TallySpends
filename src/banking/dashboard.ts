import type { LinkedBankAccount } from "./backend";
import type { WalletEntry } from "../wallet/api";
import { accountInsights, accountMoney } from "./insights";

export function dashboardBankAccounts(accounts: readonly LinkedBankAccount[]) {
  // The bank catalogue supplies logos only. Cards require an explicitly linked
  // backend account, never a saved payment card or a disconnected connection.
  return accounts.filter(account => account.status === "Linked");
}
export type DashboardActivity = {
  id: string; title: string; amount: number; type: "income" | "expense";
  date: string; category: string; status?: string;
};
export type DashboardInsight = { id: string; title: string; text: string; icon: "arrow-down-outline" | "arrow-up-outline" | "pie-chart-outline" | "card-outline" };
export function dashboardActivity(account: LinkedBankAccount | undefined, walletEntries: readonly WalletEntry[], walletReady: boolean) {
  if (account) {
    // Do not substitute GET /transactions: its documented records have no bank
    // account ID and cannot safely be attributed by name, source, or currency.
    const available = account.status === "Linked" && Array.isArray(account.transactions);
    const records: DashboardActivity[] = available ? account.transactions!.filter(tx =>
      Number.isFinite(tx.amount) && tx.amount >= 0 && ["income", "expense"].includes(tx.type) && Number.isFinite(Date.parse(tx.date)))
      .map(tx => ({ ...tx, type: tx.type as "income" | "expense", category: tx.category || "Other" })) : [];
    return { name: account.bankName, available, currency: account.currency, records, bank: true };
  }
  return {
    name: "TallySpends wallet", available: walletReady, currency: "NGN", bank: false,
    records: (walletReady ? walletEntries : []).map((entry): DashboardActivity => ({ id: entry.id, title: entry.description || entry.source,
      amount: Math.abs(entry.amount), type: entry.entryType === "Credit" ? "income" : "expense", date: entry.createdAt,
      category: entry.source, status: entry.status })),
  };
}
export function dashboardInsightCards(activity: ReturnType<typeof dashboardActivity>, now = new Date()): DashboardInsight[] {
  if (!activity.available) return [{ id: "unavailable", title: `${activity.name} activity`,
    text: `Transaction details for ${activity.name} are unavailable.`, icon: "card-outline" }];
  const data = accountInsights({ id: "selected", bankName: activity.name, currency: activity.currency,
    transactions: activity.records.filter(tx => !tx.status || tx.status === "Posted") }, "month", now);
  if (!data.count) return [{ id: "no-activity", title: "No insights yet",
    text: `Insights for ${activity.name} will appear after posted activity this month.`, icon: "card-outline" }];
  const period = activity.bank ? "This month" : "This month, within the latest 50 wallet entries";
  if (!data.totalsAvailable) return [{ id: "totals-unavailable", title: `${activity.name} activity`, text: "Totals are unavailable for this account.", icon: "card-outline" }];
  return [
    { id: "income", title: "Money received", text: `${accountMoney(data.incoming, activity.currency)} · ${period}.`, icon: "arrow-down-outline" },
    { id: "expense", title: "Money spent", text: `${accountMoney(data.outgoing, activity.currency)} · ${period}.`, icon: "arrow-up-outline" },
    { id: "category", title: "Top spending category", text: data.categories[0]
      ? `${data.categories[0].name}: ${accountMoney(data.categories[0].amount, activity.currency)} · ${period}.`
      : `No posted expenses · ${period}.`, icon: "pie-chart-outline" },
  ];
}
