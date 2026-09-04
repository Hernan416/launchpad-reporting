import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getClientBySlug } from "@/config/clients";
import {
  getClientReport,
  getClientTrends,
  getPipelineFunnelReport,
  getPipelineFunnelTrends,
} from "@/lib/metrics";
import type { Period } from "@/types";
import { StandardReportDocument } from "@/components/pdf/StandardReportDocument";
import { PipelineReportDocument } from "@/components/pdf/PipelineReportDocument";

const TREND_WEEKS = 4;

/**
 * Exports the exact same report the dashboard page is showing — same
 * period, same numbers — as a PDF, grouped by calendar month (see
 * lib/monthlyRollup.ts). Auth/role checks mirror
 * app/dashboard/[clientSlug]/page.tsx exactly, since this route serves the
 * same underlying data to the same audience, just as a downloadable file
 * instead of a page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  const { clientSlug } = await params;

  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session.user.role === "client" && session.user.clientSlug !== clientSlug) {
    return new Response("Forbidden", { status: 403 });
  }

  const client = getClientBySlug(clientSlug);
  if (!client) {
    return new Response("Client not found", { status: 404 });
  }

  const periodParam = request.nextUrl.searchParams.get("period");
  const requestedPeriod: Period =
    periodParam === "month" ? "month" : periodParam === "lifetime" ? "lifetime" : "7d";
  const period: Period = requestedPeriod === "lifetime" && !client.clientSince ? "7d" : requestedPeriod;

  const clientSinceLabel = client.clientSince
    ? new Date(`${client.clientSince}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : undefined;

  let pdfBuffer: Buffer;

  if (client.showMetaAds === false) {
    const [report, trends] = await Promise.all([
      getPipelineFunnelReport(clientSlug, period),
      getPipelineFunnelTrends(clientSlug, period, TREND_WEEKS),
    ]);
    pdfBuffer = await renderToBuffer(
      PipelineReportDocument({ clientName: client.name, period, report, trends })
    );
  } else {
    const [report, trends] = await Promise.all([
      getClientReport(clientSlug, period),
      getClientTrends(clientSlug, period, TREND_WEEKS),
    ]);
    pdfBuffer = await renderToBuffer(
      StandardReportDocument({ clientName: client.name, period, clientSinceLabel, report, trends })
    );
  }

  const fileName = `${clientSlug}-${period}-report.pdf`;
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
