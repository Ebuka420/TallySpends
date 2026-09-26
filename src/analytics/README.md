# Shareable analytics report

`AnalyticsReportSheet` previews and captures the same report card at 1200 pixels
wide. Signature and Paper change its presentation; the totals, chart, category
breakdown and takeaway use the same selected transactions. Share controls remain
outside the captured view. Image sharing uses the native share sheet; an explicit
text option uses the same report model. No share is sent automatically.

The report shows money out, money in and net flow (income minus spending). It
does not call net flow savings or reuse the old fixed financial-health score.
Category amounts include smaller categories in Everything else. Empty periods
stay empty, and the takeaway is derived from recorded activity.

Monthly selection is scoped to the current year. Week options cover seven-day
blocks of the current month, including its final partial week; yearly selection
uses the selected calendar year. The screen chart and export share these ranges.
Amounts are aggregated in integer kobo before formatting.

`SpendingQuestions` keeps the Insights Summary palette and compact card style.
It offers three short prompts and one input, with the answer breakdown hidden
until requested. Answers still use the existing local spending-summary function,
and clear when the selected data or available balance changes.

Run `node --test src/analytics/report.test.cjs src/insights/summary.test.cjs` for
date boundaries, leap years, month-end weeks, decimal totals, category/chart
reconciliation, empty states, report text and supported spending answers.

No development browser was connected during this refresh. On-device checks are
still needed for both report looks, large amounts, image/text sharing and
cancellation, scrolling through the full preview, and the spending input with
the keyboard open in light and dark mode.

Verified on 2026-09-23: all 11 focused report/Insights tests, the whole-project
TypeScript check, and iOS/Android bundle exports pass.
