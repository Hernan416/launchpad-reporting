import type {
  ClientReport,
  LeadSourceCount,
  PipelineFunnelReport,
  Period,
  WeeklyDataPoint,
  WeeklyPipelineDataPoint,
} from "@/types";
import { getClientBySlug } from "@/config/clients";
import { getMetaInsights, getMetaWeeklyInsights, type MetaInsights } from "@/lib/meta";
import {
  getAppointmentStats,
  getPipelineFunnelStats,
  getSalesStats,
  getWeeklyAppointmentStats,
  getWeeklyPipelineFunnelStats,
  getWeeklySalesStats,
} from "@/lib/ghl";
import { getWeekBuckets } from "@/lib/weeks";

function safeDivide(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

const EMPTY_META: MetaInsights = {
  spend: 0,
  clicks: 0,
  impressions: 0,
  cpc: 0,
  ctr: 0,
  leads: 0,
  landingPageViews: 0,
};

export async function getClientReport(
  slug: string,
  period: Period
): Promise<ClientReport> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }

  const warnings: string[] = [];

  // Independent sources — fetched concurrently, not one-after-another.
  const [metaResult, apptResult, salesResult] = await Promise.allSettled([
    getMetaInsights(client.metaAdAccountId, period, client.metaLeadActionType),
    getAppointmentStats(client, period),
    getSalesStats(client, period),
  ]);

  let meta = EMPTY_META;
  if (metaResult.status === "fulfilled") {
    meta = metaResult.value;
  } else {
    console.error(`[metrics] Meta Ads fetch failed for ${slug}:`, metaResult.reason);
    warnings.push("Couldn't load Meta Ads data.");
  }

  let appointments = 0;
  let shows = 0;
  if (apptResult.status === "fulfilled") {
    appointments = apptResult.value.appointments;
    shows = apptResult.value.shows;
  } else {
    console.error(`[metrics] GHL appointments fetch failed for ${slug}:`, apptResult.reason);
    warnings.push("Couldn't load appointments from GHL.");
  }

  let quotesSent = 0;
  let quotesSentRevenue = 0;
  let closed = 0;
  let closedRevenue = 0;
  if (salesResult.status === "fulfilled") {
    quotesSent = salesResult.value.quotesSent;
    quotesSentRevenue = salesResult.value.quotesSentRevenue;
    closed = salesResult.value.closed;
    closedRevenue = salesResult.value.closedRevenue;
  } else {
    console.error(`[metrics] GHL sales fetch failed for ${slug}:`, salesResult.reason);
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
 * time_range, so rows line up across sources). The three sources are
 * independent, so they're fetched concurrently.
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

  const [metaResult, apptResult, salesResult] = await Promise.allSettled([
    getMetaWeeklyInsights(client.metaAdAccountId, weeks, client.metaLeadActionType),
    getWeeklyAppointmentStats(client, weeks),
    getWeeklySalesStats(client, weeks),
  ]);

  if (metaResult.status === "rejected") {
    console.error(`[metrics] Meta weekly fetch failed for ${slug}:`, metaResult.reason);
  }
  if (apptResult.status === "rejected") {
    console.error(`[metrics] GHL weekly appointments fetch failed for ${slug}:`, apptResult.reason);
  }
  if (salesResult.status === "rejected") {
    console.error(`[metrics] GHL weekly sales fetch failed for ${slug}:`, salesResult.reason);
  }

  // Meta omits weeks with zero delivery entirely rather than returning a
  // zero row, so match by date instead of assuming index i === bucket i.
  const weeklyMeta = metaResult.status === "fulfilled" ? metaResult.value : [];
  const metaByWeek = new Map(weeklyMeta.map((m) => [m.weekStart, m]));

  const weeklyAppointments = apptResult.status === "fulfilled" ? apptResult.value : [];
  const apptByWeek = new Map(weeklyAppointments.map((a) => [a.weekIndex, a]));

  const weeklySales = salesResult.status === "fulfilled" ? salesResult.value : [];
  const salesByWeek = new Map(weeklySales.map((s) => [s.weekIndex, s]));

  const emptyAppt = { appointments: 0, shows: 0 };
  const emptySales = { quotesSent: 0, quotesSentRevenue: 0, closed: 0, closedRevenue: 0 };

  return buckets.map((bucket) => {
    const bucketDateStr = bucket.start.toISOString().slice(0, 10);
    const meta = metaByWeek.get(bucketDateStr) ?? EMPTY_META;
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

/**
 * GHL-only report for clients tracked entirely through one pipeline's
 * stages + opportunity source (no Meta Ads) — see ClientConfig.customFunnel.
 */
export async function getPipelineFunnelReport(
  slug: string,
  period: Period
): Promise<PipelineFunnelReport> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }
  if (!client.customFunnel) {
    throw new Error(`${slug} has no customFunnel config in config/clients.ts.`);
  }

  const warnings: string[] = [];

  let funnel = {
    totalLeads: 0,
    leadsBySource: [] as LeadSourceCount[],
    quotesSent: 0,
    quoteYes: 0,
    quoteNo: 0,
    reviewing: 0,
    appointmentsBooked: 0,
    appointmentsCancelled: 0,
    appointmentsLost: 0,
  };
  try {
    funnel = await getPipelineFunnelStats(client, client.customFunnel, period);
  } catch (err) {
    console.error(`[metrics] GHL pipeline funnel fetch failed for ${slug}:`, err);
    warnings.push("Couldn't load the sales pipeline from GHL.");
  }

  const decisions = funnel.quoteYes + funnel.quoteNo;

  return {
    period,
    updatedAt: new Date().toISOString(),
    warnings,
    totalLeads: funnel.totalLeads,
    leadsBySource: funnel.leadsBySource,
    quotesSent: funnel.quotesSent,
    quoteYes: funnel.quoteYes,
    quoteNo: funnel.quoteNo,
    reviewing: funnel.reviewing,
    decisions,
    decisionRate: safeDivide(decisions, funnel.quotesSent),
    yesRate: safeDivide(funnel.quoteYes, decisions),
    noRate: safeDivide(funnel.quoteNo, decisions),
    appointmentsBooked: funnel.appointmentsBooked,
    appointmentsCancelled: funnel.appointmentsCancelled,
    appointmentsLost: funnel.appointmentsLost,
  };
}

