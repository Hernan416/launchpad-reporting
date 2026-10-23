import type { CallPipelineViewConfig } from "@/types";

const LOCATION_ID = "BxOpYfAOI10dliYjqRs8";

/**
 * Stonnex Roofing — admin + client-login dashboard (not a plain ClientConfig
 * in config/clients.ts, same reason as Launchpad AI: see
 * app/dashboard/stonnex-roofing/page.tsx). No Meta Ads for this client at
 * all, per the user 2026-10-23.
 *
 * Mapped 2026-10-23 via direct GHL API calls (no MCP server for this token
 * yet). Unlike every other client onboarded so far, this account has TWO
 * pipelines with REAL volume, not one dormant/empty one — confirmed with the
 * user which to track: all three views (each pipeline separately, plus
 * Combined), same three-way toggle pattern as Launchpad AI's own dashboard
 * (reusing getMultiPipelineReport/getMultiPipelineTrends from lib/metrics.ts).
 *
 * "Meta Ads" pipeline (24 real opportunities) is an exact clone of the
 * Osland/McGuire/Elite Construction/My Local Roofer template (confirmed via
 * per-stage `originId`) — despite the name, hasMetaAds is false here per the
 * user (no Meta Ads actually run for this client; "Meta Ads" is just
 * leftover template naming, same situation as DayPro Roofing).
 *
 * "Old Leads" pipeline (197 real opportunities) reuses the exact same stage
 * NAME vocabulary (Form Submitted / Attempted Contact (No Booking) / Appt
 * Booked / etc.) but has no `originId` on any stage (built fresh, not cloned
 * from the shared snapshot) and one extra stage at position 0, literally
 * named "Old Leads" (9 real opportunities sitting there at mapping time) —
 * its business meaning is unconfirmed, so (same convention as "Needs Follow
 * Up" elsewhere on this template) it's excluded from every stage-name list
 * below. Ask the user what it means once it starts being used more, or if
 * Leads/Shows/Closed look off for this pipeline specifically.
 *
 * Since both pipelines share the proven stage vocabulary already validated
 * at Osland/McGuire/Elite Construction/DayPro Roofing/My Local Roofer, the
 * bookedStageNames/showStageNames/closedStageNames/disqualifiedStageNames/
 * lostReasons mapping below is applied identically to both — this is NOT a
 * fresh guess, it's the same standard template mapping reused a sixth time.
 * There's real volume to eventually validate it against here, unlike most of
 * those clients at their own onboarding — revisit once that happens.
 */
export const stonnexPipelines: CallPipelineViewConfig[] = [
  {
    key: "old-leads",
    name: "Old Leads",
    entryLabel: "Leads",
    hasMetaAds: false,
    client: {
      slug: "stonnex-roofing",
      name: "Stonnex Roofing",
      metaAdAccountId: "",
      ghlLocationId: LOCATION_ID,
      // This pipeline's own GHL creation date (dateAdded 2026-10-20T00:21:17Z,
      // confirmed via /opportunities/pipelines) — anchors its own Lifetime view.
      clientSince: "2026-10-20",
    },
    funnel: {
      pipelineName: "Old Leads",
      bookedStageNames: [
        "Appt Booked",
        "Appt Confirmed",
        "Appt Showed",
        "Waiting for Quote",
        "Quote Delivered",
        "Quote Closed",
        "Deposit Collected",
        "Job Completed",
        "Appt Cancelled",
        "No Show/Ghosting",
        "Quote Rejected",
      ],
      showStageNames: [
        "Appt Showed",
        "Quote Delivered",
        "Quote Closed",
        "Deposit Collected",
        "Job Completed",
        "Quote Rejected",
      ],
      noShowStageNames: ["No Show/Ghosting"],
      closedStageNames: ["Quote Closed", "Deposit Collected", "Job Completed"],
      notClosedStageNames: ["Quote Rejected"],
      disqualifiedStageNames: ["Dead Lead"],
      lostReasons: [
        {
          label: "Dead Lead",
          description: "No longer viable — unresponsive or explicitly not interested.",
          stageNames: ["Dead Lead"],
        },
        {
          label: "Long Term Nurture",
          description: "Not ready to buy yet — parked for future follow-up.",
          stageNames: ["Long Term Nurture"],
        },
        {
          label: "Out of Territory",
          description: "Outside the serviceable area.",
          stageNames: ["Out of Territory"],
        },
      ],
    },
  },
  {
    key: "meta-ads",
    name: "Meta Ads",
    entryLabel: "Leads",
    hasMetaAds: false,
    client: {
      slug: "stonnex-roofing",
      name: "Stonnex Roofing",
      metaAdAccountId: "",
      ghlLocationId: LOCATION_ID,
      // This pipeline's own GHL creation date (dateAdded 2026-10-07T01:56:09Z,
      // confirmed via /opportunities/pipelines) — anchors its own Lifetime view.
      clientSince: "2026-10-07",
    },
    funnel: {
      pipelineName: "Meta Ads",
      bookedStageNames: [
        "Appt Booked",
        "Appt Confirmed",
        "Appt Showed",
        "Waiting for Quote",
        "Quote Delivered",
        "Quote Closed",
        "Deposit Collected",
        "Job Completed",
        "Appt Cancelled",
        "No Show/Ghosting",
        "Quote Rejected",
      ],
      showStageNames: [
        "Appt Showed",
        "Quote Delivered",
        "Quote Closed",
        "Deposit Collected",
        "Job Completed",
        "Quote Rejected",
      ],
      noShowStageNames: ["No Show/Ghosting"],
      closedStageNames: ["Quote Closed", "Deposit Collected", "Job Completed"],
      notClosedStageNames: ["Quote Rejected"],
      disqualifiedStageNames: ["Dead Lead"],
      lostReasons: [
        {
          label: "Dead Lead",
          description: "No longer viable — unresponsive or explicitly not interested.",
          stageNames: ["Dead Lead"],
        },
        {
          label: "Long Term Nurture",
          description: "Not ready to buy yet — parked for future follow-up.",
          stageNames: ["Long Term Nurture"],
        },
        {
          label: "Out of Territory",
          description: "Outside the serviceable area.",
          stageNames: ["Out of Territory"],
        },
      ],
    },
  },
];

export function getStonnexPipeline(key: string): CallPipelineViewConfig | undefined {
  return stonnexPipelines.find((p) => p.key === key);
}

/** Earliest of both pipelines' own clientSince dates — anchors the Combined view's Lifetime period. */
export const stonnexCombinedSince = stonnexPipelines.reduce(
  (earliest, p) => (p.client.clientSince! < earliest ? p.client.clientSince! : earliest),
  stonnexPipelines[0].client.clientSince!
);
