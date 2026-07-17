import type { Period } from "@/types";
import { getWeekBuckets } from "@/lib/weeks";

const GRAPH_API_VERSION = "v21.0";

const DATE_PRESET: Record<Period, string> = {
  "7d": "last_7d",
  "30d": "last_30d",
};

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsightsRow {
  spend?: string;
  clicks?: string;
  impressions?: string;
  ctr?: string;
  cpc?: string;
  actions?: MetaAction[];
  date_start?: string;
  date_stop?: string;
}

interface MetaInsightsResponse {
  data: MetaInsightsRow[];
  error?: { message: string; type: string; code: number };
}

export interface MetaInsights {
  spend: number;
  clicks: number;
  impressions: number;
  cpc: number;
  ctr: number;
  leads: number;
  landingPageViews: number;
}

export interface WeeklyMetaInsights extends MetaInsights {
  weekStart: string;
}

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error("META_ACCESS_TOKEN env var is not set.");
  }
  return token;
}

function findAction(actions: MetaAction[] | undefined, type: string): number {
  const match = actions?.find((a) => a.action_type === type);
  return match ? Number(match.value) : 0;
}

function parseRow(row: MetaInsightsRow | undefined, leadActionType: string): MetaInsights {
  const spend = Number(row?.spend ?? 0);
  const clicks = Number(row?.clicks ?? 0);
  const impressions = Number(row?.impressions ?? 0);
  const cpc = row?.cpc ? Number(row.cpc) : clicks > 0 ? spend / clicks : 0;
  // Meta returns ctr as a percentage ("4.5" meaning 4.5%); normalize to a ratio.
  const ctr = row?.ctr
    ? Number(row.ctr) / 100
    : impressions > 0
      ? clicks / impressions
      : 0;

  return {
    spend,
    clicks,
    impressions,
    cpc,
    ctr,
    leads: findAction(row?.actions, leadActionType),
    landingPageViews: findAction(row?.actions, "landing_page_view"),
  };
}

async function fetchInsights(
  adAccountId: string,
  params: URLSearchParams
): Promise<MetaInsightsRow[]> {
  params.set("access_token", getAccessToken());
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${adAccountId}/insights?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  const json = (await res.json()) as MetaInsightsResponse;

  if (!res.ok || json.error) {
    throw new Error(
      `Meta Insights request failed: ${json.error?.message ?? res.statusText}`
    );
  }

  return json.data;
}

/**
 * leadActionType depends on how each client's Meta Pixel/Lead Ads are set
 * up — "lead" (on-platform Lead Ads) and "offsite_conversion.fb_pixel_lead"
 * (website pixel) are both common. Defaults to "lead"; override per client
 * once verified against real ad account data.
 */
export async function getMetaInsights(
  adAccountId: string,
  period: Period,
  leadActionType: string = "lead"
): Promise<MetaInsights> {
  const params = new URLSearchParams({
    fields: "spend,clicks,impressions,ctr,cpc,actions",
    date_preset: DATE_PRESET[period],
  });

  const data = await fetchInsights(adAccountId, params);
  return parseRow(data[0], leadActionType);
}

/**
 * One row per 7-day bucket over the trailing `weeks` weeks, via Meta's
 * native time_increment (a single API call, no per-week fan-out).
 */
export async function getMetaWeeklyInsights(
  adAccountId: string,
  weeks: number,
  leadActionType: string = "lead"
): Promise<WeeklyMetaInsights[]> {
  const buckets = getWeekBuckets(weeks);
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    fields: "spend,clicks,impressions,ctr,cpc,actions",
    time_increment: "7",
  });
  params.set(
    "time_range",
    JSON.stringify({
      since: toDateStr(buckets[0].start),
      until: toDateStr(buckets[buckets.length - 1].end),
    })
  );

  const data = await fetchInsights(adAccountId, params);

  return data.map((row) => ({
    weekStart: row.date_start ?? "",
    ...parseRow(row, leadActionType),
  }));
}
