import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth, getAllowedClientSlugs } from "@/lib/auth";
import { stonnexPipelines, stonnexCombinedSince } from "@/config/stonnex";
import { getMultiPipelineReport, getMultiPipelineTrends } from "@/lib/metrics";
import { parseCustomRange } from "@/lib/period";
import type { Period } from "@/types";
import { CallFunnelReportDocument } from "@/components/pdf/CallFunnelReportDocument";

const TREND_WEEKS = 4;
const SLUG = "stonnex-roofing";

/**
 * PDF export for the Stonnex Roofing dashboard — a static route (not
 * [clientSlug]) for the same reason app/dashboard/stonnex-roofing/page.tsx
 * is: Stonnex isn't a ClientConfig, and Next.js resolves this exact segment
 * ahead of the dynamic /api/report-pdf/[clientSlug] route. Auth/role check
 * mirrors that page exactly.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session.user.role === "client" && !getAllowedClientSlugs(session.user).includes(SLUG)) {
    return new Response("Forbidden", { status: 403 });
  }

  const pipelineParam = request.nextUrl.searchParams.get("pipeline");
  const pipelineKey =
    pipelineParam === "old-leads" || pipelineParam === "meta-ads" ? pipelineParam : "combined";

  const periodParam = request.nextUrl.searchParams.get("period");
  const customRange =
    periodParam === "custom"
      ? parseCustomRange(request.nextUrl.searchParams.get("from"), request.nextUrl.searchParams.get("to"))
      : undefined;
  const requestedPeriod: Period =
    periodParam === "custom"
      ? "custom"
      : periodParam === "month"
        ? "month"
        : periodParam === "lifetime"
          ? "lifetime"
          : "7d";
  const period: Period = requestedPeriod === "custom" && !customRange ? "7d" : requestedPeriod;

  const view = pipelineKey === "combined" ? undefined : stonnexPipelines.find((p) => p.key === pipelineKey);
  const sinceDate = view ? view.client.clientSince! : stonnexCombinedSince;
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

  const [report, trends] = await Promise.all([
    getMultiPipelineReport(stonnexPipelines, pipelineKey, period, customRange),
    getMultiPipelineTrends(stonnexPipelines, stonnexCombinedSince, pipelineKey, period, TREND_WEEKS, customRange),
  ]);

  const pdfBuffer = await renderToBuffer(
    CallFunnelReportDocument({
      pipelineTitle: `Stonnex Roofing — ${view ? view.name : "Combined"}`,
      entryLabel: view?.entryLabel,
      period,
      sinceLabel,
      customRangeLabel,
      report,
      trends,
    })
  );

  const fileName =
    period === "custom" && customRange
      ? `stonnex-roofing-${pipelineKey}-${customRange.from}-to-${customRange.to}-report.pdf`
      : `stonnex-roofing-${pipelineKey}-${period}-report.pdf`;
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
