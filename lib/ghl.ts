import type { ClientConfig, CustomFunnelConfig, LeadSourceCount, Period } from "@/types";
import { bucketIndexForDate, getRangeMillis, getWeekBuckets } from "@/lib/weeks";

const API_BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

const DEFAULT_SHOW_STATUS = "showed";
const DEFAULT_PIPELINE_NAME = "Sales Pipeline";
const DEFAULT_QUOTE_SENT_STAGES = ["Quote Sent"];
const DEFAULT_CLOSED_STAGES = ["Closed Won"];

interface CalendarEvent {
  appointmentStatus?: string;
  startTime?: string;
}

interface CalendarEventsResponse {
  events: CalendarEvent[];
}

interface PipelineStage {
  id: string;
  name: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

interface PipelinesResponse {
  pipelines: Pipeline[];
}

interface Opportunity {
  pipelineStageId: string;
  monetaryValue?: number;
  lastStageChangeAt?: string;
  createdAt?: string;
  source?: string;
  contactId?: string;
}

interface OpportunitiesSearchResponse {
  opportunities: Opportunity[];
  meta?: { total?: number };
}

export interface GhlAppointmentStats {
  appointments: number;
  shows: number;
}

export interface GhlSalesStats {
  quotesSent: number;
  quotesSentRevenue: number;
  closed: number;
  closedRevenue: number;
}

export interface WeeklyAppointmentStats {
  weekIndex: number;
  appointments: number;
  shows: number;
}

export interface WeeklySalesStats {
  weekIndex: number;
  quotesSent: number;
  quotesSentRevenue: number;
  closed: number;
  closedRevenue: number;
}

interface StageAggregate {
  count: number;
  revenue: number;
}

/** Hard cap on pages fetched per stage (100/page) — a safety net against runaway pagination, not an expected real-world ceiling. */
const MAX_OPPORTUNITY_PAGES = 20;

/**
 * Env var name for a client's static GHL Private Integration Token, e.g.
 * slug "excel-roofing" -> GHL_TOKEN_EXCEL_ROOFING. Generate one per client
 * from that sub-account's Settings > Private Integrations (GHL API v1's
 * shared agency key model is EOL — see AGENTS memory for why).
 */
function getGhlToken(client: ClientConfig): string {
  const envKey = `GHL_TOKEN_${client.slug.replace(/-/g, "_").toUpperCase()}`;
  const token = process.env[envKey];
  if (!token) {
    throw new Error(`${envKey} env var is not set.`);
  }
  return token;
}

async function ghlFetch<T>(
  client: ClientConfig,
  path: string,
  params: Record<string, string>
): Promise<T> {
  const url = `${API_BASE}${path}?${new URLSearchParams(params).toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getGhlToken(client)}`,
      Version: API_VERSION,
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`GHL request to ${path} failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

function periodToRange(period: Period): { startTime: number; endTime: number } {
  const endTime = Date.now();
  const days = period === "30d" ? 30 : 7;
  const startTime = endTime - days * 24 * 60 * 60 * 1000;
  return { startTime, endTime };
}

function requireCalendarIds(client: ClientConfig): string[] {
  if (!client.ghlCalendarIds || client.ghlCalendarIds.length === 0) {
    throw new Error(
      `${client.slug} is missing ghlCalendarIds in config/clients.ts — required by GET /calendars/events.`
    );
  }
  return client.ghlCalendarIds;
}

async function fetchCalendarEvents(
  client: ClientConfig,
  calendarIds: string[],
  startTime: number,
  endTime: number
): Promise<CalendarEvent[]> {
  const perCalendar = await Promise.all(
    calendarIds.map((calendarId) =>
      ghlFetch<CalendarEventsResponse>(client, "/calendars/events", {
        locationId: client.ghlLocationId,
        calendarId,
        startTime: String(startTime),
        endTime: String(endTime),
      })
    )
  );

  return perCalendar.flatMap((data) => data.events ?? []);
}

/**
 * Fetches the client's sales pipeline (ghlPipelineName, defaulting to the
 * first pipeline if unset/not found) and every opportunity created in it
 * within the given range, alongside a stageId -> stageName map. Shared by
 * getAppointmentStats (pipeline-sourced shows), getSalesStats, and their
 * weekly counterparts, so callers filter this same fetch by stage-name set
 * instead of each issuing their own per-stage request.
 */
async function getSalesPipelineOpportunities(
  client: ClientConfig,
  startTime: number,
  endTime: number
): Promise<{ opportunities: Opportunity[]; stageNameById: Map<string, string> }> {
  const data = await ghlFetch<PipelinesResponse>(client, "/opportunities/pipelines", {
    locationId: client.ghlLocationId,
  });

  const pipelineName = client.ghlPipelineName ?? DEFAULT_PIPELINE_NAME;
  const pipeline = data.pipelines.find((p) => p.name === pipelineName) ?? data.pipelines[0];
  if (!pipeline) {
    throw new Error(`${client.slug} has no GHL pipelines configured.`);
  }

  const opportunities = await fetchAllPipelineOpportunities(client, pipeline.id, startTime, endTime);
  const stageNameById = new Map(pipeline.stages.map((s) => [s.id, s.name]));
  return { opportunities, stageNameById };
}

function filterByStageNames(
  opportunities: Opportunity[],
  stageNameById: Map<string, string>,
  names: string[]
): Opportunity[] {
  const nameSet = new Set(names);
  return opportunities.filter((o) => nameSet.has(stageNameById.get(o.pipelineStageId) ?? ""));
}

export async function getAppointmentStats(
  client: ClientConfig,
  period: Period
): Promise<GhlAppointmentStats> {
  const calendarIds = requireCalendarIds(client);
  const { startTime, endTime } = periodToRange(period);
  const events = await fetchCalendarEvents(client, calendarIds, startTime, endTime);
  const appointments = events.length;

  // Some clients' automation doesn't reliably keep the calendar event's own
  // appointmentStatus in sync with reality — their "Pipeline Movements"
  // workflows are the one thing that does, so shows come from there instead.
  if (client.ghlShowStageNames && client.ghlShowStageNames.length > 0) {
    const { opportunities, stageNameById } = await getSalesPipelineOpportunities(
      client,
      startTime,
      endTime
    );
    const shows = filterByStageNames(opportunities, stageNameById, client.ghlShowStageNames).length;
    return { appointments, shows };
  }

  const showStatus = client.ghlShowStatus ?? DEFAULT_SHOW_STATUS;
  return {
    appointments,
    shows: events.filter((e) => e.appointmentStatus === showStatus).length,
  };
}

export async function getWeeklyAppointmentStats(
  client: ClientConfig,
  weeks: number
): Promise<WeeklyAppointmentStats[]> {
  const calendarIds = requireCalendarIds(client);
  const buckets = getWeekBuckets(weeks);
  const { startTime, endTime } = getRangeMillis(weeks);
  const events = await fetchCalendarEvents(client, calendarIds, startTime, endTime);

  const result: WeeklyAppointmentStats[] = buckets.map((b) => ({
    weekIndex: b.index,
    appointments: 0,
    shows: 0,
  }));

  for (const event of events) {
    if (!event.startTime) continue;
    const idx = bucketIndexForDate(new Date(event.startTime), buckets);
    if (idx === null) continue;
    result[idx].appointments += 1;
  }

  if (client.ghlShowStageNames && client.ghlShowStageNames.length > 0) {
    const { opportunities, stageNameById } = await getSalesPipelineOpportunities(
      client,
      startTime,
      endTime
    );
    const showOpps = filterByStageNames(opportunities, stageNameById, client.ghlShowStageNames);
    for (const opp of showOpps) {
      const idx = opp.lastStageChangeAt
        ? bucketIndexForDate(new Date(opp.lastStageChangeAt), buckets)
        : null;
      if (idx === null) continue;
      result[idx].shows += 1;
    }
    return result;
  }

  const showStatus = client.ghlShowStatus ?? DEFAULT_SHOW_STATUS;
  for (const event of events) {
    if (!event.startTime || event.appointmentStatus !== showStatus) continue;
    const idx = bucketIndexForDate(new Date(event.startTime), buckets);
    if (idx === null) continue;
    result[idx].shows += 1;
  }

  return result;
}

function aggregateOpportunities(opportunities: Opportunity[]): StageAggregate {
  return {
    count: opportunities.length,
    revenue: opportunities.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0),
  };
}

export async function getSalesStats(
  client: ClientConfig,
  period: Period
): Promise<GhlSalesStats> {
  const { startTime, endTime } = periodToRange(period);
  const { opportunities, stageNameById } = await getSalesPipelineOpportunities(
    client,
    startTime,
    endTime
  );

  const quoteSentNames = client.ghlQuoteSentStageNames ?? DEFAULT_QUOTE_SENT_STAGES;
  const closedNames = client.ghlClosedStageNames ?? DEFAULT_CLOSED_STAGES;

  const quoteAgg = aggregateOpportunities(filterByStageNames(opportunities, stageNameById, quoteSentNames));
  const closedAgg = aggregateOpportunities(filterByStageNames(opportunities, stageNameById, closedNames));

  return {
    quotesSent: quoteAgg.count,
    quotesSentRevenue: quoteAgg.revenue,
    closed: closedAgg.count,
    closedRevenue: closedAgg.revenue,
  };
}

export async function getWeeklySalesStats(
  client: ClientConfig,
  weeks: number
): Promise<WeeklySalesStats[]> {
  const buckets = getWeekBuckets(weeks);
  const { startTime, endTime } = getRangeMillis(weeks);
  const { opportunities, stageNameById } = await getSalesPipelineOpportunities(
    client,
    startTime,
    endTime
  );

  const quoteSentNames = new Set(client.ghlQuoteSentStageNames ?? DEFAULT_QUOTE_SENT_STAGES);
  const closedNames = new Set(client.ghlClosedStageNames ?? DEFAULT_CLOSED_STAGES);

  const result: WeeklySalesStats[] = buckets.map((b) => ({
    weekIndex: b.index,
    quotesSent: 0,
    quotesSentRevenue: 0,
    closed: 0,
    closedRevenue: 0,
  }));

  for (const opp of opportunities) {
    const idx = opp.lastStageChangeAt
      ? bucketIndexForDate(new Date(opp.lastStageChangeAt), buckets)
      : null;
    if (idx === null) continue;
    const stageName = stageNameById.get(opp.pipelineStageId) ?? "";
    if (quoteSentNames.has(stageName)) {
      result[idx].quotesSent += 1;
      result[idx].quotesSentRevenue += opp.monetaryValue ?? 0;
    }
    if (closedNames.has(stageName)) {
      result[idx].closed += 1;
      result[idx].closedRevenue += opp.monetaryValue ?? 0;
    }
  }

  return result;
}

export interface PipelineFunnelStats {
  totalLeads: number;
  leadsBySource: LeadSourceCount[];
  directQuoteLeads: number;
  quotesSent: number;
  quoteYes: number;
  quoteNo: number;
  reviewing: number;
  appointmentsBooked: number;
  appointmentsCancelled: number;
  appointmentsLost: number;
}

interface ContactDetail {
  id: string;
  source?: string;
}

interface ContactResponse {
  contact: ContactDetail;
}

async function fetchAllPipelineOpportunities(
  client: ClientConfig,
  pipelineId: string,
  startTime: number,
  endTime: number
): Promise<Opportunity[]> {
  const limit = 100;
  let page = 1;
  const all: Opportunity[] = [];

  for (;;) {
    const data = await ghlFetch<OpportunitiesSearchResponse>(client, "/opportunities/search", {
      location_id: client.ghlLocationId,
      pipeline_id: pipelineId,
      date: String(startTime),
      endDate: String(endTime),
      page: String(page),
      limit: String(limit),
    });

    const opportunities = data.opportunities ?? [];
    all.push(...opportunities);

    if (opportunities.length < limit || page >= MAX_OPPORTUNITY_PAGES) break;
    page += 1;
  }

  return all;
}

/**
 * The opportunity's own `source` field is usually null — the real lead
 * source (e.g. "VELUX", "Website") lives on the linked contact instead.
 */
async function getContactSource(client: ClientConfig, contactId: string): Promise<string> {
  const data = await ghlFetch<ContactResponse>(client, `/contacts/${contactId}`, {});
  return data.contact?.source ?? "";
}

/** Lowercases and strips separators so "Instant_Estimator" / "Instant Estimator" / "instant-estimator" all compare equal. */
function normalizeSource(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Maps a raw contact `source` value to a display label using the client's
 * known LeadSourceRules. A non-empty source that matches no rule is shown
 * under its own raw label instead of being silently dropped — so a brand
 * new source (e.g. a future ad platform) still shows up as "all sources"
 * rather than disappearing from the dashboard.
 */
function categorizeSource(
  rawSource: string,
  leadSources: { key: string; label: string }[],
  defaultSourceLabel: string
): string {
  const normalized = normalizeSource(rawSource);
  if (!normalized) return defaultSourceLabel;
  for (const rule of leadSources) {
    if (normalized.includes(rule.key)) return rule.label;
  }
  return rawSource;
}

function countBySource(
  opportunities: Opportunity[],
  sourceByContactId: Map<string, string>,
  config: CustomFunnelConfig
): LeadSourceCount[] {
  const counts = new Map<string, number>();
  for (const opp of opportunities) {
    const raw = sourceByContactId.get(opp.contactId ?? "") ?? "";
    const label = categorizeSource(raw, config.leadSources, config.defaultSourceLabel);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Some leads (e.g. Roofr referrals) go straight into the quote-follow-up
 * pipeline and never pass through the appointment-booking pipeline at all —
 * checked against BOTH the opportunity's own `source` and its contact's
 * `source`, since which one actually carries the value isn't consistent.
 */
function isDirectQuoteSource(opp: Opportunity, contactSource: string, match: string): boolean {
  const normalizedMatch = normalizeSource(match);
  return (
    normalizeSource(opp.source ?? "").includes(normalizedMatch) ||
    normalizeSource(contactSource).includes(normalizedMatch)
  );
}

async function getPipelineByName(client: ClientConfig, name: string) {
  const data = await ghlFetch<PipelinesResponse>(client, "/opportunities/pipelines", {
    locationId: client.ghlLocationId,
  });

  const pipeline = data.pipelines.find((p) => p.name === name);
  if (!pipeline) {
    throw new Error(`${client.slug} has no GHL pipeline named "${name}".`);
  }
  return pipeline;
}

/**
 * Bespoke funnel view for clients tracked entirely through GHL pipeline
 * stages + the linked contact's `source` field, with no Meta Ads
 * involvement (see ClientConfig.customFunnel). Two pipelines are involved:
 * - `pipelineName` ("AI Quote Follow Up"): only leads who already got a
 *   quote sent end up here. "Quotes Sent" is every opportunity that ever
 *   entered it (its first stage is the quote being sent), not a
 *   current-stage snapshot.
 * - `showsPipelineName` ("Website Leads"): every incoming lead gets an
 *   opportunity here regardless of how far they get — this is where
 *   appointments (Booked/Cancelled/Lost) are tracked as a stage snapshot.
 * A lead can independently exist in both pipelines (one pipeline is "booking
 * an appointment to get a quote", the other is "already has the quote"), so
 * totalLeads and the source breakdown sum both pipelines' opportunities
 * rather than deduplicating by contact (confirmed with the user 2026-07-24).
 */
export async function getPipelineFunnelStats(
  client: ClientConfig,
  config: CustomFunnelConfig,
  period: Period
): Promise<PipelineFunnelStats> {
  const [pipeline, showsPipeline] = await Promise.all([
    getPipelineByName(client, config.pipelineName),
    getPipelineByName(client, config.showsPipelineName),
  ]);
  const { startTime, endTime } = periodToRange(period);

  const [quoteOpportunities, leadOpportunities] = await Promise.all([
    fetchAllPipelineOpportunities(client, pipeline.id, startTime, endTime),
    fetchAllPipelineOpportunities(client, showsPipeline.id, startTime, endTime),
  ]);

  const stageNameById = new Map(pipeline.stages.map((s) => [s.id, s.name]));
  const inQuoteStages = (names: string[]) => {
    const nameSet = new Set(names);
    return quoteOpportunities.filter((o) => nameSet.has(stageNameById.get(o.pipelineStageId) ?? ""));
  };

  const showsStageNameById = new Map(showsPipeline.stages.map((s) => [s.id, s.name]));
  const inShowsStages = (names: string[]) => {
    const nameSet = new Set(names);
    return leadOpportunities.filter((o) => nameSet.has(showsStageNameById.get(o.pipelineStageId) ?? ""));
  };

  const allLeadOpportunities = [...leadOpportunities, ...quoteOpportunities];
  const uniqueContactIds = [
    ...new Set(allLeadOpportunities.map((o) => o.contactId).filter((id): id is string => !!id)),
  ];
  const sources = await Promise.all(uniqueContactIds.map((id) => getContactSource(client, id)));
  const sourceByContactId = new Map(uniqueContactIds.map((id, i) => [id, sources[i]]));

  const directQuoteOpps: Opportunity[] = [];
  const sourceOpps: Opportunity[] = [];
  for (const opp of allLeadOpportunities) {
    const contactSource = sourceByContactId.get(opp.contactId ?? "") ?? "";
    if (isDirectQuoteSource(opp, contactSource, config.directQuoteSourceMatch)) {
      directQuoteOpps.push(opp);
    } else {
      sourceOpps.push(opp);
    }
  }

  return {
    totalLeads: allLeadOpportunities.length,
    leadsBySource: countBySource(sourceOpps, sourceByContactId, config),
    directQuoteLeads: directQuoteOpps.length,
    quotesSent: quoteOpportunities.length,
    quoteYes: inQuoteStages(config.quoteYesStageNames).length,
    quoteNo: inQuoteStages(config.quoteNoStageNames).length,
    reviewing: inQuoteStages(config.reviewingStageNames).length,
    appointmentsBooked: inShowsStages(config.bookedStageNames).length,
    appointmentsCancelled: inShowsStages(config.cancelledStageNames).length,
    appointmentsLost: inShowsStages(config.lostStageNames).length,
  };
}

export interface WeeklyPipelineFunnelStats {
  weekIndex: number;
  totalLeads: number;
  leadsBySource: LeadSourceCount[];
  directQuoteLeads: number;
  quotesSent: number;
  quoteYes: number;
  quoteNo: number;
  reviewing: number;
  appointmentsBooked: number;
  appointmentsCancelled: number;
  appointmentsLost: number;
}

/**
 * Week-by-week version of getPipelineFunnelStats. "Quotes Sent" and the lead
 * source breakdown are bucketed by createdAt — when the opportunity (and,
 * for leads, the funnel entry) started. Stage-based counts (Quote Yes/No,
 * Reviewing, appointment stages) are bucketed by lastStageChangeAt, i.e. the
 * week each opportunity reached its current status. Both pipelines are
 * fetched only once each for the whole range, not once per week.
 */
export async function getWeeklyPipelineFunnelStats(
  client: ClientConfig,
  config: CustomFunnelConfig,
  weeks: number
): Promise<WeeklyPipelineFunnelStats[]> {
  const [pipeline, showsPipeline] = await Promise.all([
    getPipelineByName(client, config.pipelineName),
    getPipelineByName(client, config.showsPipelineName),
  ]);
  const buckets = getWeekBuckets(weeks);
  const { startTime, endTime } = getRangeMillis(weeks);

  const [quoteOpportunities, leadOpportunities] = await Promise.all([
    fetchAllPipelineOpportunities(client, pipeline.id, startTime, endTime),
    fetchAllPipelineOpportunities(client, showsPipeline.id, startTime, endTime),
  ]);

  const stageNameById = new Map(pipeline.stages.map((s) => [s.id, s.name]));
  const showsStageNameById = new Map(showsPipeline.stages.map((s) => [s.id, s.name]));
  const quoteYesSet = new Set(config.quoteYesStageNames);
  const quoteNoSet = new Set(config.quoteNoStageNames);
  const reviewingSet = new Set(config.reviewingStageNames);
  const bookedSet = new Set(config.bookedStageNames);
  const cancelledSet = new Set(config.cancelledStageNames);
  const lostSet = new Set(config.lostStageNames);

  const allLeadOpportunities = [...leadOpportunities, ...quoteOpportunities];
  const uniqueContactIds = [
    ...new Set(allLeadOpportunities.map((o) => o.contactId).filter((id): id is string => !!id)),
  ];
  const sources = await Promise.all(uniqueContactIds.map((id) => getContactSource(client, id)));
  const sourceByContactId = new Map(uniqueContactIds.map((id, i) => [id, sources[i]]));

  const result: WeeklyPipelineFunnelStats[] = buckets.map((b) => ({
    weekIndex: b.index,
    totalLeads: 0,
    leadsBySource: [],
    directQuoteLeads: 0,
    quotesSent: 0,
    quoteYes: 0,
    quoteNo: 0,
    reviewing: 0,
    appointmentsBooked: 0,
    appointmentsCancelled: 0,
    appointmentsLost: 0,
  }));
  const sourceOppsByWeek: Opportunity[][] = buckets.map(() => []);

  for (const opp of allLeadOpportunities) {
    const idx = opp.createdAt ? bucketIndexForDate(new Date(opp.createdAt), buckets) : null;
    if (idx === null) continue;
    result[idx].totalLeads += 1;

    const contactSource = sourceByContactId.get(opp.contactId ?? "") ?? "";
    if (isDirectQuoteSource(opp, contactSource, config.directQuoteSourceMatch)) {
      result[idx].directQuoteLeads += 1;
    } else {
      sourceOppsByWeek[idx].push(opp);
    }
  }
  result.forEach((r, i) => {
    r.leadsBySource = countBySource(sourceOppsByWeek[i], sourceByContactId, config);
  });

  for (const opp of quoteOpportunities) {
    const createdIdx = opp.createdAt ? bucketIndexForDate(new Date(opp.createdAt), buckets) : null;
    if (createdIdx !== null) result[createdIdx].quotesSent += 1;

    const stageIdx = opp.lastStageChangeAt
      ? bucketIndexForDate(new Date(opp.lastStageChangeAt), buckets)
      : null;
    if (stageIdx === null) continue;
    const stageName = stageNameById.get(opp.pipelineStageId) ?? "";
    if (quoteYesSet.has(stageName)) result[stageIdx].quoteYes += 1;
    if (quoteNoSet.has(stageName)) result[stageIdx].quoteNo += 1;
    if (reviewingSet.has(stageName)) result[stageIdx].reviewing += 1;
  }

  for (const opp of leadOpportunities) {
    const stageIdx = opp.lastStageChangeAt
      ? bucketIndexForDate(new Date(opp.lastStageChangeAt), buckets)
      : null;
    if (stageIdx === null) continue;
    const stageName = showsStageNameById.get(opp.pipelineStageId) ?? "";
    if (bookedSet.has(stageName)) result[stageIdx].appointmentsBooked += 1;
    if (cancelledSet.has(stageName)) result[stageIdx].appointmentsCancelled += 1;
    if (lostSet.has(stageName)) result[stageIdx].appointmentsLost += 1;
  }

  return result;
}
