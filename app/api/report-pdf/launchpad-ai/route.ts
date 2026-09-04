import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getLaunchpadPipeline, launchpadCombinedSince } from "@/config/launchpad";
import { getLaunchpadReport, getLaunchpadTrends } from "@/lib/metrics";
import { parseCustomRange } from "@/lib/period";
import type { Period } from "@/types";
import { CallFunnelReportDocument } from "@/components/pdf/CallFunnelReportDocument";

const TREND_WEEKS = 4;

/**
 * PDF export for the Launchpad AI dashboard — a static route (not
 * [clientSlug]) for the same reason app/dashboard/launchpad-ai/page.tsx is:
 * Launchpad isn't a ClientConfig, and Next.js resolves this exact segment
 * ahead of the dynamic /api/report-pdf/[clientSlug] route. Auth/role check
 * mirrors that page exactly (admin-only, see config/launchpad.ts).
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "master") {
    return new Response("Forbidden", { status: 403 });
  }

  const pipelineParam = request.nextUrl.searchParams.get("pipeline");
  const pipelineKey =
    pipelineParam === "roofing-ads-2026" || pipelineParam === "cold-call-sales"
      ? pipelineParam
      : "combined";

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

  const view = pipelineKey === "combined" ? undefined : getLaunchpadPipeline(pipelineKey);
  const sinceDate = view ? view.client.clientSince! : launchpadCombinedSince;
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
    getLaunchpadReport(pipelineKey, period, customRange),
    getLaunchpadTrends(pipelineKey, period, TREND_WEEKS, customRange),
  ]);

  const pdfBuffer = await renderToBuffer(
    CallFunnelReportDocument({
      pipelineTitle: view ? view.name : "Combined",
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
      ? `launchpad-ai-${pipelineKey}-${customRange.from}-to-${customRange.to}-report.pdf`
      : `launchpad-ai-${pipelineKey}-${period}-report.pdf`;
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
