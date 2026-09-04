import Link from "next/link";
import { launchpadPipelines } from "@/config/launchpad";

/** Tab-style switch between Launchpad's two real pipelines and their Combined view — analogous to PeriodToggle, but for which pipeline instead of which time window. Preserves the current period (and, for "custom", the picked from/to) across a pipeline switch. */
export function LaunchpadPipelineToggle({
  pipeline,
  period,
  rangeQuery = "",
}: {
  pipeline: string;
  period: string;
  /** Extra query string to preserve, e.g. "&from=2026-08-01&to=2026-08-31" when period is "custom". Must start with "&". */
  rangeQuery?: string;
}) {
  const options = [
    { value: "combined", label: "Combined" },
    ...launchpadPipelines.map((p) => ({ value: p.key, label: p.name })),
  ];

  return (
    <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-[#1e2128]">
      {options.map((option) => {
        const active = option.value === pipeline;
        return (
          <Link
            key={option.value}
            href={`/dashboard/launchpad-ai?pipeline=${option.value}&period=${period}${rangeQuery}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#0067eb] text-white"
                : "text-slate-600 hover:text-[#0067eb] dark:text-white/60 dark:hover:text-[#ffcf00]"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
