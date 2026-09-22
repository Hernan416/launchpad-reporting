import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClientBySlug } from "@/config/clients";
import {
  getClientCallFunnelReport,
  getClientCallFunnelTrends,
  getClientReport,
  getClientTrends,
  getPipelineFunnelReport,
  getPipelineFunnelTrends,
} from "@/lib/metrics";
import { parseCustomRange } from "@/lib/period";
import type { Period } from "@/types";
import { DashboardShell } from "@/components/DashboardShell";
import { ClientNav } from "@/components/ClientNav";
import { PeriodToggle } from "@/components/PeriodToggle";
import { CustomRangeForm } from "@/components/CustomRangeForm";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { SnapshotSections } from "@/components/sections/SnapshotSections";
import { TrendsSections } from "@/components/sections/TrendsSections";
import { PipelineSnapshotSections } from "@/components/sections/PipelineSnapshotSections";
import { PipelineTrendsSections } from "@/components/sections/PipelineTrendsSections";
import { CallFunnelSnapshotSections } from "@/components/sections/CallFunnelSnapshotSections";
import { CallFunnelTrendsSections } from "@/components/sections/CallFunnelTrendsSections";
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
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { clientSlug } = await params;
  const { period: periodParam, from: fromParam, to: toParam } = await searchParams;

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
  // configured (see ClientConfig.clientSince), and "custom" only once it has
  // a valid from/to — otherwise fall back to 7d rather than let a stale/
  // guessed URL hit an error deeper in the fetch.
  const customRange = periodParam === "custom" ? parseCustomRange(fromParam, toParam) : undefined;
  const requestedPeriod: Period =
    periodParam === "custom"
      ? "custom"
      : periodParam === "month"
        ? "month"
        : periodParam === "lifetime"
          ? "lifetime"
          : "7d";
  const period: Period =
    requestedPeriod === "lifetime" && !client.clientSince
      ? "7d"
      : requestedPeriod === "custom" && !customRange
        ? "7d"
        : requestedPeriod;

  // clientSince/customRange are date-only strings, parsed as UTC midnight —
  // format them in UTC too, or a server running west of UTC (e.g.
  // America/Caracas) renders "2026-04-12" as "Apr 11".
  const formatDateLabel = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  const clientSinceLabel = client.clientSince ? formatDateLabel(client.clientSince) : undefined;
  const customRangeLabel = customRange
    ? `${formatDateLabel(customRange.from)} – ${formatDateLabel(customRange.to)}`
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
    period === "custom" && customRangeLabel
      ? customRangeLabel
      : period === "lifetime" && clientSinceLabel
        ? `Since ${clientSinceLabel}`
        : period === "month"
          ? monthLabel
          : `Last ${TREND_WEEKS} Weeks`;
  const rangePhrase =
    period === "custom" && customRangeLabel
      ? customRangeLabel
      : period === "lifetime" && clientSinceLabel
        ? `since ${clientSinceLabel}`
        : period === "month"
          ? monthLabel
          : `the last ${TREND_WEEKS} weeks`;
  // Preserved across the period toggle and the PDF export link — see
  // periodToRange/getMetaInsights, which need both when period is "custom".
  const rangeQuery = period === "custom" && customRange ? `&from=${customRange.from}&to=${customRange.to}` : "";

  const topNav =
    session.user.role === "master" ? <ClientNav currentSlug={clientSlug} /> : undefined;

  // Clients with a single call-center-style GHL pipeline and no Meta Ads at
  // all (e.g. Samaritan Contracting) get the same CallFunnelReport model
  // built for Launchpad AI, just fed by this real ClientConfig — checked
  // before showMetaAds below since callFunnel replaces that branch entirely.
  if (client.callFunnel) {
    const reportPromise = getClientCallFunnelReport(clientSlug, period, customRange);
    const trendsPromise = getClientCallFunnelTrends(clientSlug, period, TREND_WEEKS, customRange);

    return (
      <DashboardShell title={client.name} topNav={topNav}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodToggle
              slug={clientSlug}
              period={period}
              showLifetime={!!client.clientSince}
              customRange={customRange}
            />
            {period === "custom" && customRange && (
              <CustomRangeForm slug={clientSlug} from={customRange.from} to={customRange.to} />
            )}
          </div>
          <ExportPdfButton slug={clientSlug} period={period} extraQuery={rangeQuery} />
        </div>

        <Suspense
          fallback={
            <div className="space-y-8">
              <CardGridSkeleton count={4} accent="gold" />
              <CardGridSkeleton count={4} accent="blue" />
              <CardGridSkeleton count={6} accent="gold" />
            </div>
          }
        >
          <CallFunnelSnapshotSections reportPromise={reportPromise} entryLabel={client.callFunnel.entryLabel} />
        </Suspense>

        <Suspense
          fallback={
            <div className="space-y-8">
              <div className="h-64 w-full animate-pulse rounded-xl border border-black/[0.08] bg-white shadow-card dark:border-white/8 dark:bg-[#1e2128]" />
              <ChartGridSkeleton count={2} accent="blue" />
            </div>
          }
        >
          <CallFunnelTrendsSections
            trendsPromise={trendsPromise}
            rangeHeading={rangeHeading}
            period={period}
            entryLabel={client.callFunnel.entryLabel}
          />
        </Suspense>
      </DashboardShell>
    );
  }

  // Clients with no Meta Ads involvement get a GHL-only dashboard built
  // around their actual sales pipeline instead of the standard Meta+GHL report.
  if (client.showMetaAds === false) {
    const funnelReportPromise = getPipelineFunnelReport(clientSlug, period, customRange);
    const funnelTrendsPromise = getPipelineFunnelTrends(clientSlug, period, TREND_WEEKS, customRange);

    return (
      <DashboardShell title={client.name} topNav={topNav}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodToggle
              slug={clientSlug}
              period={period}
              showLifetime={!!client.clientSince}
              customRange={customRange}
            />
            {period === "custom" && customRange && (
              <CustomRangeForm slug={clientSlug} from={customRange.from} to={customRange.to} />
            )}
          </div>
          <ExportPdfButton slug={clientSlug} period={period} extraQuery={rangeQuery} />
        </div>

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
  const reportPromise = getClientReport(clientSlug, period, customRange);
  const trendsPromise = getClientTrends(clientSlug, period, TREND_WEEKS, customRange);

  return (
    <DashboardShell title={client.name} topNav={topNav}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <PeriodToggle
            slug={clientSlug}
            period={period}
            showLifetime={!!client.clientSince}
            customRange={customRange}
          />
          {period === "custom" && customRange && (
            <CustomRangeForm slug={clientSlug} from={customRange.from} to={customRange.to} />
          )}
        </div>
        <ExportPdfButton slug={clientSlug} period={period} extraQuery={rangeQuery} />
      </div>

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
            <div className="h-64 w-full animate-pulse rounded-xl border border-black/[0.08] bg-white shadow-card dark:border-white/8 dark:bg-[#1e2128]" />
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
          period={period}
        />
      </Suspense>
    </DashboardShell>
  );
}
