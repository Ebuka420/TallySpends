import type { ApiRequest } from "../network";
import { decodeTransactionFeed } from "../transactions/api";
import { isSandboxBankTransaction } from "../banking/environment";

export type PeriodType = "weekly" | "monthly" | "yearly";

export const PERIOD_TYPE_MAP: Record<PeriodType, 1 | 2 | 3> = {
  weekly: 1,
  monthly: 2,
  yearly: 3,
};

export interface FinancialHealth {
  score: number;
  status: string;
  recommendation: string;
}

export interface AnalyticsTotals {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  savingsChangePercent: number;
}

export interface AnalyticsTrendPoint {
  pointDate: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface AnalyticsCategorySummary {
  categoryId: number;
  categoryName: string;
  icon?: string;
  colorHex?: string;
  totalSpent: number;
  transactionCount: number;
  percentageOfExpenses: number;
  changePercent: number;
}

export interface SpendingHeatMapCell {
  dayOfWeek: number;
  hourOfDay: number;
  totalSpent: number;
  transactionCount: number;
  intensity: number;
}

export interface AnalyticsInsight {
  title: string;
  message: string;
  insightType: string;
  changePercent: number | null;
  sortOrder: number;
}

export interface AnalyticsDashboard {
  analyticsSummaryId: number;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  financialHealth: FinancialHealth;
  totals: AnalyticsTotals;
  trendPoints: AnalyticsTrendPoint[];
  categorySummaries: AnalyticsCategorySummary[];
  heatMap: SpendingHeatMapCell[];
  insights: AnalyticsInsight[];
}

function record(value: unknown, label: string): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`The analytics service returned an invalid ${label}.`);
  }
  return value as Record<string, any>;
}

