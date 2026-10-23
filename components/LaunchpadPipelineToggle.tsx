import { launchpadPipelines, skoolManychatView } from "@/config/launchpad";
import { PipelineToggle } from "@/components/PipelineToggle";

/** Tab-style switch between Launchpad's two real pipelines and their Combined view — see PipelineToggle, the generic component this wraps (shared with Stonnex Roofing's own multi-pipeline dashboard). */
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
    // Not a real pipeline, so it's excluded from Combined — a separate GHL
    // sub-account, just a tagged-contact count (see skoolManychatView).
    { value: skoolManychatView.key, label: skoolManychatView.name },
  ];

  return (
    <PipelineToggle
      basePath="/dashboard/launchpad-ai"
      options={options}
      pipeline={pipeline}
      period={period}
      rangeQuery={rangeQuery}
    />
  );
}
