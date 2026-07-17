import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClientBySlug } from "@/config/clients";
import {
  getClientReport,
  getClientTrends,
  getPipelineFunnelReport,
  getPipelineFunnelTrends,
} from "@/lib/metrics";
import type { Period } from "@/types";
import { DashboardShell } from "@/components/DashboardShell";
import { ClientNav } from "@/components/ClientNav";
import { PeriodToggle } from "@/components/PeriodToggle";
import { MetricGroup } from "@/components/MetricGroup";
import { MetricCard } from "@/components/MetricCard";
import { HeadlineCard } from "@/components/HeadlineCard";
import { ChartCard } from "@/components/ChartCard";
import { WeeklyTable } from "@/components/WeeklyTable";
import { PipelineFunnelDashboard } from "@/components/PipelineFunnelDashboard";
import { AdSpendRevenueChart } from "@/components/charts/AdSpendRevenueChart";
import { CacRoasChart } from "@/components/charts/CacRoasChart";
import { CpcCtrChart } from "@/components/charts/CpcCtrChart";
import { LeadsCostChart } from "@/components/charts/LeadsCostChart";
import { LandingViewsOptInChart } from "@/components/charts/LandingViewsOptInChart";
import { AppointmentsCostChart } from "@/components/charts/AppointmentsCostChart";
import { CloseRateChart } from "@/components/charts/CloseRateChart";
import { QuotesClosedChart } from "@/components/charts/QuotesClosedChart";
import { ShowRateDonut } from "@/components/charts/ShowRateDonut";
import {
  formatCurrency,
  formatMultiplier,
  formatNumber,
  formatPercent,
} from "@/lib/format";

const TREND_WEEKS = 4;

