import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getLaunchpadPipeline, launchpadCombinedSince } from "@/config/launchpad";
import { getLaunchpadReport, getLaunchpadTrends } from "@/lib/metrics";
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
  const period: Period =
    periodParam === "month" ? "month" : periodParam === "lifetime" ? "lifetime" : "7d";

  const view = pipelineKey === "combined" ? undefined : getLaunchpadPipeline(pipelineKey);
  const sinceDate = view ? view.client.clientSince! : launchpadCombinedSince;
  const sinceLabel = new Date(`${sinceDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const [report, trends] = await Promise.all([
    getLaunchpadReport(pipelineKey, period),
    getLaunchpadTrends(pipelineKey, period, TREND_WEEKS),
  ]);

  const pdfBuffer = await renderToBuffer(
    CallFunnelReportDocument({
      pipelineTitle: view ? view.name : "Combined",
      entryLabel: view?.entryLabel,
      period,
      sinceLabel,
      report,
      trends,
    })
  );

  const fileName = `launchpad-ai-${pipelineKey}-${period}-report.pdf`;
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
