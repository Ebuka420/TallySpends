import type { Transaction } from "./budget/ledger";

/** Show recorded details only; do not invent bank accounts or card numbers. */
export function transactionPresentation(transaction: Transaction | null, isDark: boolean) {
  const title = transaction?.title || "Transaction";
  const lower = title.toLowerCase();
  const text = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value : fallback;
  const common = {
    iconBg: isDark ? "#281D33" : "#F3EBF8"
  };
  if (lower.startsWith("transfer to")) return {
    ...common,
    type: "transfer",
    title: text(transaction?.recipientName, title.replace(/transfer to\s+/i, "")),
    subtitle: text(transaction?.methodDetail, "Tally transfer"),
    badge: "Transfer",
    icon: "paper-plane-outline" as const,
    heading: "Transfer recorded",
    description: "Your transfer is saved in your transaction history."
  };
  if (lower.startsWith("withdraw")) return {
    ...common,
    type: "bank",
    title: text(transaction?.method, title.replace(/withdraw(?:al)? to\s+/i, "")),
    subtitle: text(transaction?.methodDetail, "Wallet withdrawal"),
    badge: "Withdrawal",
    icon: "arrow-up-outline" as const,
    heading: "Withdrawal recorded",
    description: "Your withdrawal is saved in your transaction history."
  };
  if (transaction?.type === "income") return {
    ...common,
    type: "income",
    title: text(transaction.method, title),
    subtitle: text(transaction.methodDetail, "Wallet credit"),
    badge: "Money in",
    icon: "arrow-down-outline" as const,
    heading: lower.startsWith("deposit") ? "Deposit recorded" : "Income recorded",
    description: "Your wallet balance has been updated."
  };
  return {
    ...common,
    type: "merchant",
    title,
    subtitle: text(transaction?.category, "Expense"),
    badge: "Expense",
    icon: "bag-handle-outline" as const,
    heading: "Expense recorded",
    description: "Your spending and balance have been updated."
  };
}
