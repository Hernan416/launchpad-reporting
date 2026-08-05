import type { ClientConfig, CustomFunnelConfig, LeadSourceCount, Period } from "@/types";
import { bucketIndexForDate, rangeFromBuckets } from "@/lib/weeks";
import type { WeekBucket } from "@/lib/weeks";

const API_BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

const DEFAULT_SHOW_STATUS = "showed";
const DEFAULT_PIPELINE_NAME = "Sales Pipeline";
const DEFAULT_QUOTE_SENT_STAGES = ["Quote Sent"];
const DEFAULT_CLOSED_STAGES = ["Closed Won"];

interface CalendarEvent {
  appointmentStatus?: string;
  startTime?: string;
  contactId?: string;
}

/**
 * Rescheduling an appointment doesn't always move or delete its calendar
 * event — sometimes GHL leaves the original event in place with
 * appointmentStatus flipped to "invalid" and creates a brand new event for
 * the new time; other times (e.g. a lead re-booking through the widget
 * without going through a formal reschedule flow) the original event is
 * left as "confirmed" and a second, third, etc. event is created alongside
 * it with no status change at all. Confirmed across One Day Roofing, US
 * Home Pro, and JJ Roofing (2026-08-04/05) — including one US Home Pro
 * contact with three separate "confirmed" events booked the same day.
 * Counting raw event length treats every one of these as a brand new
 * appointment. Fixed in two steps in fetchCalendarEvents: drop "invalid"
 * events, then collapse whatever's left down to one event per contactId
 * (keeping the latest startTime) so a lead who booked/rebooked N times
 * still counts as exactly one appointment.
 */
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
  /** Every opportunity CREATED in ghlPipelineName during the period — the deduplicated lead count (GHL won't create a second contact/opportunity for a repeat form submission), used instead of Meta's own raw "lead" action count which counts every submission, duplicates included. Independent of quotesSent/closed below — see isWithinRange in getSalesStats. */
  leads: number;
  /** Opportunities that REACHED that stage during the period (lastStageChangeAt), regardless of when they were created — so this can include (and exceed) leads from an earlier period who converted just now. */
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
  leads: number;
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

function periodToRange(period: Period, client: ClientConfig): { startTime: number; endTime: number } {
  const endTime = Date.now();
  if (period === "lifetime") {
    return { startTime: clientSinceMillis(client), endTime };
  }
  const days = period === "30d" ? 30 : 7;
  return { startTime: endTime - days * 24 * 60 * 60 * 1000, endTime };
}

function clientSinceMillis(client: ClientConfig): number {
  if (!client.clientSince) {
    throw new Error(
      `${client.slug} is missing clientSince in config/clients.ts — required for the lifetime view.`
    );
  }
  return new Date(`${client.clientSince}T00:00:00Z`).getTime();
}

/** Fallback lower bound for a client with no clientSince — wide enough to predate any real client's GHL history. */
const OPPORTUNITY_LOOKBACK_FLOOR = new Date("2020-01-01T00:00:00Z").getTime();

/**
 * How far back to fetch a pipeline's opportunities so that ones CREATED
 * before the requested period but UPDATED (stage-changed) during it aren't
 * missed. GHL's /opportunities/search date filter is createdAt-only (see
 * isWithinRange below) — fetching from this floor instead of the period's
 * own startTime, then filtering client-side by whichever date field a given
 * metric actually cares about, is what makes the createdAt/updatedAt split
 * possible at all.
 */
function pipelineFetchFloor(client: ClientConfig): number {
  return client.clientSince
    ? new Date(`${client.clientSince}T00:00:00Z`).getTime()
    : OPPORTUNITY_LOOKBACK_FLOOR;
}

/**
 * True if `dateStr` falls in [startTime, endTime). Used to apply the
 * createdAt vs. lastStageChangeAt split: "leads" only count opportunities
 * CREATED in the period, while quotesSent/closed/shows only count ones
 * whose CURRENT stage was reached (lastStageChangeAt) during the period —
 * regardless of when they were created. A lead created last month who
 * closes this month shows up in this month's Closed count but NOT in this
 * month's Leads count (and didn't count as Closed last month either, since
 * it hadn't closed yet) — so Closed/Quotes Sent are not a subset of Leads
 * and can legitimately exceed it. That's intentional, not a bug: Leads
 * answers "how many new people came in this period," Closed/Quotes Sent
 * answer "how much sales activity happened this period," and a sales cycle
 * that's longer than the reporting window means those two questions don't
 * have to agree.
 */
