import type { ClientConfig, Period } from "@/types";
import { bucketIndexForDate, getRangeMillis, getWeekBuckets } from "@/lib/weeks";

const API_BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

const DEFAULT_SHOW_STATUS = "showed";
const DEFAULT_PIPELINE_NAME = "Sales Pipeline";
const DEFAULT_QUOTE_SENT_STAGE = "Quote Sent";
const DEFAULT_CLOSED_STAGE = "Closed Won";

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

const EMPTY_STAGE_AGGREGATE: StageAggregate = { count: 0, revenue: 0 };

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

export async function getAppointmentStats(
  client: ClientConfig,
  period: Period
): Promise<GhlAppointmentStats> {
  const calendarIds = requireCalendarIds(client);
  const { startTime, endTime } = periodToRange(period);
  const showStatus = client.ghlShowStatus ?? DEFAULT_SHOW_STATUS;

  const events = await fetchCalendarEvents(client, calendarIds, startTime, endTime);

  return {
    appointments: events.length,
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
  const showStatus = client.ghlShowStatus ?? DEFAULT_SHOW_STATUS;

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
    if (event.appointmentStatus === showStatus) result[idx].shows += 1;
  }

  return result;
}

async function findStageIds(
  client: ClientConfig
): Promise<{ pipelineId: string; quoteSentStageId?: string; closedStageId?: string }> {
  const data = await ghlFetch<PipelinesResponse>(client, "/opportunities/pipelines", {
    locationId: client.ghlLocationId,
  });

  const pipelineName = client.ghlPipelineName ?? DEFAULT_PIPELINE_NAME;
  const pipeline =
    data.pipelines.find((p) => p.name === pipelineName) ?? data.pipelines[0];

  if (!pipeline) {
    throw new Error(`${client.slug} has no GHL pipelines configured.`);
  }

  const quoteSentName = client.ghlQuoteSentStageName ?? DEFAULT_QUOTE_SENT_STAGE;
  const closedName = client.ghlClosedStageName ?? DEFAULT_CLOSED_STAGE;

  return {
    pipelineId: pipeline.id,
    quoteSentStageId: pipeline.stages.find((s) => s.name === quoteSentName)?.id,
    closedStageId: pipeline.stages.find((s) => s.name === closedName)?.id,
  };
}

async function fetchStageOpportunities(
  client: ClientConfig,
  pipelineId: string,
  pipelineStageId: string,
  startTime: number,
  endTime: number
): Promise<Opportunity[]> {
  const limit = 100;
  let page = 1;
  const all: Opportunity[] = [];

  for (;;) {
    const data = await ghlFetch<OpportunitiesSearchResponse>(client, "/opportunities/search", {
      locationId: client.ghlLocationId,
      pipelineId,
      pipelineStageId,
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

function aggregateOpportunities(opportunities: Opportunity[]): StageAggregate {
  return {
    count: opportunities.length,
    revenue: opportunities.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0),
  };
}

async function getStageAggregate(
  client: ClientConfig,
  pipelineId: string,
  pipelineStageId: string,
  period: Period
): Promise<StageAggregate> {
  const { startTime, endTime } = periodToRange(period);
  const opportunities = await fetchStageOpportunities(
    client,
    pipelineId,
    pipelineStageId,
    startTime,
    endTime
  );
  return aggregateOpportunities(opportunities);
}

export async function getSalesStats(
  client: ClientConfig,
  period: Period
): Promise<GhlSalesStats> {
  const { pipelineId, quoteSentStageId, closedStageId } = await findStageIds(client);

  const [quoteAgg, closedAgg] = await Promise.all([
    quoteSentStageId
      ? getStageAggregate(client, pipelineId, quoteSentStageId, period)
      : Promise.resolve(EMPTY_STAGE_AGGREGATE),
    closedStageId
      ? getStageAggregate(client, pipelineId, closedStageId, period)
      : Promise.resolve(EMPTY_STAGE_AGGREGATE),
  ]);

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
  const { pipelineId, quoteSentStageId, closedStageId } = await findStageIds(client);
  const buckets = getWeekBuckets(weeks);
  const { startTime, endTime } = getRangeMillis(weeks);

  const [quoteOpps, closedOpps] = await Promise.all([
    quoteSentStageId
      ? fetchStageOpportunities(client, pipelineId, quoteSentStageId, startTime, endTime)
      : Promise.resolve([]),
    closedStageId
      ? fetchStageOpportunities(client, pipelineId, closedStageId, startTime, endTime)
      : Promise.resolve([]),
  ]);

  const result: WeeklySalesStats[] = buckets.map((b) => ({
    weekIndex: b.index,
    quotesSent: 0,
    quotesSentRevenue: 0,
    closed: 0,
    closedRevenue: 0,
  }));

  for (const opp of quoteOpps) {
    const idx = opp.lastStageChangeAt
      ? bucketIndexForDate(new Date(opp.lastStageChangeAt), buckets)
      : null;
    if (idx === null) continue;
    result[idx].quotesSent += 1;
    result[idx].quotesSentRevenue += opp.monetaryValue ?? 0;
  }

  for (const opp of closedOpps) {
    const idx = opp.lastStageChangeAt
      ? bucketIndexForDate(new Date(opp.lastStageChangeAt), buckets)
      : null;
    if (idx === null) continue;
    result[idx].closed += 1;
    result[idx].closedRevenue += opp.monetaryValue ?? 0;
  }

  return result;
}