function number(value: unknown, label: string, minimum = -Infinity, maximum = Infinity): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) throw new Error(`The analytics service returned an invalid ${label}.`);
  return value;
}
function integer(value: unknown, label: string, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  const result = number(value, label, minimum, maximum);
  if (!Number.isSafeInteger(result)) throw new Error(`The analytics service returned an invalid ${label}.`);
  return result;
}
function text(value: unknown, label: string): string {
  if (value === null) return "";
  if (typeof value !== "string") throw new Error(`The analytics service returned an invalid ${label}.`);
  return value;
}
function date(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error("The analytics service returned an invalid date.");
  return value;
}
function list(value: unknown): Record<string, any>[] {
  if (value === null) return [];
  if (!Array.isArray(value)) throw new Error("The analytics service returned an invalid list.");
  return value.map(item => record(item, "list entry"));
}
export function decodeAnalytics(value: unknown): AnalyticsDashboard {
  const item = record(value, "analytics response");
  const health = record(item.financialHealth, "financial health");
  const totals = record(item.totals, "analytics totals");
  if (item.currency !== "NGN" || !["Weekly", "Monthly", "Yearly"].includes(item.periodType)) throw new Error("The analytics service returned an unsupported currency or period.");
  const periodStart = date(item.periodStart), periodEnd = date(item.periodEnd);
  if (periodStart > periodEnd) throw new Error("The analytics service returned an invalid period.");

  return {
    analyticsSummaryId: integer(item.analyticsSummaryId, "summary ID"),
    periodType: item.periodType,
    periodStart,
    periodEnd,
    currency: item.currency,
    financialHealth: {
      score: integer(health.score, "health score", 0, 100),
      status: text(health.status, "health status"),
      recommendation: text(health.recommendation, "recommendation"),
    },
    totals: {
      totalIncome: number(totals.totalIncome, "income", 0),
      totalExpenses: number(totals.totalExpenses, "expenses", 0),
      totalSavings: number(totals.totalSavings, "savings", 0),
      incomeChangePercent: number(totals.incomeChangePercent, "income change"),
      expenseChangePercent: number(totals.expenseChangePercent, "expense change"),
      savingsChangePercent: number(totals.savingsChangePercent, "savings change"),
    },
    trendPoints: list(item.trendPoints).map(p => ({ pointDate: date(p.pointDate), income: number(p.income, "trend income", 0), expenses: number(p.expenses, "trend expenses", 0), savings: number(p.savings, "trend savings", 0) })),
    categorySummaries: list(item.categorySummaries).map(c => ({
      categoryId: integer(c.categoryId, "category ID"), categoryName: text(c.categoryName, "category name") || "Other",
      icon: text(c.icon, "category icon") || undefined, colorHex: text(c.colorHex, "category color") || undefined,
      totalSpent: number(c.totalSpent, "category spending", 0), transactionCount: integer(c.transactionCount, "category count"),
      percentageOfExpenses: number(c.percentageOfExpenses, "category percentage", 0, 100), changePercent: number(c.changePercent, "category change"),
    })),
    heatMap: list(item.heatMap).map(h => ({ dayOfWeek: integer(h.dayOfWeek, "weekday", 0, 6), hourOfDay: integer(h.hourOfDay, "hour", 0, 23), totalSpent: number(h.totalSpent, "hour spending", 0), transactionCount: integer(h.transactionCount, "hour count"), intensity: integer(h.intensity, "intensity") })),
    insights: list(item.insights).map(ins => ({ title: text(ins.title, "insight title"), message: text(ins.message, "insight message"), insightType: text(ins.insightType, "insight type"), changePercent: ins.changePercent === null ? null : number(ins.changePercent, "insight change"), sortOrder: integer(ins.sortOrder, "insight order") })).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function fetchAnalytics(
  request: ApiRequest,
  periodType: 1 | 2 | 3 = 2,
  anchorDate?: string,
  currency = "NGN",
): Promise<AnalyticsDashboard> {
  await verifyPersonalAnalyticsSource(request);
  let url = `/api/analytics?periodType=${periodType}&currency=${encodeURIComponent(currency)}`;
  if (anchorDate) {
    url += `&anchorDate=${encodeURIComponent(anchorDate)}`;
  }
  const response = await request(url);
  if (response.status !== 200) {
    throw new Error(`Could not load analytics (${response.status}).`);
  }
  return verifyPeriod(decodeAnalytics(response.data), periodType, anchorDate);
}

export async function refreshBackendAnalytics(
  request: ApiRequest,
  periodType: 1 | 2 | 3 = 2,
  anchorDate?: string,
  currency = "NGN",
): Promise<AnalyticsDashboard> {
  await verifyPersonalAnalyticsSource(request);
  const query = `periodType=${periodType}&currency=${encodeURIComponent(currency)}` + (anchorDate ? `&anchorDate=${encodeURIComponent(anchorDate)}` : "");
  const response = await request(`/api/analytics/refresh?${query}`, { method: "POST" });
  if (response.status !== 200) {
    throw new Error(`Could not refresh analytics (${response.status}).`);
  }
  return verifyPeriod(decodeAnalytics(response.data), periodType, anchorDate);
}

function verifyPeriod(data: AnalyticsDashboard, periodType: 1 | 2 | 3, anchorDate?: string) {
  const anchor = anchorDate?.slice(0, 10);
  if (data.periodType !== ["Weekly", "Monthly", "Yearly"][periodType - 1] || anchor && (anchor < data.periodStart || anchor > data.periodEnd)) throw new Error("The service returned analytics for a different period. Please retry.");
  return data;
}

async function verifyPersonalAnalyticsSource(request: ApiRequest) {
  const response = await request("/api/transactions");
  if (response.status !== 200) throw new Error(`Could not verify analytics transaction sources (${response.status}).`);
  if (decodeTransactionFeed(response.data).some(isSandboxBankTransaction)) {
    throw new Error("Personal analytics is unavailable while the server summary may include sandbox bank activity. Your recorded personal expenses are available on Expenses.");
  }
}
