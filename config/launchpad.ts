import type { CallPipelineViewConfig, TaggedContactViewConfig } from "@/types";

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
      // Confirmed with the user 2026-09-14: "Application Disqualified" (added
      // to this pipeline ~2026-09-06) is a separate, earlier disqualification
      // point from "Disqualified" — both count toward Disqualified Rate.
      disqualifiedStageNames: ["Application Disqualified", "Disqualified"],
      lostReasons: [
        {
          label: "Disqualified",
          description: "Didn't meet basic criteria — disqualified before or after contact.",
          stageNames: ["Application Disqualified", "Disqualified"],
        },
        {
          label: "Invalid Lead",
          description: "Bad contact info — fake number, duplicate, or unreachable data.",
          stageNames: ["Invalid Lead"],
        },
        {
          label: "Territory Taken",
          description: "Outside the serviceable area, or already claimed by another rep.",
          stageNames: ["Territory Taken"],
        },
        {
          label: "Unreachable",
          description: "Never got the lead on the phone after repeated attempts.",
          stageNames: ["Unreachable"],
        },
        {
          label: "Long Term Nurture",
          description: "Not ready to buy yet — parked for future follow-up.",
          stageNames: ["Long Term Nurture"],
        },
      ],
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
      // Confirmed with the user 2026-10-09: this pipeline's "2nd call"
      // stage is named "2nd Closing Call" (verified via the GHL API against
      // the real "Roofing Ads 2026" pipeline, id wb3Uw4SBcCSexZsJgoDi).
      secondCallBookingStageNames: ["2nd Closing Call"],
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
      disqualifiedStageNames: ["Disqualified"],
      lostReasons: [
        {
          label: "Disqualified",
          description: "Didn't meet basic criteria for the offer.",
          stageNames: ["Disqualified"],
        },
        {
          label: "Dead Lead",
          description: "No longer viable — unresponsive or explicitly not interested.",
          stageNames: ["Dead lead"],
        },
        {
          label: "Territory Taken",
          description: "Outside the serviceable area, or already claimed by another rep.",
          stageNames: ["Territory Taken"],
        },
        {
          label: "Long Term Nurture",
          description: "Not ready to buy yet — parked for future follow-up.",
          stageNames: ["Long Term Nurture"],
        },
      ],
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
      // Confirmed with the user 2026-10-09: this pipeline's "2nd call"
      // stage is named "2nd Call Booked" (verified via the GHL API against
      // the real "Cold Call Sales" pipeline, id wW0qN1WKd5umPopC6T1k).
      secondCallBookingStageNames: ["2nd Call Booked"],
    },
  },
];

export function getLaunchpadPipeline(key: string): CallPipelineViewConfig | undefined {
  return launchpadPipelines.find((p) => p.key === key);
}

/**
 * Separate GHL sub-account ("Learn with LaunchPad" — confirmed via the GHL
 * API 2026-09-28), tracking Skool community members whose signup came
 * through a ManyChat automation (tagged "Manychat_automation" on join).
 * Not a real pipeline — no opportunities/stages involved, just a tagged-
 * contact count — so it's kept separate from launchpadPipelines entirely
 * and NOT included in the Combined view (nothing to sum it with).
 *
 * Confirmed with the user 2026-09-28: at setup time, no contact in this
 * account had this tag yet (the only tag in use was "new-member-zap", 70
 * contacts, an unrelated Zapier automation) — the ManyChat automation is
 * presumably new/not yet live. clientSince is this feature's own setup
 * date, not tied to any real "first tagged contact" (there isn't one yet).
 */
export const skoolManychatView: TaggedContactViewConfig = {
  key: "skool-manychat",
  name: "Skool (ManyChat)",
  label: "Skool Members via ManyChat",
  // GHL lowercases every tag on save — confirmed 2026-09-28 with a real test
  // tag: the user applied "Manychat_automation" in the GHL UI, but the API
  // stored (and only matches on) "manychat_automation".
  tag: "manychat_automation",
  client: {
    slug: "skool-manychat",
    name: "Skool (ManyChat)",
    metaAdAccountId: "",
    ghlLocationId: "ObaoiWSbrXH1bTtPsoe4",
    clientSince: "2026-09-28",
  },
};

/** Earliest of both pipelines' own clientSince dates — anchors the Combined view's Lifetime period. */
export const launchpadCombinedSince = launchpadPipelines.reduce(
  (earliest, p) => (p.client.clientSince! < earliest ? p.client.clientSince! : earliest),
  launchpadPipelines[0].client.clientSince!
);
