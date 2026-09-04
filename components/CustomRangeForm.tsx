/**
 * Date-range picker for the "Custom" period — a plain GET form (no client JS
 * needed) that submits back to the same dashboard page with ?period=custom
 * plus the picked from/to. Only rendered when period === "custom" (see the
 * dashboard pages) so it doesn't clutter the toggle row otherwise.
 */
export function CustomRangeForm({
  slug,
  from,
  to,
  extraHidden,
}: {
  slug: string;
  from: string;
  to: string;
  /** Extra hidden fields to preserve on submit, e.g. { pipeline: "combined" } for the Launchpad dashboard. */
  extraHidden?: Record<string, string>;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={`/dashboard/${slug}`}
      method="get"
      className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 dark:border-white/10 dark:bg-[#1e2128]"
    >
      <input type="hidden" name="period" value="custom" />
      {extraHidden &&
        Object.entries(extraHidden).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <input
        type="date"
        name="from"
        defaultValue={from}
        max={to}
        required
        className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm text-slate-700 dark:border-white/10 dark:text-white/80"
      />
      <span className="text-slate-400 dark:text-white/40">–</span>
      <input
        type="date"
        name="to"
        defaultValue={to}
        max={today}
        required
        className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm text-slate-700 dark:border-white/10 dark:text-white/80"
      />
      <button
        type="submit"
        className="rounded-md bg-[#0067eb] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0058c7]"
      >
        Apply
      </button>
    </form>
  );
}
