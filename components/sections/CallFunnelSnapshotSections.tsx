import type { CallFunnelReport } from "@/types";
import { getLaunchpadPipeline } from "@/config/launchpad";
import { MetricGroup } from "@/components/MetricGroup";
import { MetricCard } from "@/components/MetricCard";
import { HeadlineCard } from "@/components/HeadlineCard";
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "@/lib/format";

/**
 * Cards-only slice of the Launchpad AI dashboard. The Combined view
 * (pipelineKey === "combined") deliberately has no `meta` on the report and
 * skips the Calls Made/Leads card entirely — see getLaunchpadReport.
 */
export async function CallFunnelSnapshotSections({
  reportPromise,
  pipelineKey,
}: {
  reportPromise: Promise<CallFunnelReport>;
  pipelineKey: string;
}) {
  const report = await reportPromise;
  const view = pipelineKey === "combined" ? undefined : getLaunchpadPipeline(pipelineKey);

  return (
    <div className="space-y-8">
      <p className="text-right text-sm text-slate-500 dark:text-white/55">
        Updated: {new Date(report.updatedAt).toLocaleString("en-US")}
      </p>

      {report.warnings.length > 0 && (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          <ul className="list-inside list-disc">
            {report.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <HeadlineCard
          label="Revenue Closed"
          value={formatCurrency(report.metrics.closedRevenue)}
        />
        {report.meta && (
          <>
            <HeadlineCard label="CAC" value={formatCurrency(report.meta.cac)} />
            <HeadlineCard label="ROAS" value={formatMultiplier(report.meta.roas)} />
            <HeadlineCard label="Ad Spend" value={formatCurrency(report.meta.spend)} />
          </>
        )}
        <HeadlineCard
          label="Show Rate"
          value={formatPercent(report.metrics.showRate)}
          sublabel={`${formatNumber(report.metrics.shows)}/${formatNumber(
            report.metrics.shows + report.metrics.noShows
          )} appointments shown`}
        />
        <HeadlineCard
          label="Close Rate"
          value={formatPercent(report.metrics.closeRate)}
          sublabel={`${formatNumber(report.metrics.closed)}/${formatNumber(report.metrics.shows)} shows closed`}
        />
      </div>

      {report.meta && view && (
        <MetricGroup
          title="Meta Ads"
          accent="blue"
          caption={`${view.entryLabel} = new opportunities created in this period only.`}
        >
          <MetricCard accent="blue" label="CPC" value={formatCurrency(report.meta.cpc)} />
          <MetricCard accent="blue" label="CTR" value={formatPercent(report.meta.ctr)} />
          <MetricCard accent="blue" label={view.entryLabel} value={formatNumber(report.meta.leads)} />
          <MetricCard
            accent="blue"
            label={view.entryLabel === "Leads" ? "Cost per lead" : `Cost per ${view.entryLabel.toLowerCase()}`}
            value={formatCurrency(report.meta.costPerLead)}
          />
        </MetricGroup>
      )}

      <MetricGroup
        title="Funnel"
        accent="gold"
        caption="Appointments Booked includes ones still pending (Confirmed/Needs Reschedule) or Cancelled before the appointment happened — Show Rate above only counts appointments that already resolved to a Show or No-Show, which is why its denominator is smaller."
      >
        {view && (
          <MetricCard accent="gold" label={view.entryLabel} value={formatNumber(report.metrics.callsMade)} />
        )}
        <MetricCard
          accent="gold"
          label="Appointments Booked"
          value={formatNumber(report.metrics.appointmentsBooked)}
        />
        <MetricCard accent="gold" label="Shows" value={formatNumber(report.metrics.shows)} />
        <MetricCard accent="gold" label="No-Shows" value={formatNumber(report.metrics.noShows)} />
        <MetricCard accent="gold" label="Not Closed" value={formatNumber(report.metrics.notClosed)} />
        <MetricCard accent="gold" label="Closed" value={formatNumber(report.metrics.closed)} />
      </MetricGroup>
    </div>
  );
}
