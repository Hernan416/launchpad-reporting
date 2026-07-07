import type { ClientReport, Period } from "@/types";
import { getClientBySlug } from "@/config/clients";

/**
 * TODO: replace this mock with real calls into lib/meta.ts + lib/ghl.ts.
 * Kept as the single entry point so the UI/auth layers don't need to change
 * once real data sources are wired in.
 */
export async function getClientReport(
  slug: string,
  period: Period
): Promise<ClientReport> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }

  const multiplier = period === "30d" ? 4.2 : 1;
  const spend = 1200 * multiplier;
  const clicks = 480 * multiplier;
  const leads = 62 * multiplier;
  const landingPageViews = 900 * multiplier;
  const appointments = 30 * multiplier;
  const shows = 21 * multiplier;
  const quotesSent = 16 * multiplier;
  const closed = 6 * multiplier;

  return {
    period,
    updatedAt: new Date().toISOString(),
    meta: {
      spend,
      clicks,
      impressions: clicks * 22,
      cpc: spend / clicks,
      ctr: clicks / (clicks * 22),
      leads,
      costPerLead: spend / leads,
    },
    funnel: {
      landingPageViews,
      optInRate: leads / landingPageViews,
      appointments,
      costPerAppointment: spend / appointments,
    },
    sales: {
      showRate: shows / appointments,
      costPerShownAppt: spend / shows,
      quotesSent,
      closed,
      cac: spend / closed,
    },
  };
}
