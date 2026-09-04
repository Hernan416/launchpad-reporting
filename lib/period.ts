import type { ClientConfig, CustomRange, Period } from "@/types";

const DATE_STRING_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates a pair of ?from=&to= query params into a CustomRange, or
 * undefined if either is missing, malformed, inverted (from after to), or
 * in the future (to after today) — callers fall back to "7d" in that case,
 * same convention as an invalid/missing clientSince falling back for
 * "lifetime". String comparison is safe here since YYYY-MM-DD sorts
 * lexicographically the same as chronologically.
 */
export function parseCustomRange(fromParam?: string | null, toParam?: string | null): CustomRange | undefined {
  if (!fromParam || !toParam) return undefined;
  if (!DATE_STRING_RE.test(fromParam) || !DATE_STRING_RE.test(toParam)) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  if (fromParam > toParam || toParam > today) return undefined;
  return { from: fromParam, to: toParam };
}

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
 * on exactly the same window for a given period — critical for "month",
 * "lifetime" and "custom", which use explicit calendar boundaries rather
 * than a platform-native rolling preset (only "7d" still uses one, via
 * Meta's own date_preset=last_7d).
 */
export function periodToRange(
  period: Period,
  client: ClientConfig,
  customRange?: CustomRange
): { startTime: number; endTime: number } {
  if (period === "custom") {
    if (!customRange) {
      throw new Error("periodToRange: the custom period requires a customRange.");
    }
    // customRange.to is inclusive (matches the date picker) — +1 day converts
    // it to this app's usual half-open [start, end) convention.
    return {
      startTime: new Date(`${customRange.from}T00:00:00Z`).getTime(),
      endTime: new Date(`${customRange.to}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000,
    };
  }
  if (period === "lifetime") {
    return { startTime: clientSinceMillis(client), endTime: Date.now() };
  }
  if (period === "month") {
    return currentMonthRangeUTC();
  }
  return { startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, endTime: Date.now() };
}
