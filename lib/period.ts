import type { ClientConfig, Period } from "@/types";

function clientSinceMillis(client: ClientConfig): number {
  if (!client.clientSince) {
    throw new Error(
      `${client.slug} is missing clientSince in config/clients.ts — required for the lifetime view.`
    );
  }
  return new Date(`${client.clientSince}T00:00:00Z`).getTime();
}

/** [start-of-month, start-of-next-month) for the current UTC calendar month, as epoch millis (half-open, matching this app's other range conventions). */
export function currentMonthRangeUTC(): { startTime: number; endTime: number } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return { startTime: Date.UTC(year, month, 1), endTime: Date.UTC(year, month + 1, 1) };
}

/** Same calendar month as currentMonthRangeUTC, as Meta's since/until date strings — Meta's time_range is inclusive on both ends, so `until` is the month's last day, not the 1st of next month. */
export function currentMonthDateStringsUTC(): { since: string; until: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return {
    since: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    until: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10),
  };
}

/**
 * Resolves a Period into a concrete [startTime, endTime) range in epoch
 * millis. Shared by lib/ghl.ts and lib/meta.ts so both data sources agree
 * on exactly the same window for a given period — critical for "month" and
 * "lifetime", which use explicit calendar boundaries rather than a
 * platform-native rolling preset (only "7d" still uses one, via Meta's own
 * date_preset=last_7d).
 */
export function periodToRange(period: Period, client: ClientConfig): { startTime: number; endTime: number } {
  if (period === "lifetime") {
    return { startTime: clientSinceMillis(client), endTime: Date.now() };
  }
  if (period === "month") {
    return currentMonthRangeUTC();
  }
  return { startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, endTime: Date.now() };
}
