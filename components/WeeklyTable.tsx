import type { WeeklyDataPoint } from "@/types";
import type { StandardMonthTotals } from "@/lib/monthlyRollup";
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "@/lib/format";

export function WeeklyTable({
  data,
  totalLabel,
  totals,
}: {
  data: WeeklyDataPoint[];
  /** e.g. "Month Total" — only rendered when `totals` is also provided. */
  totalLabel?: string;
  /** Summed/recomputed totals row shown in bold beneath `data`'s weekly rows. */
  totals?: StandardMonthTotals;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1e2128]">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="bg-[#0067eb]/10 text-[#003d78] dark:bg-[#0067eb]/20 dark:text-[#7ab8ff]">
            <th className="px-4 py-3 font-semibold">Week</th>
            <th className="px-4 py-3 font-semibold">Ad Spend</th>
            <th className="px-4 py-3 font-semibold">Leads</th>
            <th className="px-4 py-3 font-semibold">Appointments</th>
            <th className="px-4 py-3 font-semibold">Shows</th>
            <th className="px-4 py-3 font-semibold">Quotes Sent</th>
            <th className="px-4 py-3 font-semibold">Closed</th>
            <th className="px-4 py-3 font-semibold">Revenue Closed</th>
            <th className="px-4 py-3 font-semibold">CAC</th>
            <th className="px-4 py-3 font-semibold">ROAS</th>
            <th className="px-4 py-3 font-semibold">Close Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((week) => (
            <tr
              key={week.weekStart}
              className="border-t border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
            >
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white/90">
                {week.weekLabel}
              </td>
              <td className="px-4 py-3">{formatCurrency(week.adSpend)}</td>
              <td className="px-4 py-3">{formatNumber(week.leads)}</td>
              <td className="px-4 py-3">{formatNumber(week.appointments)}</td>
              <td className="px-4 py-3">{formatNumber(week.shows)}</td>
              <td className="px-4 py-3">{formatNumber(week.quotesSent)}</td>
              <td className="px-4 py-3">{formatNumber(week.closed)}</td>
              <td className="px-4 py-3 font-semibold text-[#8a6d00] dark:text-[#ffcf00]">
                {formatCurrency(week.revenueClosed)}
              </td>
              <td className="px-4 py-3">{formatCurrency(week.cac)}</td>
              <td className="px-4 py-3">{formatMultiplier(week.roas)}</td>
              <td className="px-4 py-3">{formatPercent(week.closeRate)}</td>
            </tr>
          ))}
          {totals && (
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900 dark:border-white/20 dark:bg-white/5 dark:text-white/90">
              <td className="px-4 py-3">{totalLabel}</td>
              <td className="px-4 py-3">{formatCurrency(totals.adSpend)}</td>
              <td className="px-4 py-3">{formatNumber(totals.leads)}</td>
              <td className="px-4 py-3">{formatNumber(totals.appointments)}</td>
              <td className="px-4 py-3">{formatNumber(totals.shows)}</td>
              <td className="px-4 py-3">{formatNumber(totals.quotesSent)}</td>
              <td className="px-4 py-3">{formatNumber(totals.closed)}</td>
              <td className="px-4 py-3 text-[#8a6d00] dark:text-[#ffcf00]">
                {formatCurrency(totals.revenueClosed)}
              </td>
              <td className="px-4 py-3">{formatCurrency(totals.cac)}</td>
              <td className="px-4 py-3">{formatMultiplier(totals.roas)}</td>
              <td className="px-4 py-3">{formatPercent(totals.closeRate)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
