import type { ClientReport, Period, WeeklyDataPoint } from "@/types";
import { getClientBySlug } from "@/config/clients";
import { getMetaInsights, getMetaWeeklyInsights, type MetaInsights } from "@/lib/meta";
import {
  getAppointmentStats,
  getSalesStats,
  getWeeklyAppointmentStats,
  getWeeklySalesStats,
} from "@/lib/ghl";
import { getWeekBuckets } from "@/lib/weeks";

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
    warnings.push("Couldn't load Meta Ads data.");
  }

  let appointments = 0;
  let shows = 0;
  try {
    const stats = await getAppointmentStats(client, period);
    appointments = stats.appointments;
    shows = stats.shows;
  } catch (err) {
    console.error(`[metrics] GHL appointments fetch failed for ${slug}:`, err);
    warnings.push("Couldn't load appointments from GHL.");
  }

  let quotesSent = 0;
  let quotesSentRevenue = 0;
  let closed = 0;
  let closedRevenue = 0;
  try {
    const stats = await getSalesStats(client, period);
    quotesSent = stats.quotesSent;
    quotesSentRevenue = stats.quotesSentRevenue;
    closed = stats.closed;
    closedRevenue = stats.closedRevenue;
  } catch (err) {
    console.error(`[metrics] GHL sales fetch failed for ${slug}:`, err);
    warnings.push("Couldn't load sales opportunities from GHL.");
  }

  return {
    period,
    updatedAt: new Date().toISOString(),
    warnings,
    headline: {
      revenueClosed: closedRevenue,
      cac: safeDivide(meta.spend, closed),
      roas: safeDivide(closedRevenue, meta.spend),
      adSpend: meta.spend,
      costPerAppointment: safeDivide(meta.spend, appointments),
      revenueOpportunity: quotesSentRevenue,
      // Close rate is against appointments SHOWED, not leads or all appointments booked.
      closeRate: safeDivide(closed, shows),
      closedCount: closed,
      shownCount: shows,
    },
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

/**
 * Week-by-week breakdown for the trends section. No database, so this is
 * recomputed live each time: Meta's own time_increment gives weekly rows in
 * one call, while GHL events/opportunities are fetched once for the whole
 * range and bucketed client-side by lib/weeks.ts (same anchor as Meta's
 * time_range, so rows line up across sources).
 */
export async function getClientTrends(
  slug: string,
  weeks: number = 4
): Promise<WeeklyDataPoint[]> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }

  const buckets = getWeekBuckets(weeks);

  const emptyMeta = {
    spend: 0,
    clicks: 0,
    impressions: 0,
    cpc: 0,
    ctr: 0,
    leads: 0,
    landingPageViews: 0,
  };
  let weeklyMeta: Awaited<ReturnType<typeof getMetaWeeklyInsights>> = [];
  try {
    weeklyMeta = await getMetaWeeklyInsights(
      client.metaAdAccountId,
      weeks,
      client.metaLeadActionType
    );
  } catch (err) {
    console.error(`[metrics] Meta weekly fetch failed for ${slug}:`, err);
  }
  // Meta omits weeks with zero delivery entirely rather than returning a
  // zero row, so match by date instead of assuming index i === bucket i.
  const metaByWeek = new Map(weeklyMeta.map((m) => [m.weekStart, m]));

  const emptyAppt = { appointments: 0, shows: 0 };
  let weeklyAppointments: Awaited<ReturnType<typeof getWeeklyAppointmentStats>> = [];
  try {
    weeklyAppointments = await getWeeklyAppointmentStats(client, weeks);
  } catch (err) {
    console.error(`[metrics] GHL weekly appointments fetch failed for ${slug}:`, err);
  }
  const apptByWeek = new Map(weeklyAppointments.map((a) => [a.weekIndex, a]));

  const emptySales = { quotesSent: 0, quotesSentRevenue: 0, closed: 0, closedRevenue: 0 };
  let weeklySales: Awaited<ReturnType<typeof getWeeklySalesStats>> = [];
  try {
    weeklySales = await getWeeklySalesStats(client, weeks);
  } catch (err) {
    console.error(`[metrics] GHL weekly sales fetch failed for ${slug}:`, err);
  }
  const salesByWeek = new Map(weeklySales.map((s) => [s.weekIndex, s]));

  return buckets.map((bucket) => {
    const bucketDateStr = bucket.start.toISOString().slice(0, 10);
    const meta = metaByWeek.get(bucketDateStr) ?? emptyMeta;
    const appt = apptByWeek.get(bucket.index) ?? emptyAppt;
    const sales = salesByWeek.get(bucket.index) ?? emptySales;

    return {
      weekLabel: bucket.label,
      weekStart: bucket.start.toISOString(),
      adSpend: meta.spend,
      leads: meta.leads,
      cpc: meta.cpc,
      ctr: meta.ctr,
      costPerLead: safeDivide(meta.spend, meta.leads),
      landingPageViews: meta.landingPageViews,
      optInRate: safeDivide(meta.leads, meta.landingPageViews),
      appointments: appt.appointments,
      shows: appt.shows,
      showRate: safeDivide(appt.shows, appt.appointments),
      costPerAppointment: safeDivide(meta.spend, appt.appointments),
      costPerShownAppt: safeDivide(meta.spend, appt.shows),
      quotesSent: sales.quotesSent,
      revenueOpportunity: sales.quotesSentRevenue,
      closed: sales.closed,
      revenueClosed: sales.closedRevenue,
      closeRate: safeDivide(sales.closed, appt.shows),
      cac: safeDivide(meta.spend, sales.closed),
      roas: safeDivide(sales.closedRevenue, meta.spend),
    };
  });
}
