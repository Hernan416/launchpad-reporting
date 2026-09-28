import type { TaggedContactReport } from "@/types";
import { HeadlineCard } from "@/components/HeadlineCard";
import { formatNumber } from "@/lib/format";

/**
 * Deliberately the simplest section in the app — one number, no funnel, no
 * trends. See config/launchpad.ts's skoolManychatView.
 */
export async function SkoolManychatSection({
  reportPromise,
  label,
}: {
  reportPromise: Promise<TaggedContactReport>;
  label: string;
}) {
  const report = await reportPromise;

  return (
    <div className="space-y-6">
      <p className="text-right text-sm text-slate-500 dark:text-white/55">
        Updated: {new Date(report.updatedAt).toLocaleString("en-US")}
      </p>

      {report.warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          <ul className="list-inside list-disc">
            {report.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="max-w-xs">
        <HeadlineCard label={label} value={formatNumber(report.count)} />
      </div>
    </div>
  );
}
