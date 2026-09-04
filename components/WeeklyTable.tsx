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
    <div className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white shadow-card dark:border-white/8 dark:bg-[#1e2128]">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="bg-[#0067eb]/[0.06] text-[#003d78] dark:bg-[#0067eb]/15 dark:text-[#7ab8ff]">
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Week</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Ad Spend</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Leads</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Appointments</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Shows</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Quotes Sent</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Closed</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Revenue Closed</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">CAC</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">ROAS</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Close Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((week) => (
            <tr
              key={week.weekStart}
              className="border-t border-black/[0.06] transition-colors duration-150 hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.04]"
            >
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white/90">
                {week.weekLabel}
              </td>
              <td className="px-4 py-3 tabular-nums">{formatCurrency(week.adSpend)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.leads)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.appointments)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.shows)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.quotesSent)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.closed)}</td>
              <td className="px-4 py-3 font-semibold tabular-nums text-[#8a6d00] dark:text-[#ffcf00]">
                {formatCurrency(week.revenueClosed)}
              </td>
              <td className="px-4 py-3 tabular-nums">{formatCurrency(week.cac)}</td>
              <td className="px-4 py-3 tabular-nums">{formatMultiplier(week.roas)}</td>
              <td className="px-4 py-3 tabular-nums">{formatPercent(week.closeRate)}</td>
            </tr>
          ))}
          {totals && (
            <tr className="border-t border-black/10 bg-black/[0.03] font-semibold text-slate-900 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/90">
              <td className="px-4 py-3">{totalLabel}</td>
              <td className="px-4 py-3 tabular-nums">{formatCurrency(totals.adSpend)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.leads)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.appointments)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.shows)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.quotesSent)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.closed)}</td>
              <td className="px-4 py-3 tabular-nums text-[#8a6d00] dark:text-[#ffcf00]">
                {formatCurrency(totals.revenueClosed)}
              </td>
              <td className="px-4 py-3 tabular-nums">{formatCurrency(totals.cac)}</td>
              <td className="px-4 py-3 tabular-nums">{formatMultiplier(totals.roas)}</td>
              <td className="px-4 py-3 tabular-nums">{formatPercent(totals.closeRate)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