function isWithinRange(dateStr: string | undefined, startTime: number, endTime: number): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  return t >= startTime && t < endTime;
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

  return dedupeEventsByContact(
    perCalendar.flatMap((data) => data.events ?? []).filter((e) => e.appointmentStatus !== "invalid")
  );
}

/**
 * Collapses multiple calendar events for the same contact down to one —
 * the one with the latest startTime — so a lead who booked/rebooked more
 * than once (see the CalendarEvent comment above) counts as a single
 * appointment. Events with no contactId are kept as-is rather than merged
 * into each other.
 */
function dedupeEventsByContact(events: CalendarEvent[]): CalendarEvent[] {
  const latestByContact = new Map<string, CalendarEvent>();
  const withoutContact: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.contactId) {
      withoutContact.push(event);
      continue;
    }
    const existing = latestByContact.get(event.contactId);
    const eventTime = event.startTime ? new Date(event.startTime).getTime() : 0;
    const existingTime = existing?.startTime ? new Date(existing.startTime).getTime() : -Infinity;
    if (!existing || eventTime > existingTime) {
      latestByContact.set(event.contactId, event);
    }
  }

  return [...latestByContact.values(), ...withoutContact];
}

/**
 * Fetches the client's sales pipeline (ghlPipelineName, defaulting to the
 * first pipeline if unset/not found) and every opportunity created from
 * pipelineFetchFloor(client) through endTime, alongside a stageId ->
 * stageName map. That floor is deliberately earlier than any period's own
 * startTime — see pipelineFetchFloor and isWithinRange — so callers can
 * apply their own createdAt vs. lastStageChangeAt filtering afterward
 * instead of losing older-but-recently-updated opportunities to the fetch
 * itself. Shared by getAppointmentStats (pipeline-sourced shows),
 * getSalesStats, and their weekly counterparts.
 */
