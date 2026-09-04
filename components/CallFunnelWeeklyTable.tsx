import type { WeeklyCallFunnelDataPoint } from "@/types";
import type { CallFunnelMonthTotals } from "@/lib/monthlyRollup";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export function CallFunnelWeeklyTable({
  data,
  entryLabel,
  totalLabel,
  totals,
}: {
  data: WeeklyCallFunnelDataPoint[];
  /** Column header for the "created this week" count — omitted entirely (column and all) in the Combined view, since that count isn't blended across pipelines. See CallFunnelReport.meta. */
  entryLabel?: string;
  totalLabel?: string;
  totals?: CallFunnelMonthTotals;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white shadow-card dark:border-white/8 dark:bg-[#1e2128]">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="bg-[#0067eb]/[0.06] text-[#003d78] dark:bg-[#0067eb]/15 dark:text-[#7ab8ff]">
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Week</th>
            {entryLabel && <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">{entryLabel}</th>}
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Appointments Booked</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Shows</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">No-Shows</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Show Rate</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Not Closed</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Closed</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Close Rate</th>
            <th className="px-4 py-3 text-[11px] font-semibold tracking-wider uppercase">Revenue Closed</th>
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
              {entryLabel && <td className="px-4 py-3 tabular-nums">{formatNumber(week.callsMade)}</td>}
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.appointmentsBooked)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.shows)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.noShows)}</td>
              <td className="px-4 py-3 tabular-nums">{formatPercent(week.showRate)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.notClosed)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(week.closed)}</td>
              <td className="px-4 py-3 tabular-nums">{formatPercent(week.closeRate)}</td>
              <td className="px-4 py-3 font-semibold tabular-nums text-[#8a6d00] dark:text-[#ffcf00]">
                {formatCurrency(week.closedRevenue)}
              </td>
            </tr>
          ))}
          {totals && (
            <tr className="border-t border-black/10 bg-black/[0.03] font-semibold text-slate-900 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/90">
              <td className="px-4 py-3">{totalLabel}</td>
              {entryLabel && <td className="px-4 py-3 tabular-nums">{formatNumber(totals.callsMade)}</td>}
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.appointmentsBooked)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.shows)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.noShows)}</td>
              <td className="px-4 py-3 tabular-nums">{formatPercent(totals.showRate)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.notClosed)}</td>
              <td className="px-4 py-3 tabular-nums">{formatNumber(totals.closed)}</td>
              <td className="px-4 py-3 tabular-nums">{formatPercent(totals.closeRate)}</td>
              <td className="px-4 py-3 tabular-nums text-[#8a6d00] dark:text-[#ffcf00]">
                {formatCurrency(totals.closedRevenue)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
