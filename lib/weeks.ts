export interface WeekBucket {
  index: number;
  start: Date;
  end: Date;
  label: string;
}

function buildBuckets(since: Date, weeks: number, timeZone?: string): WeekBucket[] {
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(since.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      index: i,
      start,
      end,
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone }),
    };
  });
}

/**
 * `weeks` trailing 7-day buckets ending now, oldest first. Meta's own
 * time_increment=7 breakdown and GHL's client-side event bucketing both
 * anchor off this same since/until so weekly rows line up across sources.
 */
export function getWeekBuckets(weeks: number): WeekBucket[] {
  const until = new Date();
  const since = new Date(until.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  return buildBuckets(since, weeks);
}

/**
 * Weekly buckets from `since` forward through `until` (defaults to now) —
 * as many weeks as it takes to reach `until`, rather than a fixed trailing
 * count. Used for the lifetime view (since = a client's clientSince date,
 * until = now) and the month view (since = the 1st of the month, until =
 * the 1st of next month) — the last bucket is clipped to `until` so it
 * never overshoots. Both `since` and `until` are expected to be UTC
 * midnight instants (see ClientConfig.clientSince / lib/period.ts), so
 * labels are formatted in UTC too — otherwise a server running west of UTC
 * (e.g. America/Caracas) renders "2026-04-12" as "Apr 11".
 */
export function getWeekBucketsFrom(since: Date, until: Date = new Date()): WeekBucket[] {
  const weeks = Math.max(1, Math.ceil((until.getTime() - since.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  return buildBuckets(since, weeks, "UTC").map((bucket) =>
    bucket.end.getTime() > until.getTime() ? { ...bucket, end: until } : bucket
  );
}

/** Returns the bucket index for a date, or null if it falls outside every bucket. */
export function bucketIndexForDate(date: Date, buckets: WeekBucket[]): number | null {
  for (const bucket of buckets) {
    if (date >= bucket.start && date < bucket.end) return bucket.index;
  }
  return null;
}

/** The overall [start, end) range spanned by a list of buckets, as epoch millis — derived from the buckets themselves so a caller's range always matches exactly what it's about to bucket into. */
export function rangeFromBuckets(buckets: WeekBucket[]): { startTime: number; endTime: number } {
  return {
    startTime: buckets[0].start.getTime(),
    endTime: buckets[buckets.length - 1].end.getTime(),
  };
}