async function getSalesPipelineOpportunities(
  client: ClientConfig,
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

  const opportunities = await fetchAllPipelineOpportunities(
    client,
    pipeline.id,
    pipelineFetchFloor(client),
    endTime
  );
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
  const { startTime, endTime } = periodToRange(period, client);
  const events = await fetchCalendarEvents(client, calendarIds, startTime, endTime);
  const appointments = events.length;

  // Some clients' automation doesn't reliably keep the calendar event's own
  // appointmentStatus in sync with reality — their "Pipeline Movements"
  // workflows are the one thing that does, so shows come from there instead.
  if (client.ghlShowStageNames && client.ghlShowStageNames.length > 0) {
    const { opportunities, stageNameById } = await getSalesPipelineOpportunities(client, endTime);
    // Reached a show-stage DURING the period, regardless of when the
    // opportunity itself was created — see isWithinRange.
    const updated = opportunities.filter((o) => isWithinRange(o.lastStageChangeAt, startTime, endTime));
    const shows = filterByStageNames(updated, stageNameById, client.ghlShowStageNames).length;
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
  buckets: WeekBucket[]
): Promise<WeeklyAppointmentStats[]> {
  const calendarIds = requireCalendarIds(client);
  const { startTime, endTime } = rangeFromBuckets(buckets);
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
    const { opportunities, stageNameById } = await getSalesPipelineOpportunities(client, endTime);
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
  const { startTime, endTime } = periodToRange(period, client);
  const { opportunities, stageNameById } = await getSalesPipelineOpportunities(client, endTime);

  // Two independent filters over the same fetch (see isWithinRange): leads
  // is who's NEW this period (createdAt), quotesSent/closed is what
  // HAPPENED this period (lastStageChangeAt) — an opportunity created last
  // period that closes this period counts toward this period's Closed but
  // not its Leads, so Closed/Quotes Sent are not bounded by Leads.
  const leadOpportunities = opportunities.filter((o) => isWithinRange(o.createdAt, startTime, endTime));
  const updatedOpportunities = opportunities.filter((o) =>
    isWithinRange(o.lastStageChangeAt, startTime, endTime)
  );

  const quoteSentNames = client.ghlQuoteSentStageNames ?? DEFAULT_QUOTE_SENT_STAGES;
  const closedNames = client.ghlClosedStageNames ?? DEFAULT_CLOSED_STAGES;

  const quoteAgg = aggregateOpportunities(
    filterByStageNames(updatedOpportunities, stageNameById, quoteSentNames)
  );
  const closedAgg = aggregateOpportunities(
    filterByStageNames(updatedOpportunities, stageNameById, closedNames)
  );

  return {
    leads: leadOpportunities.length,
    quotesSent: quoteAgg.count,
    quotesSentRevenue: quoteAgg.revenue,
    closed: closedAgg.count,
    closedRevenue: closedAgg.revenue,
  };
}

export async function getWeeklySalesStats(
  client: ClientConfig,
  buckets: WeekBucket[]
): Promise<WeeklySalesStats[]> {
  const { endTime } = rangeFromBuckets(buckets);
  const { opportunities, stageNameById } = await getSalesPipelineOpportunities(client, endTime);

  const quoteSentNames = new Set(client.ghlQuoteSentStageNames ?? DEFAULT_QUOTE_SENT_STAGES);
  const closedNames = new Set(client.ghlClosedStageNames ?? DEFAULT_CLOSED_STAGES);

  const result: WeeklySalesStats[] = buckets.map((b) => ({
    weekIndex: b.index,
    leads: 0,
    quotesSent: 0,
    quotesSentRevenue: 0,
    closed: 0,
    closedRevenue: 0,
  }));

  for (const opp of opportunities) {
    const createdIdx = opp.createdAt ? bucketIndexForDate(new Date(opp.createdAt), buckets) : null;
    if (createdIdx !== null) result[createdIdx].leads += 1;

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
  const { startTime, endTime } = periodToRange(period, client);
  const floor = pipelineFetchFloor(client);

  // Fetched from `floor` (well before the period), not `startTime` — see
  // pipelineFetchFloor — so an opportunity created earlier that only
  // reaches a quote/appointment stage during this period isn't missed.
  const [quoteOpportunitiesAll, leadOpportunitiesAll] = await Promise.all([
    fetchAllPipelineOpportunities(client, pipeline.id, floor, endTime),
    fetchAllPipelineOpportunities(client, showsPipeline.id, floor, endTime),
  ]);

  // "Leads" and "Quotes Sent" are createdAt events (when did this specific
  // funnel entry start) — scoped to opportunities actually created in the
  // period. Quote-stage and appointment-stage counts are lastStageChangeAt
  // events (what happened this period) — scoped independently, so a lead
  // created last period who gets a Yes/No this period counts here even
  // though it isn't one of this period's Leads (see isWithinRange).
  const quoteOpportunities = quoteOpportunitiesAll.filter((o) =>
    isWithinRange(o.createdAt, startTime, endTime)
  );
  const leadOpportunities = leadOpportunitiesAll.filter((o) =>
    isWithinRange(o.createdAt, startTime, endTime)
  );
  const quoteOpportunitiesUpdated = quoteOpportunitiesAll.filter((o) =>
    isWithinRange(o.lastStageChangeAt, startTime, endTime)
  );
  const leadOpportunitiesUpdated = leadOpportunitiesAll.filter((o) =>
    isWithinRange(o.lastStageChangeAt, startTime, endTime)
  );

  const stageNameById = new Map(pipeline.stages.map((s) => [s.id, s.name]));
  const inQuoteStages = (names: string[]) => {
    const nameSet = new Set(names);
    return quoteOpportunitiesUpdated.filter((o) => nameSet.has(stageNameById.get(o.pipelineStageId) ?? ""));
  };

  const showsStageNameById = new Map(showsPipeline.stages.map((s) => [s.id, s.name]));
  const inShowsStages = (names: string[]) => {
    const nameSet = new Set(names);
    return leadOpportunitiesUpdated.filter((o) => nameSet.has(showsStageNameById.get(o.pipelineStageId) ?? ""));
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
  buckets: WeekBucket[]
): Promise<WeeklyPipelineFunnelStats[]> {
  const [pipeline, showsPipeline] = await Promise.all([
    getPipelineByName(client, config.pipelineName),
    getPipelineByName(client, config.showsPipelineName),
  ]);
  const { endTime } = rangeFromBuckets(buckets);
  const floor = pipelineFetchFloor(client);

  // Fetched from `floor`, not the buckets' own start — see
  // pipelineFetchFloor — so an opportunity created before the visible
  // range but updated within it still lands in the right week below.
  const [quoteOpportunities, leadOpportunities] = await Promise.all([
    fetchAllPipelineOpportunities(client, pipeline.id, floor, endTime),
    fetchAllPipelineOpportunities(client, showsPipeline.id, floor, endTime),
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
  // Source lookups only matter for opportunities that'll actually land in a
  // visible week (see the createdAt bucketing below) — restrict to those so
  // widening the fetch above doesn't turn into extra getContactSource calls
  // for opportunities from outside the buckets' range entirely.
  const inVisibleRange = (o: Opportunity) =>
    o.createdAt !== undefined && bucketIndexForDate(new Date(o.createdAt), buckets) !== null;
  const uniqueContactIds = [
    ...new Set(
      allLeadOpportunities
        .filter(inVisibleRange)
        .map((o) => o.contactId)
        .filter((id): id is string => !!id)
    ),
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
