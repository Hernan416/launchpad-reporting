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
      className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-1.5 shadow-card dark:bg-[#1e2128]"
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
        className="rounded-lg border border-border bg-transparent px-2 py-1 text-sm text-slate-700 transition-colors duration-150 focus:border-[#0067eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/40 dark:text-white/80"
      />
      <span className="text-slate-400 dark:text-white/40">–</span>
      <input
        type="date"
        name="to"
        defaultValue={to}
        max={today}
        required
        className="rounded-lg border border-border bg-transparent px-2 py-1 text-sm text-slate-700 transition-colors duration-150 focus:border-[#0067eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/40 dark:text-white/80"
      />
      <button
        type="submit"
        className="rounded-full bg-[#0067eb] px-3 py-1.5 text-sm font-medium text-white transition-[background-color,transform] duration-150 ease-snappy hover:bg-[#0058c7] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50"
      >
        Apply
      </button>
    </form>
  );
}
