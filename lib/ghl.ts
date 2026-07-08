import type { ClientConfig, Period } from "@/types";

const API_BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

const DEFAULT_SHOW_STATUS = "showed";
const DEFAULT_PIPELINE_NAME = "Sales Pipeline";
const DEFAULT_QUOTE_SENT_STAGE = "Quote Sent";
const DEFAULT_CLOSED_STAGE = "Closed Won";

interface CalendarEvent {
  appointmentStatus?: string;
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
  closed: number;
}

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

export async function getAppointmentStats(
  client: ClientConfig,
  period: Period
): Promise<GhlAppointmentStats> {
  if (!client.ghlCalendarIds || client.ghlCalendarIds.length === 0) {
    throw new Error(
      `${client.slug} is missing ghlCalendarIds in config/clients.ts — required by GET /calendars/events.`
    );
  }

  const { startTime, endTime } = periodToRange(period);
  const showStatus = client.ghlShowStatus ?? DEFAULT_SHOW_STATUS;

  const perCalendar = await Promise.all(
    client.ghlCalendarIds.map((calendarId) =>
      ghlFetch<CalendarEventsResponse>(client, "/calendars/events", {
        locationId: client.ghlLocationId,
        calendarId,
        startTime: String(startTime),
        endTime: String(endTime),
      })
    )
  );

  const events = perCalendar.flatMap((data) => data.events ?? []);

  return {
    appointments: events.length,
    shows: events.filter((e) => e.appointmentStatus === showStatus).length,
  };
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

async function countOpportunitiesInStage(
  client: ClientConfig,
  pipelineId: string,
  pipelineStageId: string,
  period: Period
): Promise<number> {
  const { startTime, endTime } = periodToRange(period);
  const data = await ghlFetch<OpportunitiesSearchResponse>(client, "/opportunities/search", {
    locationId: client.ghlLocationId,
    pipelineId,
    pipelineStageId,
    date: String(startTime),
    endDate: String(endTime),
    limit: "100",
  });

  return data.meta?.total ?? data.opportunities.length;
}

export async function getSalesStats(
  client: ClientConfig,
  period: Period
): Promise<GhlSalesStats> {
  const { pipelineId, quoteSentStageId, closedStageId } = await findStageIds(client);

  const [quotesSent, closed] = await Promise.all([
    quoteSentStageId
      ? countOpportunitiesInStage(client, pipelineId, quoteSentStageId, period)
      : Promise.resolve(0),
    closedStageId
      ? countOpportunitiesInStage(client, pipelineId, closedStageId, period)
      : Promise.resolve(0),
  ]);

  return { quotesSent, closed };
}