/** Week-by-week version of getPipelineFunnelReport, for the custom funnel's trend charts. */
export async function getPipelineFunnelTrends(
  slug: string,
  weeks: number = 4
): Promise<WeeklyPipelineDataPoint[]> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }
  if (!client.customFunnel) {
    throw new Error(`${slug} has no customFunnel config in config/clients.ts.`);
  }

  const buckets = getWeekBuckets(weeks);
  const empty = {
    totalLeads: 0,
    leadsBySource: [] as LeadSourceCount[],
    quotesSent: 0,
    quoteYes: 0,
    quoteNo: 0,
    reviewing: 0,
    appointmentsBooked: 0,
    appointmentsCancelled: 0,
    appointmentsLost: 0,
  };

  let weekly: Awaited<ReturnType<typeof getWeeklyPipelineFunnelStats>> = [];
  try {
    weekly = await getWeeklyPipelineFunnelStats(client, client.customFunnel, weeks);
  } catch (err) {
    console.error(`[metrics] GHL weekly pipeline funnel fetch failed for ${slug}:`, err);
  }
  const byWeek = new Map(weekly.map((w) => [w.weekIndex, w]));

  return buckets.map((bucket) => {
    const w = byWeek.get(bucket.index) ?? empty;
    const decisions = w.quoteYes + w.quoteNo;

    return {
      weekLabel: bucket.label,
      weekStart: bucket.start.toISOString(),
      totalLeads: w.totalLeads,
      leadsBySource: w.leadsBySource,
      quotesSent: w.quotesSent,
      quoteYes: w.quoteYes,
      quoteNo: w.quoteNo,
      reviewing: w.reviewing,
      decisions,
      decisionRate: safeDivide(decisions, w.quotesSent),
      yesRate: safeDivide(w.quoteYes, decisions),
      noRate: safeDivide(w.quoteNo, decisions),
      appointmentsBooked: w.appointmentsBooked,
      appointmentsCancelled: w.appointmentsCancelled,
      appointmentsLost: w.appointmentsLost,
    };
  });
}
