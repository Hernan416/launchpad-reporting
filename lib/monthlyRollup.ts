import type {
  WeeklyDataPoint,
  WeeklyPipelineDataPoint,
  WeeklyCallFunnelDataPoint,
  LeadSourceCount,
} from "@/types";

function safeDivide(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export interface MonthGroup<T> {
  monthLabel: string;
  weeks: T[];
}

/**
 * Groups week buckets by the calendar month of their weekStart, in
 * chronological order. A week that straddles two months is attributed
 * entirely to the month its first day falls in — same convention used
 * elsewhere in this app (e.g. the "This Month" period label), so a report
 * never double-counts a week across two month sections.
 */
export function groupWeeksByMonth<T extends { weekStart: string }>(weeks: T[]): MonthGroup<T>[] {
  const order: string[] = [];
  const groups = new Map<string, T[]>();
  for (const week of weeks) {
    const label = new Date(week.weekStart).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    if (!groups.has(label)) {
      groups.set(label, []);
      order.push(label);
    }
    groups.get(label)!.push(week);
  }
  return order.map((monthLabel) => ({ monthLabel, weeks: groups.get(monthLabel)! }));
}

export type StandardMonthTotals = Omit<WeeklyDataPoint, "weekLabel" | "weekStart">;

/**
 * Sums a month's weekly rows into one totals row. Purely additive fields
 * (spend, leads, appointments, etc.) are summed directly; every ratio field
 * (cpc, ctr, costPerLead, optInRate, showRate, costPerAppointment,
 * costPerShownAppt, closeRate, cac, roas) is RECOMPUTED from the summed
 * additive fields rather than averaged week-to-week — averaging weekly
 * rates directly would silently misweight low-volume weeks the same as
 * high-volume ones.
 */
export function summarizeStandardMonth(weeks: WeeklyDataPoint[]): StandardMonthTotals {
  const sum = (key: keyof WeeklyDataPoint) => weeks.reduce((acc, w) => acc + (w[key] as number), 0);

  const adSpend = sum("adSpend");
  const clicks = sum("clicks");
  const impressions = sum("impressions");
  const leads = sum("leads");
  const landingPageViews = sum("landingPageViews");
  const appointments = sum("appointments");
  const shows = sum("shows");
  const quotesSent = sum("quotesSent");
  const revenueOpportunity = sum("revenueOpportunity");
  const closed = sum("closed");
  const revenueClosed = sum("revenueClosed");

  return {
    adSpend,
    clicks,
    impressions,
    leads,
    cpc: safeDivide(adSpend, clicks),
    ctr: safeDivide(clicks, impressions),
    costPerLead: safeDivide(adSpend, leads),
    landingPageViews,
    optInRate: safeDivide(leads, landingPageViews),
    appointments,
    shows,
    showRate: safeDivide(shows, appointments),
    costPerAppointment: safeDivide(adSpend, appointments),
    costPerShownAppt: safeDivide(adSpend, shows),
    quotesSent,
    revenueOpportunity,
    closed,
    revenueClosed,
    closeRate: safeDivide(closed, shows),
    cac: safeDivide(adSpend, closed),
    roas: safeDivide(revenueClosed, adSpend),
  };
}

export type PipelineMonthTotals = Omit<WeeklyPipelineDataPoint, "weekLabel" | "weekStart">;

/** Same idea as summarizeStandardMonth, for Excel Roofing's custom-funnel weekly shape. */
export function summarizePipelineMonth(weeks: WeeklyPipelineDataPoint[]): PipelineMonthTotals {
  const sum = (key: keyof WeeklyPipelineDataPoint) =>
    weeks.reduce((acc, w) => acc + (w[key] as number), 0);

  const totalLeads = sum("totalLeads");
  const directQuoteLeads = sum("directQuoteLeads");
  const quotesSent = sum("quotesSent");
  const quoteYes = sum("quoteYes");
  const quoteNo = sum("quoteNo");
  const reviewing = sum("reviewing");
  const appointmentsBooked = sum("appointmentsBooked");
  const appointmentsCancelled = sum("appointmentsCancelled");
  const appointmentsLost = sum("appointmentsLost");
  const decisions = quoteYes + quoteNo;

  const sourceCounts = new Map<string, number>();
  for (const week of weeks) {
    for (const source of week.leadsBySource) {
      sourceCounts.set(source.label, (sourceCounts.get(source.label) ?? 0) + source.count);
    }
  }
  const leadsBySource: LeadSourceCount[] = [...sourceCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalLeads,
    leadsBySource,
    directQuoteLeads,
    quotesSent,
    quoteYes,
    quoteNo,
    reviewing,
    decisions,
    decisionRate: safeDivide(decisions, quotesSent),
    yesRate: safeDivide(quoteYes, decisions),
    noRate: safeDivide(quoteNo, decisions),
    appointmentsBooked,
    appointmentsCancelled,
    appointmentsLost,
  };
}

export type CallFunnelMonthTotals = Omit<WeeklyCallFunnelDataPoint, "weekLabel" | "weekStart">;

/** Same idea as summarizeStandardMonth, for the Launchpad dashboard's call-funnel weekly shape. */
export function summarizeCallFunnelMonth(weeks: WeeklyCallFunnelDataPoint[]): CallFunnelMonthTotals {
  const sum = (key: keyof WeeklyCallFunnelDataPoint) =>
    weeks.reduce((acc, w) => acc + (w[key] as number), 0);

  const callsMade = sum("callsMade");
  const appointmentsBooked = sum("appointmentsBooked");
  const shows = sum("shows");
  const noShows = sum("noShows");
  const closed = sum("closed");
  const notClosed = sum("notClosed");
  const closedRevenue = sum("closedRevenue");

  return {
    callsMade,
    appointmentsBooked,
    shows,
    noShows,
    showRate: safeDivide(shows, shows + noShows),
    closed,
    notClosed,
    closeRate: safeDivide(closed, shows),
    closedRevenue,
  };
}
