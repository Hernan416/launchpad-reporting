import Link from "next/link";

/** Tab-style switch between a multi-pipeline dashboard's named views and their Combined view — analogous to PeriodToggle, but for which pipeline instead of which time window. Preserves the current period (and, for "custom", the picked from/to) across a pipeline switch. Shared by Launchpad AI (components/LaunchpadPipelineToggle.tsx) and Stonnex Roofing (app/dashboard/stonnex-roofing/page.tsx). */
export function PipelineToggle({
  basePath,
  options,
  pipeline,
  period,
  rangeQuery = "",
}: {
  /** e.g. "/dashboard/stonnex-roofing" — the page this toggle links back into. */
  basePath: string;
  options: { value: string; label: string }[];
  pipeline: string;
  period: string;
  /** Extra query string to preserve, e.g. "&from=2026-08-01&to=2026-08-31" when period is "custom". Must start with "&". */
  rangeQuery?: string;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl border border-border bg-white p-1 shadow-card dark:bg-[#1e2128]">
      {options.map((option) => {
        const active = option.value === pipeline;
        return (
          <Link
            key={option.value}
            href={`${basePath}?pipeline=${option.value}&period=${period}${rangeQuery}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 ${
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