export default async function ClientDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { clientSlug } = await params;
  const { period: periodParam } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Defense in depth: proxy.ts already restricts "client" role users to
  // their own slug, but a page should never trust routing alone.
  if (session.user.role === "client" && session.user.clientSlug !== clientSlug) {
    redirect(`/dashboard/${session.user.clientSlug}`);
  }

  const client = getClientBySlug(clientSlug);
  if (!client) {
    notFound();
  }

  const period: Period = periodParam === "30d" ? "30d" : "7d";
  const topNav =
    session.user.role === "master" ? <ClientNav currentSlug={clientSlug} /> : undefined;

  // Clients with no Meta Ads involvement get a GHL-only dashboard built
  // around their actual sales pipeline instead of the standard Meta+GHL report.
  if (client.showMetaAds === false) {
    const [funnelReport, funnelTrends] = await Promise.all([
      getPipelineFunnelReport(clientSlug, period),
      getPipelineFunnelTrends(clientSlug, TREND_WEEKS),
    ]);

    return (
      <DashboardShell title={client.name} topNav={topNav}>
        <div className="flex items-center justify-between">
          <PeriodToggle slug={clientSlug} period={period} />
          <p className="text-sm text-slate-500">
            Updated: {new Date(funnelReport.updatedAt).toLocaleString("en-US")}
          </p>
        </div>

        {funnelReport.warnings.length > 0 && (
          <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <ul className="list-inside list-disc">
              {funnelReport.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <PipelineFunnelDashboard report={funnelReport} trends={funnelTrends} />
      </DashboardShell>
    );
  }

  const [report, trends] = await Promise.all([
    getClientReport(clientSlug, period),
    getClientTrends(clientSlug, TREND_WEEKS),
  ]);

  return (
    <DashboardShell title={client.name} topNav={topNav}>
      <div className="flex items-center justify-between">
        <PeriodToggle slug={clientSlug} period={period} />
        <p className="text-sm text-slate-500">
          Updated: {new Date(report.updatedAt).toLocaleString("en-US")}
        </p>
      </div>

      {report.warnings.length > 0 && (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ul className="list-inside list-disc">
            {report.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Priority KPIs */}
      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <HeadlineCard
            label="Revenue Closed"
            value={formatCurrency(report.headline.revenueClosed)}
          />
          <HeadlineCard label="CAC" value={formatCurrency(report.headline.cac)} />
          <HeadlineCard
            label="ROAS"
            value={formatMultiplier(report.headline.roas)}
          />
          <HeadlineCard
            label="Ad Spend"
            value={formatCurrency(report.headline.adSpend)}
          />
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
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Ad Spend vs Revenue Closed"
            subtitle="Weekly ad spend (bars) against revenue from closed deals (line)"
            accent="blue"
          >
            <AdSpendRevenueChart data={trends} />
          </ChartCard>
          <ChartCard
            title="CAC & ROAS"
            subtitle="CAC = Ad Spend ÷ Closed · ROAS = Revenue Closed ÷ Ad Spend"
            accent="blue"
          >
            <CacRoasChart data={trends} />
          </ChartCard>
        </div>
      </section>

      {/* Meta Ads */}
      <section>
        <MetricGroup title="Meta Ads" accent="cyan">
          <MetricCard accent="cyan" label="CPC" value={formatCurrency(report.meta.cpc)} />
          <MetricCard accent="cyan" label="CTR" value={formatPercent(report.meta.ctr)} />
          <MetricCard accent="cyan" label="Leads" value={formatNumber(report.meta.leads)} />
          <MetricCard
            accent="cyan"
            label="Cost per lead"
            value={formatCurrency(report.meta.costPerLead)}
          />
        </MetricGroup>
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="CPC & CTR" subtitle="Weekly cost per click vs click-through rate" accent="cyan">
            <CpcCtrChart data={trends} />
          </ChartCard>
          <ChartCard
            title="Leads & Cost per Lead"
            subtitle="Weekly lead volume (bars) vs cost per lead (line)"
            accent="cyan"
          >
            <LeadsCostChart data={trends} />
          </ChartCard>
        </div>
      </section>

      {/* Funnel */}
      <section>
        <MetricGroup title="Funnel" accent="indigo">
          <MetricCard
            accent="indigo"
            label="Landing page views"
            value={formatNumber(report.funnel.landingPageViews)}
          />
          <MetricCard
            accent="indigo"
            label="Opt-in rate"
            value={formatPercent(report.funnel.optInRate)}
          />
          <MetricCard
            accent="indigo"
            label="Appointments"
            value={formatNumber(report.funnel.appointments)}
          />
          <MetricCard
            accent="indigo"
            label="Cost per appointment"
            value={formatCurrency(report.funnel.costPerAppointment)}
          />
        </MetricGroup>
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Landing Page Views & Opt-in Rate"
            subtitle="Weekly landing page views (bars) vs opt-in rate (line)"
            accent="indigo"
          >
            <LandingViewsOptInChart data={trends} />
          </ChartCard>
          <ChartCard
            title="Appointments & Cost per Appointment"
            subtitle="Weekly appointments booked (bars) vs cost per appointment (line)"
            accent="indigo"
          >
            <AppointmentsCostChart data={trends} />
          </ChartCard>
        </div>
      </section>

      {/* Sales */}
      <section>
        <MetricGroup title="Sales" accent="emerald">
          <MetricCard
            accent="emerald"
            label="Show rate"
            value={formatPercent(report.sales.showRate)}
          />
          <MetricCard
            accent="emerald"
            label="Cost per shown appt"
            value={formatCurrency(report.sales.costPerShownAppt)}
          />
          <MetricCard
            accent="emerald"
            label="Quotes sent"
            value={formatNumber(report.sales.quotesSent)}
          />
          <MetricCard accent="emerald" label="Closed" value={formatNumber(report.sales.closed)} />
          <MetricCard accent="emerald" label="CAC" value={formatCurrency(report.sales.cac)} />
        </MetricGroup>
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Close Rate vs Show Rate"
            subtitle="Close Rate = Closed ÷ Appointments Shown"
            accent="emerald"
          >
            <CloseRateChart data={trends} />
          </ChartCard>
          <ChartCard title="Quotes Sent vs Closed" subtitle="Weekly opportunity volume by stage" accent="emerald">
            <QuotesClosedChart data={trends} />
          </ChartCard>
          <ChartCard
            title="Appointments: Showed vs No-show"
            subtitle={`Total across the last ${TREND_WEEKS} weeks`}
            accent="emerald"
          >
            <ShowRateDonut data={trends} />
          </ChartCard>
        </div>
      </section>

      {/* Weekly detail table */}
      <section>
        <h2 className="mb-3 border-l-4 border-slate-400 pl-3 text-lg font-semibold text-slate-900">
          Weekly Detail — Last {TREND_WEEKS} Weeks
        </h2>
        <WeeklyTable data={trends} />
      </section>
    </DashboardShell>
  );
}
