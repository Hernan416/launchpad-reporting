import type { PipelineFunnelReport } from "@/types";
import { MetricGroup } from "@/components/MetricGroup";
import { MetricCard } from "@/components/MetricCard";
import { formatNumber, formatPercent } from "@/lib/format";

/**
 * Cards-only slice of the Excel Roofing custom funnel dashboard. Awaits a
 * promise kicked off (not awaited) by the page, so it streams in
 * independently of PipelineTrendsSections via its own Suspense boundary.
 */
export async function PipelineSnapshotSections({
  reportPromise,
}: {
  reportPromise: Promise<PipelineFunnelReport>;
}) {
  const report = await reportPromise;

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

      <MetricGroup title="Leads" accent="blue">
        <MetricCard accent="blue" label="Total Leads" value={formatNumber(report.totalLeads)} />
        {report.leadsBySource.map((source) => (
          <MetricCard
            key={source.label}
            accent="blue"
            label={source.label}
            value={formatNumber(source.count)}
          />
        ))}
      </MetricGroup>

      <MetricGroup title="Quotes" accent="gold">
        <MetricCard accent="gold" label="Quotes Sent" value={formatNumber(report.quotesSent)} />
        <MetricCard
          accent="gold"
          label="Roofr (Direct Quotes)"
          value={formatNumber(report.directQuoteLeads)}
        />
        <MetricCard accent="gold" label="Quote - Yes" value={formatNumber(report.quoteYes)} />
        <MetricCard accent="gold" label="Quote - No" value={formatNumber(report.quoteNo)} />
        <MetricCard accent="gold" label="Reviewing" value={formatNumber(report.reviewing)} />
        <MetricCard accent="gold" label="Yes %" value={formatPercent(report.yesRate)} />
        <MetricCard accent="gold" label="No %" value={formatPercent(report.noRate)} />
        <MetricCard
          accent="gold"
          label="Decision %"
          value={formatPercent(report.decisionRate)}
        />
      </MetricGroup>

      <MetricGroup title="Appointments" accent="blue">
        <MetricCard accent="blue" label="Booked" value={formatNumber(report.appointmentsBooked)} />
        <MetricCard
          accent="blue"
          label="Cancelled"
          value={formatNumber(report.appointmentsCancelled)}
        />
        <MetricCard accent="blue" label="Lost" value={formatNumber(report.appointmentsLost)} />
      </MetricGroup>
    </div>
  );
}
