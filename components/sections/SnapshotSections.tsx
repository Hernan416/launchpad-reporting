import type { ClientReport } from "@/types";
import { HeadlineCard } from "@/components/HeadlineCard";
import { MetricGroup } from "@/components/MetricGroup";
import { MetricCard } from "@/components/MetricCard";
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "@/lib/format";

/**
 * Cards-only slice of the standard dashboard — the fast, snapshot half of
 * the report. Awaits a promise kicked off (not awaited) by the page, so it
 * streams in independently of TrendsSections via its own Suspense boundary.
 */
export async function SnapshotSections({
  reportPromise,
}: {
  reportPromise: Promise<ClientReport>;
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <HeadlineCard
          label="Revenue Closed"
          value={formatCurrency(report.headline.revenueClosed)}
        />
        <HeadlineCard label="CAC" value={formatCurrency(report.headline.cac)} />
        <HeadlineCard label="ROAS" value={formatMultiplier(report.headline.roas)} />
        <HeadlineCard label="Ad Spend" value={formatCurrency(report.headline.adSpend)} />
        <HeadlineCard
          label="Cost per Appointment"
          value={formatCurrency(report.headline.costPerAppointment)}
        />
        <HeadlineCard
          label="Revenue Opportunity"
          value={formatCurrency(report.headline.revenueOpportunity)}
        />
        <HeadlineCard
          label="Close Rate"
          value={formatPercent(report.headline.closeRate)}
          sublabel={`${formatNumber(report.headline.closedCount)}/${formatNumber(report.headline.shownCount)} appointments shown`}
        />
      </div>

      <MetricGroup title="Meta Ads" accent="blue">
        <MetricCard accent="blue" label="CPC" value={formatCurrency(report.meta.cpc)} />
        <MetricCard accent="blue" label="CTR" value={formatPercent(report.meta.ctr)} />
        <MetricCard accent="blue" label="Leads" value={formatNumber(report.meta.leads)} />
        <MetricCard
          accent="blue"
          label="Cost per lead"
          value={formatCurrency(report.meta.costPerLead)}
        />
      </MetricGroup>

      <MetricGroup title="Funnel" accent="gold">
        <MetricCard
          accent="gold"
          label="Landing page views"
          value={formatNumber(report.funnel.landingPageViews)}
        />
        <MetricCard
          accent="gold"
          label="Opt-in rate"
          value={formatPercent(report.funnel.optInRate)}
        />
        <MetricCard
          accent="gold"
          label="Appointments"
          value={formatNumber(report.funnel.appointments)}
        />
        <MetricCard
          accent="gold"
          label="Cost per appointment"
          value={formatCurrency(report.funnel.costPerAppointment)}
        />
      </MetricGroup>

      <MetricGroup title="Sales" accent="blue">
        <MetricCard
          accent="blue"
          label="Show rate"
          value={formatPercent(report.sales.showRate)}
        />
        <MetricCard
          accent="blue"
          label="Cost per shown appt"
          value={formatCurrency(report.sales.costPerShownAppt)}
        />
        <MetricCard
          accent="blue"
          label="Quotes sent"
          value={formatNumber(report.sales.quotesSent)}
        />
        <MetricCard accent="blue" label="Closed" value={formatNumber(report.sales.closed)} />
        <MetricCard accent="blue" label="CAC" value={formatCurrency(report.sales.cac)} />
      </MetricGroup>
    </div>
  );
}
