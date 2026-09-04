import type {
  CallFunnelReport,
  ClientReport,
  CustomRange,
  LeadSourceCount,
  PipelineFunnelReport,
  Period,
  WeeklyCallFunnelDataPoint,
  WeeklyDataPoint,
  WeeklyPipelineDataPoint,
} from "@/types";
import { getClientBySlug } from "@/config/clients";
import { getLaunchpadPipeline, launchpadCombinedSince, launchpadPipelines } from "@/config/launchpad";
import { getMetaInsights, getMetaWeeklyInsights, type MetaInsights } from "@/lib/meta";
import {
  getAppointmentStats,
  getCallFunnelStats,
  getPipelineFunnelStats,
  getSalesStats,
  getWeeklyAppointmentStats,
  getWeeklyCallFunnelStats,
  getWeeklyPipelineFunnelStats,
  getWeeklySalesStats,
  type CallFunnelStats,
} from "@/lib/ghl";
import { getWeekBuckets, getWeekBucketsFrom } from "@/lib/weeks";
import type { WeekBucket } from "@/lib/weeks";
import { currentMonthRangeUTC } from "@/lib/period";

function safeDivide(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Resolves the weekly-trend buckets for a period: the usual trailing
 * `weeks` weeks for "7d", every week of the current calendar month for
 * "month" (clipped to the month's actual last day, see getWeekBucketsFrom),
 * every week since the client's clientSince date for "lifetime", or every
 * week spanning the user-picked [from, to] for "custom" (to is inclusive,
 * so +1 day for this app's half-open bucket convention — same adjustment as
 * periodToRange).
 */
function resolveTrendBuckets(
  period: Period,
  weeks: number,
  clientSince?: string,
  customRange?: CustomRange
): WeekBucket[] {
  if (period === "custom") {
    if (!customRange) {
      throw new Error("resolveTrendBuckets: the custom period requires a customRange.");
    }
    const since = new Date(`${customRange.from}T00:00:00Z`);
    const until = new Date(new Date(`${customRange.to}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000);
    return getWeekBucketsFrom(since, until);
  }
  if (period === "lifetime") {
    if (!clientSince) {
      throw new Error("resolveTrendBuckets: the lifetime period requires clientSince.");
    }
    return getWeekBucketsFrom(new Date(`${clientSince}T00:00:00Z`));
  }
  if (period === "month") {
    const { startTime, endTime } = currentMonthRangeUTC();
    return getWeekBucketsFrom(new Date(startTime), new Date(endTime));
  }
  return getWeekBuckets(weeks);
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
  period: Period,
  customRange?: CustomRange
): Promise<ClientReport> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }

  const warnings: string[] = [];

  // Independent sources — fetched concurrently, not one-after-another.
  const [metaResult, apptResult, salesResult] = await Promise.allSettled([
    getMetaInsights(
      client.metaAdAccountId,
      period,
      client.metaLeadActionType,
      client.metaLandingPageViewActionType,
      client.clientSince,
      customRange
    ),
    getAppointmentStats(client, period, customRange),
    getSalesStats(client, period, customRange),
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

  // GHL's deduplicated opportunity count, not Meta's raw "lead" action —
  // Meta counts every form submission (duplicates included, e.g. the same
  // person re-submitting after seeing a retargeting ad), while GHL won't
  // create a second contact/opportunity for a repeat submission (confirmed
  // against real data 2026-07-28: Meta reported 34 "lead" actions in a 30-day
  // window where GHL only ever created 24 opportunities for that pipeline).
  let leads = 0;
  let quotesSent = 0;
  let quotesSentRevenue = 0;
  let closed = 0;
  let closedRevenue = 0;
  if (salesResult.status === "fulfilled") {
    leads = salesResult.value.leads;
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
      leads,
      costPerLead: safeDivide(meta.spend, leads),
    },
    funnel: {
      landingPageViews: meta.landingPageViews,
      optInRate: safeDivide(leads, meta.landingPageViews),
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
  period: Period,
  weeks: number = 4,
  customRange?: CustomRange
): Promise<WeeklyDataPoint[]> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }

  const buckets = resolveTrendBuckets(period, weeks, client.clientSince, customRange);

  const [metaResult, apptResult, salesResult] = await Promise.allSettled([
    getMetaWeeklyInsights(
      client.metaAdAccountId,
      buckets,
      client.metaLeadActionType,
      client.metaLandingPageViewActionType
    ),
    getWeeklyAppointmentStats(client, buckets),
    getWeeklySalesStats(client, buckets),
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
  const emptySales = { leads: 0, quotesSent: 0, quotesSentRevenue: 0, closed: 0, closedRevenue: 0 };

  return buckets.map((bucket) => {
    const bucketDateStr = bucket.start.toISOString().slice(0, 10);
    const meta = metaByWeek.get(bucketDateStr) ?? EMPTY_META;
    const appt = apptByWeek.get(bucket.index) ?? emptyAppt;
    const sales = salesByWeek.get(bucket.index) ?? emptySales;

    return {
      weekLabel: bucket.label,
      weekStart: bucket.start.toISOString(),
      adSpend: meta.spend,
      clicks: meta.clicks,
      impressions: meta.impressions,
      // GHL's deduplicated opportunity count, not Meta's raw "lead" action — see getClientReport.
      leads: sales.leads,
      cpc: meta.cpc,
      ctr: meta.ctr,
      costPerLead: safeDivide(meta.spend, sales.leads),
      landingPageViews: meta.landingPageViews,
      optInRate: safeDivide(sales.leads, meta.landingPageViews),
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
  period: Period,
  customRange?: CustomRange
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
    directQuoteLeads: 0,
    quotesSent: 0,
    quoteYes: 0,
    quoteNo: 0,
    reviewing: 0,
    appointmentsBooked: 0,
    appointmentsCancelled: 0,
    appointmentsLost: 0,
  };
  try {
    funnel = await getPipelineFunnelStats(client, client.customFunnel, period, customRange);
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
    directQuoteLeads: funnel.directQuoteLeads,
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
  period: Period,
  weeks: number = 4,
  customRange?: CustomRange
): Promise<WeeklyPipelineDataPoint[]> {
  const client = getClientBySlug(slug);
  if (!client) {
    throw new Error(`Unknown client slug: ${slug}`);
  }
  if (!client.customFunnel) {
    throw new Error(`${slug} has no customFunnel config in config/clients.ts.`);
  }

  const buckets = resolveTrendBuckets(period, weeks, client.clientSince, customRange);
  const empty = {
    totalLeads: 0,
    leadsBySource: [] as LeadSourceCount[],
    directQuoteLeads: 0,
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
    weekly = await getWeeklyPipelineFunnelStats(client, client.customFunnel, buckets);
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
      directQuoteLeads: w.directQuoteLeads,
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

const EMPTY_CALL_FUNNEL_STATS: CallFunnelStats = {
  callsMade: 0,
  appointmentsBooked: 0,
  shows: 0,
  noShows: 0,
  closed: 0,
  notClosed: 0,
  closedRevenue: 0,
};

function buildCallFunnelMetrics(stats: CallFunnelStats) {
  return {
    callsMade: stats.callsMade,
    appointmentsBooked: stats.appointmentsBooked,
    shows: stats.shows,
    noShows: stats.noShows,
    showRate: safeDivide(stats.shows, stats.shows + stats.noShows),
    closed: stats.closed,
    notClosed: stats.notClosed,
    closeRate: safeDivide(stats.closed, stats.shows),
    closedRevenue: stats.closedRevenue,
  };
}

function sumCallFunnelStats(a: CallFunnelStats, b: CallFunnelStats): CallFunnelStats {
  return {
    callsMade: a.callsMade + b.callsMade,
    appointmentsBooked: a.appointmentsBooked + b.appointmentsBooked,
    shows: a.shows + b.shows,
    noShows: a.noShows + b.noShows,
    closed: a.closed + b.closed,
    notClosed: a.notClosed + b.notClosed,
    closedRevenue: a.closedRevenue + b.closedRevenue,
  };
}

/**
 * Launchpad AI's own admin-only dashboard (config/launchpad.ts) — one of its
 * two real pipelines, or "combined" for both summed together. The Combined
 * view deliberately omits Calls Made and Meta ad metrics (no cac/roas either)
 * per the user 2026-09-04: only one of the two pipelines has ad spend at
 * all, and blending a call count across two differently-shaped funnels isn't
 * a meaningful number — see CallFunnelReport.meta.
 */
export async function getLaunchpadReport(
  pipelineKey: string,
  period: Period,
  customRange?: CustomRange
): Promise<CallFunnelReport> {
  const warnings: string[] = [];

  if (pipelineKey === "combined") {
    const results = await Promise.allSettled(
      launchpadPipelines.map((p) => getCallFunnelStats(p.client, p.funnel, period, customRange))
    );
    let totals = EMPTY_CALL_FUNNEL_STATS;
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        totals = sumCallFunnelStats(totals, r.value);
      } else {
        console.error(`[metrics] Launchpad ${launchpadPipelines[i].key} fetch failed:`, r.reason);
        warnings.push(`Couldn't load ${launchpadPipelines[i].name} from GHL.`);
      }
    });
    return {
      period,
      updatedAt: new Date().toISOString(),
      warnings,
      metrics: buildCallFunnelMetrics(totals),
    };
  }

  const view = getLaunchpadPipeline(pipelineKey);
  if (!view) {
    throw new Error(`Unknown Launchpad pipeline key: ${pipelineKey}`);
  }

  const [statsResult, metaResult] = await Promise.allSettled([
    getCallFunnelStats(view.client, view.funnel, period, customRange),
    view.hasMetaAds
      ? getMetaInsights(
          view.client.metaAdAccountId,
          period,
          view.client.metaLeadActionType,
          view.client.metaLandingPageViewActionType,
          view.client.clientSince,
          customRange
        )
      : Promise.resolve(null),
  ]);

  let stats = EMPTY_CALL_FUNNEL_STATS;
  if (statsResult.status === "fulfilled") {
    stats = statsResult.value;
  } else {
    console.error(`[metrics] Launchpad ${pipelineKey} fetch failed:`, statsResult.reason);
    warnings.push(`Couldn't load ${view.name} from GHL.`);
  }

  let meta: CallFunnelReport["meta"];
  if (view.hasMetaAds) {
    if (metaResult.status === "fulfilled" && metaResult.value) {
      const m = metaResult.value;
      meta = {
        spend: m.spend,
        clicks: m.clicks,
        impressions: m.impressions,
        cpc: m.cpc,
        ctr: m.ctr,
        // GHL's deduplicated opportunity count, not Meta's raw "lead" action — same convention as getClientReport.
        leads: stats.callsMade,
        costPerLead: safeDivide(m.spend, stats.callsMade),
        cac: safeDivide(m.spend, stats.closed),
        roas: safeDivide(stats.closedRevenue, m.spend),
      };
    } else {
      console.error(
        `[metrics] Launchpad ${pipelineKey} Meta fetch failed:`,
        metaResult.status === "rejected" ? metaResult.reason : "no data"
      );
      warnings.push("Couldn't load Meta Ads data.");
    }
  }

  return {
    period,
    updatedAt: new Date().toISOString(),
    warnings,
    metrics: buildCallFunnelMetrics(stats),
    meta,
  };
}

/** Week-by-week version of getLaunchpadReport, for the Launchpad dashboard's trend charts. */
export async function getLaunchpadTrends(
  pipelineKey: string,
  period: Period,
  weeks: number = 4,
  customRange?: CustomRange
): Promise<WeeklyCallFunnelDataPoint[]> {
  if (pipelineKey === "combined") {
    const buckets = resolveTrendBuckets(period, weeks, launchpadCombinedSince, customRange);
    const results = await Promise.allSettled(
      launchpadPipelines.map((p) => getWeeklyCallFunnelStats(p.client, p.funnel, buckets))
    );
    const weeklyByPipeline = results.map((r) => (r.status === "fulfilled" ? r.value : []));
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[metrics] Launchpad weekly ${launchpadPipelines[i].key} fetch failed:`, r.reason);
      }
    });

    return buckets.map((bucket) => {
      let totals = EMPTY_CALL_FUNNEL_STATS;
      for (const weekly of weeklyByPipeline) {
        const w = weekly.find((x) => x.weekIndex === bucket.index);
        if (w) totals = sumCallFunnelStats(totals, w);
      }
      const metrics = buildCallFunnelMetrics(totals);
      return {
        weekLabel: bucket.label,
        weekStart: bucket.start.toISOString(),
        // Calls Made isn't shown in the Combined view — see getLaunchpadReport.
        callsMade: 0,
        appointmentsBooked: metrics.appointmentsBooked,
        shows: metrics.shows,
        noShows: metrics.noShows,
        showRate: metrics.showRate,
        closed: metrics.closed,
        notClosed: metrics.notClosed,
        closeRate: metrics.closeRate,
        closedRevenue: metrics.closedRevenue,
      };
    });
  }

  const view = getLaunchpadPipeline(pipelineKey);
  if (!view) {
    throw new Error(`Unknown Launchpad pipeline key: ${pipelineKey}`);
  }
  const buckets = resolveTrendBuckets(period, weeks, view.client.clientSince, customRange);

  let weekly: Awaited<ReturnType<typeof getWeeklyCallFunnelStats>> = [];
  try {
    weekly = await getWeeklyCallFunnelStats(view.client, view.funnel, buckets);
  } catch (err) {
    console.error(`[metrics] Launchpad weekly ${pipelineKey} fetch failed:`, err);
  }
  const byWeek = new Map(weekly.map((w) => [w.weekIndex, w]));

  return buckets.map((bucket) => {
    const w = byWeek.get(bucket.index) ?? { ...EMPTY_CALL_FUNNEL_STATS, weekIndex: bucket.index };
    const metrics = buildCallFunnelMetrics(w);
    return {
      weekLabel: bucket.label,
      weekStart: bucket.start.toISOString(),
      callsMade: w.callsMade,
      appointmentsBooked: metrics.appointmentsBooked,
      shows: metrics.shows,
      noShows: metrics.noShows,
      showRate: metrics.showRate,
      closed: metrics.closed,
      notClosed: metrics.notClosed,
      closeRate: metrics.closeRate,
      closedRevenue: metrics.closedRevenue,
    };
  });
}
