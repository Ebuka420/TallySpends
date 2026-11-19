/** View models and amount helpers for backend-backed planning. All amounts are integer kobo. */
export type Transaction = {
  source?: string;
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
  frequency?: "once" | "weekly" | "biweekly" | "monthly";
  startDate: string;
  endDate?: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};
export type Activity = {
  id: string;
  budgetId: string;
  kind:
    | "fund"
    | "move-in"
    | "move-out"
    | "release"
    | "spend"
    | "reversal"
    | "archive"
    | "restore"
    | "rename";
  amount: number;
  date: string;
  description: string;
  transactionId?: string;
};
export type Wallet = {
  backend?: { budgetId: number | null; period: string; totalAmount: number; totalSpent: number; remaining: number };
  version: 1;
  userId: string;
  openingBalance: number;
  transactions: Transaction[];
  budgets: Budget[];
  activity: Activity[];
  operations: string[];
  deductions: Record<string, { budgetId: string; amount: number }>;
  review: Record<string, string>;
  savings?: SavingsPlan[];
  circles?: AjoCircle[];
};
export type Participant = {
  tag: string;
  displayName?: string;
  avatarUri?: string;
  userId?: string;
  status: "accepted" | "invited" | "declined";
};
export type PlanActivity = {
  id: string;
  type: string;
  amount: number;
  tag: string;
  date: string;
  note: string;
};
export type SavingsPlan = {
  id: string;
  name: string;
  kind: "personal" | "joint";
  ownerTag: string;
  target: number;
  saved: number;
  unlockDate: string;
  status: "active" | "completed" | "archived";
  participants: Participant[];
  activity: PlanActivity[];
  createdAt: string;
  updatedAt: string;
};
export type AjoCircle = {
  serverStatus?: { currentPeriod: string; isGroupFullyFormed: boolean; currentPayoutRecipientUserId: number; maxMembers: number; memberCount: number; members: { userId: number; fullName: string; tallyTag: string; payoutPosition: number; contributionStatus: string; paidAt: string | null; missedCount: number }[] };
  id: string;
  trackingMode?: "external" | "legacy-demo";
  name: string;
  ownerTag: string;
  contribution: number;
  frequency: "weekly" | "monthly" | "biweekly";
  nextDate: string;
  firstDate?: string;
  round: number;
  status: "active" | "completed" | "archived";
  participants: Participant[];
  contributions: {
    round: number;
    tag: string;
    amount: number;
    date: string;
    reference?: string;
    recordId?: string;
    voidedAt?: string;
  }[];
  payouts: {
    round: number;
    tag: string;
    amount: number;
    date: string;
    reference?: string;
  }[];
  activity: PlanActivity[];
  createdAt: string;
  updatedAt: string;
};
export type Allocation = {
  name: string;
  category: string;
  amount: number;
  startDate: string;
  endDate?: string;
  frequency?: Budget["frequency"];
};
export type BudgetCommand =
  | { type: "allocate"; allocations: Allocation[]; totalAmount?: number }
  | { type: "add" | "release"; budgetId: string; amount: number }
  | { type: "archive"; budgetId: string }
  | { type: "restore"; budgetId: string }
  | { type: "rename"; budgetId: string; name: string }
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
export function totals(wallet: Wallet) {
  if (!wallet.backend) throw new Error('Refresh your plans to load the server balance.');
  return { balance: wallet.openingBalance, available: wallet.openingBalance,
    allocated: wallet.backend.totalAmount, remaining: wallet.backend.remaining };
}
export const reservedSavings = (wallet: Wallet) =>
  (wallet.savings || []).reduce((sum, plan) => sum + plan.saved, 0);
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
