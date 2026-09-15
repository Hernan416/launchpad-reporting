import type { LostReasonBreakdown } from "@/types";
import { formatNumber, formatPercent } from "@/lib/format";

/**
 * TEST — a quick look at how a "why didn't this lead close" breakdown reads.
 * Used on both the Launchpad dashboard and every standard client dashboard
 * (all except Excel Roofing, per the user 2026-09-15) — same component, same
 * shared `LostReasonBreakdown` type either way, wrapped in a
 * `CollapsibleSection` by its caller (SnapshotSections.tsx /
 * CallFunnelSnapshotSections.tsx), which supplies the "Why It Didn't Close"
 * title. Deliberately self-contained otherwise (no shared MetricCard/
 * MetricGroup, its own markup) so it can be deleted in one shot: remove this
 * file, remove the import + JSX block from both call sites, and (optionally)
 * the `lostReasons`/`leadsSoFar` fields on CallFunnelStageConfig/
 * CallFunnelReport and ClientConfig/ClientReport. Nothing else references it.
 *
 * Every percentage is out of `leadsSoFar` — every lead the pipeline has ever
 * taken in, not just this period's Calls Made — so the two sub-lines per
 * card can honestly separate "leads that came in before this period but
 * only just resolved" from "leads that came in and resolved within this
 * period" (confirmed with the user 2026-09-14, from the "19 dead leads but
 * only 17 calls this month" question).
 *
 * Hover a card for a one-line explanation of that bucket — plain `title`
 * attribute, no tooltip library, so it's just as disposable as everything
 * else here.
 */
export function LostReasonsBreakdown({
  leadsSoFar,
  reasons,
}: {
  leadsSoFar: number;
  reasons: LostReasonBreakdown[];
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500 dark:text-white/50">
        Of the 100% of {formatNumber(leadsSoFar)} leads obtained so far:
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason) => (
          <div
            key={reason.label}
            title={reason.description}
            className="cursor-help rounded-xl border border-black/[0.08] bg-white p-4 shadow-card transition duration-200 ease-snappy hover:-translate-y-0.5 hover:shadow-raised dark:border-white/8 dark:bg-[#1e2128] dark:hover:bg-[#242832]"
          >
            <p className="text-sm font-medium text-slate-500 dark:text-white/55">{reason.label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-slate-700 dark:text-white/80">
              {formatPercent(reason.totalPct)}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-white/35">
              {formatNumber(reason.totalCount)} leads total
            </p>

            <div className="mt-3 space-y-1.5 border-t border-black/[0.06] pt-2.5 dark:border-white/10">
              <p className="text-xs leading-snug text-slate-500 dark:text-white/50">
                <span className="font-semibold tabular-nums">{formatPercent(reason.createdBeforePeriodPct)}</span>{" "}
                ({formatNumber(reason.createdBeforePeriodCount)}) — leads from before this period that turned out
                to be {reason.label.toLowerCase()}
              </p>
              <p className="text-xs leading-snug text-slate-500 dark:text-white/50">
                <span className="font-semibold tabular-nums">{formatPercent(reason.createdThisPeriodPct)}</span> (
                {formatNumber(reason.createdThisPeriodCount)}) — leads from this period that are currently{" "}
                {reason.label.toLowerCase()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
