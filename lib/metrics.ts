import type { ClientReport, Period } from "@/types";
import { getClientBySlug } from "@/config/clients";
import { getMetaInsights, type MetaInsights } from "@/lib/meta";
import { getAppointmentStats, getSalesStats } from "@/lib/ghl";

function safeDivide(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export async function getClientReport(
  slug: string,
  period: Period
): Promise<ClientReport> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }

  const warnings: string[] = [];

  let meta: MetaInsights = {
    spend: 0,
    clicks: 0,
    impressions: 0,
    cpc: 0,
    ctr: 0,
    leads: 0,
    landingPageViews: 0,
  };
  try {
    meta = await getMetaInsights(
      client.metaAdAccountId,
      period,
      client.metaLeadActionType
    );
  } catch (err) {
    console.error(`[metrics] Meta Ads fetch failed for ${slug}:`, err);
    warnings.push("No se pudieron cargar los datos de Meta Ads.");
  }

  let appointments = 0;
  let shows = 0;
  try {
    const stats = await getAppointmentStats(client, period);
    appointments = stats.appointments;
    shows = stats.shows;
  } catch (err) {
    console.error(`[metrics] GHL appointments fetch failed for ${slug}:`, err);
    warnings.push("No se pudieron cargar las citas de GHL.");
  }

  let quotesSent = 0;
  let closed = 0;
  try {
    const stats = await getSalesStats(client, period);
    quotesSent = stats.quotesSent;
    closed = stats.closed;
  } catch (err) {
    console.error(`[metrics] GHL sales fetch failed for ${slug}:`, err);
    warnings.push("No se pudieron cargar las oportunidades de venta de GHL.");
  }

  return {
    period,
    updatedAt: new Date().toISOString(),
    warnings,
    meta: {
      spend: meta.spend,
      clicks: meta.clicks,
      impressions: meta.impressions,
      cpc: meta.cpc,
      ctr: meta.ctr,
      leads: meta.leads,
      costPerLead: safeDivide(meta.spend, meta.leads),
    },
    funnel: {
      landingPageViews: meta.landingPageViews,
      optInRate: safeDivide(meta.leads, meta.landingPageViews),
      appointments,
      costPerAppointment: safeDivide(meta.spend, appointments),
    },
    sales: {
      showRate: safeDivide(shows, appointments),
      costPerShownAppt: safeDivide(meta.spend, shows),
      quotesSent,
      closed,
      cac: safeDivide(meta.spend, closed),
    },
  };
}
