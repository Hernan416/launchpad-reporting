import type { CallPipelineViewConfig } from "@/types";

const LOCATION_ID = "3xMX4EZod7Vu9Ydaa6YZ";

/**
 * Launchpad AI's own internal GHL account — admin-only (no "client" role
 * login has clientSlug "launchpad-ai", so proxy.ts's per-slug redirect makes
 * it unreachable to anyone but "master"; app/dashboard/launchpad-ai/page.tsx
 * also checks the role directly as defense in depth).
 *
 * Two real pipelines confirmed via the GHL API 2026-09-04, each modeled as a
 * synthetic ClientConfig purely to reuse lib/ghl.ts's fetch plumbing (both
 * share GHL_TOKEN_LAUNCHPAD_AI — see .env.local — since they're the same GHL
 * location) — metaAdAccountId is only read when hasMetaAds is true.
 *
 * Stage mapping confirmed with the user 2026-09-04:
 * - Every opportunity CREATED in a pipeline during the period is one
 *   call/lead — there's no separate "quote sent" stage in either pipeline
 *   (the call/consult itself is the pitch), so this dashboard skips that
 *   concept entirely and just tracks Calls/Leads -> Booked -> Shown -> Closed.
 * - "Not Closed" = showed up but didn't close (the equivalent of "Quote
 *   Rejected" at the roofing clients) — counts toward Shows, not Closed.
 * - Show Rate = Shows / (Shows + No-Shows), excluding Cancelled/Territory
 *   Taken/Disqualified/Dead Lead/etc., which never had a real appointment
 *   pending — same convention as every other client's ghlShowStageNames.
 * - The Combined view sums both pipelines' volume metrics only — no blended
 *   Calls Made count and no blended ad spend/CAC/ROAS (only one of the two
 *   pipelines has ad spend at all), per the user 2026-09-04.
 */
export const launchpadPipelines: CallPipelineViewConfig[] = [
  {
    key: "roofing-ads-2026",
    name: "Roofing Ads 2026",
    entryLabel: "Leads",
    hasMetaAds: true,
    client: {
      slug: "launchpad-ai",
      name: "Launchpad AI",
      metaAdAccountId: "act_650955301219390",
      ghlLocationId: LOCATION_ID,
      // This pipeline's own GHL creation date (dateAdded 2026-07-09T18:52:06Z,
      // confirmed via /opportunities/pipelines) — anchors its own Lifetime view.
      clientSince: "2026-07-09",
    },
    funnel: {
      pipelineName: "Roofing Ads 2026",
      // Confirmed with the user 2026-09-14: leads who book their own
      // appointment (via the "Launchpad Strategy Session" calendar) get this
      // contact tag — verified against real data, exactly 2 tagged today.
      selfBookedTag: "self-booked",
      bookedStageNames: [
        "Booked",
        "Needs Reschedule",
        "Confirmed",
        "Showed",
        "No-Showed",
        "Not Closed",
        "Closed",
      ],
      showStageNames: ["Showed", "Not Closed", "Closed"],
      noShowStageNames: ["No-Showed"],
      closedStageNames: ["Closed"],
      notClosedStageNames: ["Not Closed"],
    },
  },
  {
    key: "cold-call-sales",
    name: "Cold Call Sales",
    entryLabel: "Calls Made",
    hasMetaAds: false,
    client: {
      slug: "launchpad-ai",
      name: "Launchpad AI",
      // No ad spend on this pipeline — never read, since hasMetaAds is false.
      metaAdAccountId: "",
      ghlLocationId: LOCATION_ID,
      // This pipeline's own GHL creation date (dateAdded 2026-04-19T01:51:53Z,
      // confirmed via /opportunities/pipelines) — anchors its own Lifetime view.
      clientSince: "2026-04-19",
    },
    funnel: {
      pipelineName: "Cold Call Sales",
      bookedStageNames: [
        "Booked",
        "Confirmed",
        "Needs Reschedule",
        "Showed",
        "No-Showed",
        "Cancelled",
        "Not Closed",
        "Closed",
      ],
      showStageNames: ["Showed", "Not Closed", "Closed"],
      noShowStageNames: ["No-Showed"],
      closedStageNames: ["Closed"],
      notClosedStageNames: ["Not Closed"],
    },
  },
];

export function getLaunchpadPipeline(key: string): CallPipelineViewConfig | undefined {
  return launchpadPipelines.find((p) => p.key === key);
}

/** Earliest of both pipelines' own clientSince dates — anchors the Combined view's Lifetime period. */
export const launchpadCombinedSince = launchpadPipelines.reduce(
  (earliest, p) => (p.client.clientSince! < earliest ? p.client.clientSince! : earliest),
  launchpadPipelines[0].client.clientSince!
);
