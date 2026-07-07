import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClientBySlug } from "@/config/clients";
import { getClientReport } from "@/lib/metrics";
import type { Period } from "@/types";
import { DashboardShell } from "@/components/DashboardShell";
import { PeriodToggle } from "@/components/PeriodToggle";
import { MetricGroup } from "@/components/MetricGroup";
import { MetricCard } from "@/components/MetricCard";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

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
  const report = await getClientReport(clientSlug, period);

  return (
    <DashboardShell title={client.name}>
      <div className="flex items-center justify-between">
        <PeriodToggle slug={clientSlug} period={period} />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Actualizado: {new Date(report.updatedAt).toLocaleString()}
        </p>
      </div>

      <MetricGroup title="Meta Ads">
        <MetricCard label="CPC" value={formatCurrency(report.meta.cpc)} />
        <MetricCard label="CTR" value={formatPercent(report.meta.ctr)} />
        <MetricCard label="Leads" value={formatNumber(report.meta.leads)} />
        <MetricCard
          label="Cost per lead"
          value={formatCurrency(report.meta.costPerLead)}
        />
      </MetricGroup>

      <MetricGroup title="Funnel">
        <MetricCard
          label="Landing page views"
          value={formatNumber(report.funnel.landingPageViews)}
        />
        <MetricCard
          label="Opt-in rate"
          value={formatPercent(report.funnel.optInRate)}
        />
        <MetricCard
          label="Appointments"
          value={formatNumber(report.funnel.appointments)}
        />
        <MetricCard
          label="Cost per appointment"
          value={formatCurrency(report.funnel.costPerAppointment)}
        />
      </MetricGroup>

      <MetricGroup title="Sales">
        <MetricCard
          label="Show rate"
          value={formatPercent(report.sales.showRate)}
        />
        <MetricCard
          label="Cost per shown appt"
          value={formatCurrency(report.sales.costPerShownAppt)}
        />
        <MetricCard
          label="Quotes sent"
          value={formatNumber(report.sales.quotesSent)}
        />
        <MetricCard label="Closed" value={formatNumber(report.sales.closed)} />
        <MetricCard label="CAC" value={formatCurrency(report.sales.cac)} />
      </MetricGroup>
    </DashboardShell>
  );
}
