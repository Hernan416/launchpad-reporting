import type { Period, WeeklyCallFunnelDataPoint } from "@/types";
import { getLaunchpadPipeline } from "@/config/launchpad";
import { groupWeeksByMonth, summarizeCallFunnelMonth } from "@/lib/monthlyRollup";
import { ChartCard } from "@/components/ChartCard";
import { CallFunnelWeeklyTable } from "@/components/CallFunnelWeeklyTable";
import { CallFunnelVolumeChart } from "@/components/charts/CallFunnelVolumeChart";
import { CallFunnelRateChart } from "@/components/charts/CallFunnelRateChart";

/**
 * Chart-and-table slice of the Launchpad AI dashboard — mirrors
 * TrendsSections' structure (table first, then charts), including its
 * lifetime month-grouping fix, but for the simpler call-funnel shape.
 */
export async function CallFunnelTrendsSections({
  trendsPromise,
  rangeHeading,
  period,
  pipelineKey,
}: {
  trendsPromise: Promise<WeeklyCallFunnelDataPoint[]>;
  rangeHeading: string;
  period: Period;
  pipelineKey: string;
}) {
  const trends = await trendsPromise;
  const view = pipelineKey === "combined" ? undefined : getLaunchpadPipeline(pipelineKey);
  const monthGroups = period === "lifetime" || period === "custom" ? groupWeeksByMonth(trends) : null;
  const showMonthGroups = !!monthGroups && monthGroups.length > 1;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 border-l-4 border-slate-400 pl-3 text-lg font-semibold text-slate-900 dark:border-white/20 dark:text-white/90">
          Weekly Detail — {rangeHeading}
        </h2>
        {showMonthGroups ? (
          <div className="space-y-6">
            {monthGroups!.map((group) => (
              <div key={group.monthLabel}>
                <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-white/60">
                  {group.monthLabel}
                </h3>
                <CallFunnelWeeklyTable
                  data={group.weeks}
                  entryLabel={view?.entryLabel}
                  totalLabel="Month Total"
                  totals={summarizeCallFunnelMonth(group.weeks)}
                />
              </div>
            ))}
          </div>
        ) : (
          <CallFunnelWeeklyTable data={trends} entryLabel={view?.entryLabel} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Booked, Shows & Closed"
          subtitle="Weekly volume, per week"
          accent="blue"
        >
          <CallFunnelVolumeChart data={trends} />
        </ChartCard>
        <ChartCard title="Show Rate vs Close Rate" subtitle="Weekly, per week" accent="blue">
          <CallFunnelRateChart data={trends} />
        </ChartCard>
      </div>
    </div>
  );
}
