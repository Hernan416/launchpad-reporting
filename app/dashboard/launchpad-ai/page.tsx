import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLaunchpadPipeline, launchpadCombinedSince } from "@/config/launchpad";
import { getLaunchpadReport, getLaunchpadTrends } from "@/lib/metrics";
import { parseCustomRange } from "@/lib/period";
import type { Period } from "@/types";
import { DashboardShell } from "@/components/DashboardShell";
import { ClientNav } from "@/components/ClientNav";
import { PeriodToggle } from "@/components/PeriodToggle";
import { CustomRangeForm } from "@/components/CustomRangeForm";
import { LaunchpadPipelineToggle } from "@/components/LaunchpadPipelineToggle";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { CallFunnelSnapshotSections } from "@/components/sections/CallFunnelSnapshotSections";
import { CallFunnelTrendsSections } from "@/components/sections/CallFunnelTrendsSections";
import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";
import { ChartGridSkeleton } from "@/components/skeletons/ChartGridSkeleton";

const TREND_WEEKS = 4;

export const metadata = { title: "Launchpad AI" };

/**
 * Launchpad AI's own internal, admin-only dashboard — see config/launchpad.ts
 * for the two real GHL pipelines this tracks and the Combined view's rules.
 * A static route (not [clientSlug]) since Launchpad isn't a ClientConfig —
 * Next.js resolves this exact segment ahead of the dynamic one.
 */
export default async function LaunchpadDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; pipeline?: string; from?: string; to?: string }>;
}) {
  const { period: periodParam, pipeline: pipelineParam, from: fromParam, to: toParam } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Admin-only: proxy.ts already makes this slug unreachable to any "client"
  // role user (no login has clientSlug "launchpad-ai"), this is defense in
  // depth, matching every other dashboard page's own role check.
  if (session.user.role !== "master") {
    redirect("/dashboard");
  }

  const pipelineKey =
    pipelineParam === "roofing-ads-2026" || pipelineParam === "cold-call-sales"
      ? pipelineParam
      : "combined";

  const customRange = periodParam === "custom" ? parseCustomRange(fromParam, toParam) : undefined;
  const requestedPeriod: Period =
    periodParam === "custom"
      ? "custom"
      : periodParam === "month"
        ? "month"
        : periodParam === "lifetime"
          ? "lifetime"
          : "7d";
  const period: Period = requestedPeriod === "custom" && !customRange ? "7d" : requestedPeriod;

  const sinceDate =
    pipelineKey === "combined" ? launchpadCombinedSince : getLaunchpadPipeline(pipelineKey)!.client.clientSince!;
  // Anchor date is UTC midnight — format in UTC too, or a server running west
  // of UTC (e.g. America/Caracas) renders it a day early. Same convention as
  // app/dashboard/[clientSlug]/page.tsx.
  const formatDateLabel = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  const sinceLabel = formatDateLabel(sinceDate);
  const customRangeLabel = customRange
    ? `${formatDateLabel(customRange.from)} – ${formatDateLabel(customRange.to)}`
    : undefined;
  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const rangeHeading =
    period === "custom" && customRangeLabel
      ? customRangeLabel
      : period === "lifetime"
        ? `Since ${sinceLabel}`
        : period === "month"
          ? monthLabel
          : `Last ${TREND_WEEKS} Weeks`;
  const rangeQuery = period === "custom" && customRange ? `&from=${customRange.from}&to=${customRange.to}` : "";

  // Kicked off here, not awaited — each Suspense boundary below awaits its
  // own promise independently, same streaming pattern as the standard
  // dashboard page.
  const reportPromise = getLaunchpadReport(pipelineKey, period, customRange);
  const trendsPromise = getLaunchpadTrends(pipelineKey, period, TREND_WEEKS, customRange);

  return (
    <DashboardShell title="Launchpad AI" topNav={<ClientNav currentSlug="launchpad-ai" />}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LaunchpadPipelineToggle pipeline={pipelineKey} period={period} rangeQuery={rangeQuery} />
        <div className="flex flex-wrap items-center gap-3">
          <PeriodToggle
            slug="launchpad-ai"
            period={period}
            showLifetime
            extraQuery={`&pipeline=${pipelineKey}`}
            customRange={customRange}
          />
          {period === "custom" && customRange && (
            <CustomRangeForm
              slug="launchpad-ai"
              from={customRange.from}
              to={customRange.to}
              extraHidden={{ pipeline: pipelineKey }}
            />
          )}
          <ExportPdfButton
            slug="launchpad-ai"
            period={period}
            extraQuery={`&pipeline=${pipelineKey}${rangeQuery}`}
          />
        </div>
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
        <CallFunnelSnapshotSections reportPromise={reportPromise} pipelineKey={pipelineKey} />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-8">
            <div className="h-64 w-full animate-pulse rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1e2128]" />
            <ChartGridSkeleton count={2} accent="blue" />
          </div>
        }
      >
        <CallFunnelTrendsSections
          trendsPromise={trendsPromise}
          rangeHeading={rangeHeading}
          period={period}
          pipelineKey={pipelineKey}
        />
      </Suspense>
    </DashboardShell>
  );
}
