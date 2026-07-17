import type { WeeklyDataPoint } from "@/types";
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "@/lib/format";

export function WeeklyTable({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="bg-blue-50 text-blue-900">
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
              className="border-t border-slate-100 hover:bg-slate-50"
            >
              <td className="px-4 py-3 font-medium text-slate-900">
                {week.weekLabel}
              </td>
              <td className="px-4 py-3">{formatCurrency(week.adSpend)}</td>
              <td className="px-4 py-3">{formatNumber(week.leads)}</td>
              <td className="px-4 py-3">{formatNumber(week.appointments)}</td>
              <td className="px-4 py-3">{formatNumber(week.shows)}</td>
              <td className="px-4 py-3">{formatNumber(week.quotesSent)}</td>
              <td className="px-4 py-3">{formatNumber(week.closed)}</td>
              <td className="px-4 py-3 font-semibold text-blue-700">
                {formatCurrency(week.revenueClosed)}
              </td>
              <td className="px-4 py-3">{formatCurrency(week.cac)}</td>
              <td className="px-4 py-3">{formatMultiplier(week.roas)}</td>
              <td className="px-4 py-3">{formatPercent(week.closeRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
