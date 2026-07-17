export interface WeekBucket {
  index: number;
  start: Date;
  end: Date;
  label: string;
}

/**
 * `weeks` trailing 7-day buckets ending now, oldest first. Meta's own
 * time_increment=7 breakdown and GHL's client-side event bucketing both
 * anchor off this same since/until so weekly rows line up across sources.
 */
export function getWeekBuckets(weeks: number): WeekBucket[] {
  const until = new Date();
  const since = new Date(until.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(since.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      index: i,
      start,
      end,
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

export function getRangeMillis(weeks: number): { startTime: number; endTime: number } {
  const endTime = Date.now();
  const startTime = endTime - weeks * 7 * 24 * 60 * 60 * 1000;
  return { startTime, endTime };
}

/** Returns the bucket index for a date, or null if it falls outside every bucket. */
export function bucketIndexForDate(date: Date, buckets: WeekBucket[]): number | null {
  for (const bucket of buckets) {
    if (date >= bucket.start && date < bucket.end) return bucket.index;
  }
  return null;
}
