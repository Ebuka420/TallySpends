import type { AnalyticsDashboard, PeriodType } from './api';
import type { AnalyticsReport } from './report';

/** Both the dashboard and exported report use the same server snapshot. */
export function dashboardReport(data: AnalyticsDashboard, timeframe: PeriodType): AnalyticsReport {
  const start = new Date(data.periodStart + 'T12:00:00');
  const end = new Date(data.periodEnd + 'T12:00:00');
  const money = (amount: number) => {
    const kobo = Math.round(amount * 100);
    if (!Number.isSafeInteger(kobo)) throw new Error('Analytics amounts are outside the supported range.');
    return kobo;
  };
  const spent = money(data.totals.totalExpenses), income = money(data.totals.totalIncome);
  const categories = [...data.categorySummaries].sort((a, b) => b.totalSpent - a.totalSpent);
  const expenseCount = categories.reduce((sum, c) => sum + c.transactionCount, 0);
  const breakdown = categories.slice(0, 3).map(c => ({ name: c.categoryName, amount: money(c.totalSpent), share: c.percentageOfExpenses / 100 }));
  const remaining = categories.slice(3).reduce((sum, c) => sum + money(c.totalSpent), 0);
  if (remaining) breakdown.push({ name: 'Everything else', amount: remaining, share: spent ? remaining / spent : 0 });
  return {
    range: {
      start, end, timeframe,
      label: `${start.toLocaleDateString('en-NG')} – ${end.toLocaleDateString('en-NG')}`,
      heading: timeframe === 'yearly' ? String(start.getFullYear()) : start.toLocaleDateString('en-NG', { month: 'long' }),
      edition: timeframe === 'yearly' ? 'YEAR IN REVIEW' : timeframe === 'monthly' ? 'MONTHLY EDITION' : 'WEEKLY EDITION',
    },
    selected: [], spent, income, net: income - spent, count: expenseCount, expenseCount, countKind: 'expense',
    breakdown,
    chart: [...data.trendPoints].sort((a, b) => a.pointDate.localeCompare(b.pointDate)).map(p => ({
      label: new Date(p.pointDate + 'T12:00:00').toLocaleDateString('en-NG', timeframe === 'yearly' ? { month: 'short' } : { day: 'numeric', month: 'short' }),
      amount: money(p.expenses),
    })),
    takeaway: data.insights[0]?.message || data.financialHealth.recommendation || 'No spending insight is available for this period.',
  };
}

export function dashboardRhythm(data: AnalyticsDashboard) {
  const counts = Array.from({ length: 24 }, () => 0);
  data.heatMap.forEach(cell => { counts[cell.hourOfDay] += cell.transactionCount; });
  const peak = Math.max(...counts);
  return {
    caption: data.heatMap.length ? 'Expense transactions by hour, as reported by your account.' : 'No spending rhythm is available for this period.',
    note: data.heatMap.length ? 'Hours follow the reporting timezone used by the service.' : null,
    cells: data.heatMap.length ? counts.map((count, hour) => ({ label: `${String(hour).padStart(2, '0')}:00`, count, intensity: peak && count ? Math.ceil(count / peak * 4) : 0 })) : [],
  };
}
