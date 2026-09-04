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
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1e2128]">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="bg-[#0067eb]/10 text-[#003d78] dark:bg-[#0067eb]/20 dark:text-[#7ab8ff]">
            <th className="px-4 py-3 font-semibold">Week</th>
            {entryLabel && <th className="px-4 py-3 font-semibold">{entryLabel}</th>}
            <th className="px-4 py-3 font-semibold">Appointments Booked</th>
            <th className="px-4 py-3 font-semibold">Shows</th>
            <th className="px-4 py-3 font-semibold">No-Shows</th>
            <th className="px-4 py-3 font-semibold">Show Rate</th>
            <th className="px-4 py-3 font-semibold">Not Closed</th>
            <th className="px-4 py-3 font-semibold">Closed</th>
            <th className="px-4 py-3 font-semibold">Close Rate</th>
            <th className="px-4 py-3 font-semibold">Revenue Closed</th>
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
              {entryLabel && <td className="px-4 py-3">{formatNumber(week.callsMade)}</td>}
              <td className="px-4 py-3">{formatNumber(week.appointmentsBooked)}</td>
              <td className="px-4 py-3">{formatNumber(week.shows)}</td>
              <td className="px-4 py-3">{formatNumber(week.noShows)}</td>
              <td className="px-4 py-3">{formatPercent(week.showRate)}</td>
              <td className="px-4 py-3">{formatNumber(week.notClosed)}</td>
              <td className="px-4 py-3">{formatNumber(week.closed)}</td>
              <td className="px-4 py-3">{formatPercent(week.closeRate)}</td>
              <td className="px-4 py-3 font-semibold text-[#8a6d00] dark:text-[#ffcf00]">
                {formatCurrency(week.closedRevenue)}
              </td>
            </tr>
          ))}
          {totals && (
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900 dark:border-white/20 dark:bg-white/5 dark:text-white/90">
              <td className="px-4 py-3">{totalLabel}</td>
              {entryLabel && <td className="px-4 py-3">{formatNumber(totals.callsMade)}</td>}
              <td className="px-4 py-3">{formatNumber(totals.appointmentsBooked)}</td>
              <td className="px-4 py-3">{formatNumber(totals.shows)}</td>
              <td className="px-4 py-3">{formatNumber(totals.noShows)}</td>
              <td className="px-4 py-3">{formatPercent(totals.showRate)}</td>
              <td className="px-4 py-3">{formatNumber(totals.notClosed)}</td>
              <td className="px-4 py-3">{formatNumber(totals.closed)}</td>
              <td className="px-4 py-3">{formatPercent(totals.closeRate)}</td>
              <td className="px-4 py-3 text-[#8a6d00] dark:text-[#ffcf00]">
                {formatCurrency(totals.closedRevenue)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
