import type { ClientConfig } from "@/types";

/**
 * Non-secret per-client config. Secrets live in env vars — see .env.example.
 * Each client also needs a GHL Private Integration Token in env var
 * GHL_TOKEN_<SLUG_UPPER_SNAKE> (e.g. GHL_TOKEN_EXCEL_ROOFING) — see lib/ghl.ts.
 *
 * ghlPipelineName, ghlQuoteSentStageName and ghlClosedStageName are still
 * placeholder defaults from lib/ghl.ts ("Sales Pipeline" / "Quote Sent" /
 * "Closed Won") — real pipeline/stage names to be confirmed last.
 */
export const clients: ClientConfig[] = [
  {
    slug: "excel-roofing",
    name: "Excel Roofing",
    metaAdAccountId: "act_1164351498761758",
    showMetaAds: false,
    ghlLocationId: "ZwyTAT8frtRejAQJdN5N",
    // Roof Replacement (Phone Call), All Services - In Person Consultations, Solar Phone Call Consultation
    ghlCalendarIds: [
      "MdpLRKvG9AoXdElZmmIw",
      "anHriWCEkHN3JJJ3g5qI",
      "f497SNJc1NkpQzyAMliB",
    ],
    // Real "AI Quote Follow Up" pipeline flow, confirmed with the user 2026-07-17
    // (full stage-by-stage business logic, not a guess):
    // - Opportunity created at "Proposal Just Sent" when quote follow-up starts,
    //   then settles at "Active In Followup Sequence" once the bot is actively
    //   working it — "Quotes Sent" = every opportunity ever created here,
    //   regardless of current stage.
    // - "Spoke - Thinking/Reviewing": sales team marks this when the client says
    //   they're still thinking it over.
    // - "Verbal Yes - Deposit Pending": lead said yes (tag quote_accepted) but
    //   hasn't actually signed yet. Deliberately NOT counted as Quote-Yes
    //   (confirmed) — only "Signed and closed" (tag quote_signed, set once
    //   actually signed in Roofr) counts as a real close.
    // - "Call Attempted - No Answer" and "Manual Follow Up Needed" are confirmed
    //   UNUSED stages (legacy), same as "Unresponsive - Sequence Finished" (the
    //   36-day timeout stage) — none of the three feed any dashboard column.
    //
    // Leads are tracked across BOTH pipelines (confirmed 2026-07-24): a lead can
    // independently exist in "Website Leads" (booking an appointment to get a
    // quote) and in "AI Quote Follow Up" (already got the quote) — their counts
    // are summed, not deduplicated, to get total leads and the source breakdown.
    // Contacts with no source at all are assumed to be from the website.
    customFunnel: {
      pipelineName: "AI Quote Follow Up",
      showsPipelineName: "Website Leads",
      leadSources: [
        { key: "velux", label: "VELUX" },
        { key: "instantestimator", label: "Instant Estimator" },
        { key: "inboundcall", label: "Inbound Calls" },
        { key: "roofr", label: "Roofr" },
        { key: "website", label: "Website" },
      ],
      defaultSourceLabel: "Website",
      quoteYesStageNames: ["Signed and closed"],
      quoteNoStageNames: ["Quote Declined"],
      reviewingStageNames: ["Spoke - Thinking/Reviewing"],
      // Real "Website Leads" stage names confirmed via the GHL API 2026-07-24.
      bookedStageNames: ["Appointment Booked"],
      cancelledStageNames: ["Cancelled"],
      lostStageNames: ["Lost"],
    },
  },
  {
    slug: "one-day-roofing",
    name: "One Day Roofing",
    metaAdAccountId: "act_1611642193294442",
    ghlLocationId: "6DiccF7Ccfm34ctwznt3",
    // In-Home Roof Estimate
    ghlCalendarIds: ["RyVQrAhULnwIxgCXH0uX"],
  },
  {
    slug: "us-home-pro",
    name: "US Home Pro",
    metaAdAccountId: "act_1309927616632065",
    ghlLocationId: "ZamGgQEEEFmbnEaCE2ru",
    // Manual Booking, Free Design Visit Appointment
    ghlCalendarIds: ["eYnFUn36MWEDuyv5BPq6", "jOlkgFgxZinYvHUWo7uq"],
  },
];

export function getClientBySlug(slug: string): ClientConfig | undefined {
  return clients.find((c) => c.slug === slug);
}
