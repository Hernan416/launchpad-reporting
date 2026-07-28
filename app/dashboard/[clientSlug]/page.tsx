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

  const period: Period = periodParam === "30d" ? "30d" : "7d";
  const topNav =
    session.user.role === "master" ? <ClientNav currentSlug={clientSlug} /> : undefined;

  // Clients with no Meta Ads involvement get a GHL-only dashboard built
  // around their actual sales pipeline instead of the standard Meta+GHL report.
  if (client.showMetaAds === false) {
    const funnelReportPromise = getPipelineFunnelReport(clientSlug, period);
    const funnelTrendsPromise = getPipelineFunnelTrends(clientSlug, TREND_WEEKS);

    return (
      <DashboardShell title={client.name} topNav={topNav}>
        <PeriodToggle slug={clientSlug} period={period} />

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
          <PipelineTrendsSections trendsPromise={funnelTrendsPromise} weeks={TREND_WEEKS} />
        </Suspense>
      </DashboardShell>
    );
  }

  // Kicked off here, not awaited — each Suspense boundary below awaits its
  // own promise independently, so the fast snapshot cards can stream in
  // before the slower weekly trend charts finish (see Next's docs on
  // streaming: start the fetch during render, pass the promise down).
  const reportPromise = getClientReport(clientSlug, period);
  const trendsPromise = getClientTrends(clientSlug, TREND_WEEKS);

  return (
    <DashboardShell title={client.name} topNav={topNav}>
      <PeriodToggle slug={clientSlug} period={period} />

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
        <TrendsSections trendsPromise={trendsPromise} weeks={TREND_WEEKS} />
      </Suspense>
    </DashboardShell>
  );
}
