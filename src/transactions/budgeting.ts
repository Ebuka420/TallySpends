import { canonicalCategory, type Budget, type Transaction } from "../budget/ledger";

function transactionDay(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function spendingInMonth(transactions: readonly Transaction[], month: string): number {
  return transactions.reduce((sum, transaction) => {
    if (transaction.type !== "expense" || transactionDay(transaction.date)?.slice(0, 7) !== month) return sum;
    const amount = Math.round(Number(transaction.amount) * 100);
    return Number.isSafeInteger(amount) && amount >= 0 ? sum + amount : sum;
  }, 0);
}

/** Read-only category/date attribution; never changes the local wallet or its balance. */
export function spendingByBudget(transactions: readonly Transaction[], budgets: readonly Budget[]): Record<string, number> {
  const sums: Record<string, number> = Object.fromEntries(budgets.map(budget => [budget.id, 0]));
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const amount = Number(transaction.amount);
    const minorAmount = Math.round(amount * 100);
    const day = transactionDay(transaction.date);
    if (!Number.isSafeInteger(minorAmount) || minorAmount < 0 || !day) continue;
    const eligible = budgets.filter(budget => day >= budget.startDate && (!budget.endDate || day <= budget.endDate));
    const explicitId = typeof transaction.budgetId === "string" ? transaction.budgetId : null;
    const target = explicitId
      ? eligible.find(budget => budget.id === explicitId)
      : (() => {
          const category = transaction.isServerTransaction && (transaction.categoryName === null || transaction.categoryName === undefined)
            ? ""
            : typeof transaction.categoryName === "string" ? transaction.categoryName : transaction.category;
          if (typeof category !== "string" || !category.trim()) return undefined;
          const matches = eligible.filter(budget => canonicalCategory(budget.category) === canonicalCategory(category));
          return matches.length === 1 ? matches[0] : undefined;
        })();
    if (target) sums[target.id] += minorAmount;
  }
  return sums;
}
