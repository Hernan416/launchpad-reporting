import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth, getAllowedClientSlugs } from "@/lib/auth";
import { stonnexPipelines, stonnexCombinedSince } from "@/config/stonnex";
import { getMultiPipelineReport, getMultiPipelineTrends } from "@/lib/metrics";
import { parseCustomRange } from "@/lib/period";
import type { Period } from "@/types";
import { DashboardShell } from "@/components/DashboardShell";
import { ClientNav } from "@/components/ClientNav";
import { PeriodToggle } from "@/components/PeriodToggle";
import { CustomRangeForm } from "@/components/CustomRangeForm";
import { PipelineToggle } from "@/components/PipelineToggle";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { CallFunnelSnapshotSections } from "@/components/sections/CallFunnelSnapshotSections";
import { CallFunnelTrendsSections } from "@/components/sections/CallFunnelTrendsSections";
import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";
import { ChartGridSkeleton } from "@/components/skeletons/ChartGridSkeleton";

const TREND_WEEKS = 4;
const SLUG = "stonnex-roofing";

export const metadata = { title: "Stonnex Roofing" };

/**
 * Stonnex Roofing — not a plain ClientConfig (config/clients.ts), same
 * reason as Launchpad AI: it needs a three-way "Old Leads" / "Meta Ads" /
 * Combined toggle (see config/stonnex.ts for why — both pipelines have real
 * volume, unlike every other client's dormant secondary pipelines), which
 * the generic [clientSlug] single-pipeline dashboard doesn't support. A
 * static route (not [clientSlug]) so Next.js resolves this exact segment
 * ahead of the dynamic one, reusing getMultiPipelineReport/
 * getMultiPipelineTrends (lib/metrics.ts) — the same functions Launchpad
 * AI's own dashboard uses for its own two pipelines.
 */
export default async function StonnexRoofingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; pipeline?: string; from?: string; to?: string }>;
}) {
  const { period: periodParam, pipeline: pipelineParam, from: fromParam, to: toParam } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Defense in depth: proxy.ts already restricts "client" role users to
  // their own slug(s) (see AppUser.clientSlugs), but a page should never
  // trust routing alone.
  const allowedSlugs = getAllowedClientSlugs(session.user);
  if (session.user.role === "client" && !allowedSlugs.includes(SLUG)) {
    redirect(`/dashboard/${allowedSlugs[0]}`);
  }

  const pipelineKey =
    pipelineParam === "old-leads" || pipelineParam === "meta-ads" ? pipelineParam : "combined";

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
  const rangeQuery = period === "custom" && customRange ? `&from=${customRange.from}&to=${customRange.to}` : "";

  const sinceDate =
    pipelineKey === "combined"
      ? stonnexCombinedSince
      : stonnexPipelines.find((p) => p.key === pipelineKey)!.client.clientSince!;
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
  const entryLabel =
    pipelineKey === "combined" ? undefined : stonnexPipelines.find((p) => p.key === pipelineKey)!.entryLabel;

  // Kicked off here, not awaited — each Suspense boundary below awaits its
  // own promise independently, same streaming pattern as every other
  // dashboard page.
  const reportPromise = getMultiPipelineReport(stonnexPipelines, pipelineKey, period, customRange);
  const trendsPromise = getMultiPipelineTrends(
    stonnexPipelines,
    stonnexCombinedSince,
    pipelineKey,
    period,
    TREND_WEEKS,
    customRange
  );

  const pipelineOptions = [
    { value: "combined", label: "Combined" },
    ...stonnexPipelines.map((p) => ({ value: p.key, label: p.name })),
  ];

  // Only master gets the cross-dashboard switcher (same special-cased link
  // as "Launchpad AI" — see components/ClientNav.tsx); a "client" role user
  // here only has this one slug, so no switcher is needed, same as every
  // other single-client login.
  const topNav = session.user.role === "master" ? <ClientNav currentSlug={SLUG} /> : undefined;

  return (
    <DashboardShell title="Stonnex Roofing" topNav={topNav}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PipelineToggle
          basePath={`/dashboard/${SLUG}`}
          options={pipelineOptions}
          pipeline={pipelineKey}
          period={period}
          rangeQuery={rangeQuery}
        />
        <div className="flex flex-wrap items-center gap-3">
          <PeriodToggle
            slug={SLUG}
            period={period}
            showLifetime
            extraQuery={`&pipeline=${pipelineKey}`}
            customRange={customRange}
          />
          {period === "custom" && customRange && (
            <CustomRangeForm
              slug={SLUG}
              from={customRange.from}
              to={customRange.to}
              extraHidden={{ pipeline: pipelineKey }}
            />
          )}
          <ExportPdfButton slug={SLUG} period={period} extraQuery={`&pipeline=${pipelineKey}${rangeQuery}`} />
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
        <CallFunnelSnapshotSections reportPromise={reportPromise} entryLabel={entryLabel} />
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
          entryLabel={entryLabel}
        />
      </Suspense>
    </DashboardShell>
  );
}
