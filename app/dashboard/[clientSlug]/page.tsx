import { Suspense } from "react";
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
import { SnapshotSections } from "@/components/sections/SnapshotSections";
import { TrendsSections } from "@/components/sections/TrendsSections";
import { PipelineSnapshotSections } from "@/components/sections/PipelineSnapshotSections";
import { PipelineTrendsSections } from "@/components/sections/PipelineTrendsSections";
import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";
import { ChartGridSkeleton } from "@/components/skeletons/ChartGridSkeleton";

const TREND_WEEKS = 4;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;
  const client = getClientBySlug(clientSlug);
  return { title: client?.name ?? "Client" };
}

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

  // "lifetime" is only a valid choice for clients with a clientSince date
  // configured (see ClientConfig.clientSince) — otherwise fall back to 7d
  // rather than let a stale/guessed URL hit the "missing clientSince" error.
  const requestedPeriod: Period =
    periodParam === "month" ? "month" : periodParam === "lifetime" ? "lifetime" : "7d";
  const period: Period = requestedPeriod === "lifetime" && !client.clientSince ? "7d" : requestedPeriod;

  // clientSince is a date-only string, parsed as UTC midnight — format it in
  // UTC too, or a server running west of UTC (e.g. America/Caracas) renders
  // "2026-04-12" as "Apr 11".
  const clientSinceLabel = client.clientSince
    ? new Date(`${client.clientSince}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : undefined;
  // "month" is the current calendar month (see lib/period.ts) — labeled by
  // its actual name/year (e.g. "August 2026"), formatted in UTC to match
  // the month boundary the data itself uses.
  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const rangeHeading =
    period === "lifetime" && clientSinceLabel
      ? `Since ${clientSinceLabel}`
      : period === "month"
        ? monthLabel
        : `Last ${TREND_WEEKS} Weeks`;
  const rangePhrase =
    period === "lifetime" && clientSinceLabel
      ? `since ${clientSinceLabel}`
      : period === "month"
        ? monthLabel
        : `the last ${TREND_WEEKS} weeks`;

  const topNav =
    session.user.role === "master" ? <ClientNav currentSlug={clientSlug} /> : undefined;

  // Clients with no Meta Ads involvement get a GHL-only dashboard built
  // around their actual sales pipeline instead of the standard Meta+GHL report.
  if (client.showMetaAds === false) {
    const funnelReportPromise = getPipelineFunnelReport(clientSlug, period);
    const funnelTrendsPromise = getPipelineFunnelTrends(clientSlug, period, TREND_WEEKS);

    return (
      <DashboardShell title={client.name} topNav={topNav}>
        <PeriodToggle slug={clientSlug} period={period} showLifetime={!!client.clientSince} />

        <Suspense
          fallback={
            <div className="space-y-8">
              <CardGridSkeleton count={4} accent="blue" />
              <CardGridSkeleton count={8} accent="gold" />
              <CardGridSkeleton count={3} accent="blue" />
            </div>
          }
        >
          <PipelineSnapshotSections reportPromise={funnelReportPromise} />
        </Suspense>

        <Suspense
          fallback={
            <div className="space-y-8">
              <ChartGridSkeleton count={2} accent="blue" />
              <ChartGridSkeleton count={2} accent="gold" />
              <ChartGridSkeleton count={2} accent="blue" />
            </div>
          }
        >
          <PipelineTrendsSections
            trendsPromise={funnelTrendsPromise}
            rangeHeading={rangeHeading}
            rangePhrase={rangePhrase}
          />
        </Suspense>
      </DashboardShell>
    );
  }

  // Kicked off here, not awaited — each Suspense boundary below awaits its
  // own promise independently, so the fast snapshot cards can stream in
  // before the slower weekly trend charts finish (see Next's docs on
  // streaming: start the fetch during render, pass the promise down).
  const reportPromise = getClientReport(clientSlug, period);
  const trendsPromise = getClientTrends(clientSlug, period, TREND_WEEKS);

  return (
    <DashboardShell title={client.name} topNav={topNav}>
      <PeriodToggle slug={clientSlug} period={period} showLifetime={!!client.clientSince} />

      <Suspense
        fallback={
          <div className="space-y-8">
            <CardGridSkeleton count={7} accent="gold" />
            <CardGridSkeleton count={4} accent="blue" />
            <CardGridSkeleton count={4} accent="gold" />
            <CardGridSkeleton count={5} accent="blue" />
          </div>
        }
      >
        <SnapshotSections reportPromise={reportPromise} />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-8">
            <div className="h-64 w-full animate-pulse rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1e2128]" />
            <ChartGridSkeleton count={3} accent="blue" />
            <ChartGridSkeleton count={4} accent="blue" />
            <ChartGridSkeleton count={4} accent="gold" />
            <ChartGridSkeleton count={3} accent="blue" />
          </div>
        }
      >
        <TrendsSections
          trendsPromise={trendsPromise}
          rangeHeading={rangeHeading}
          rangePhrase={rangePhrase}
        />
      </Suspense>
    </DashboardShell>
  );
}
