import type { ClientConfig } from "@/types";

/**
 * Non-secret per-client config. Secrets live in env vars — see .env.example.
 * Each client also needs a GHL Private Integration Token in env var
 * GHL_TOKEN_<SLUG_UPPER_SNAKE> (e.g. GHL_TOKEN_EXCEL_ROOFING) — see lib/ghl.ts.
 *
 * One Day Roofing still uses lib/ghl.ts's placeholder defaults for
 * ghlPipelineName/ghlQuoteSentStageNames/ghlClosedStageNames ("Sales
 * Pipeline" / "Quote Sent" / "Closed Won") — real pipeline/stage names not
 * yet confirmed for that client.
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
    //
    // Roofr is a distinct case (confirmed 2026-07-25): those leads go directly
    // into "AI Quote Follow Up" and never pass through "Website Leads" at all,
    // so they're tracked separately (directQuoteLeads) instead of being folded
    // into leadsBySource — checked against BOTH the contact's and the
    // opportunity's own source field, since Roofr-originated opportunities
    // don't reliably carry the source on one or the other.
    customFunnel: {
      pipelineName: "AI Quote Follow Up",
      showsPipelineName: "Website Leads",
      leadSources: [
        { key: "velux", label: "VELUX" },
        { key: "instantestimator", label: "Instant Estimator" },
        { key: "inboundcall", label: "Inbound Calls" },
        { key: "website", label: "Website" },
      ],
      defaultSourceLabel: "Website",
      directQuoteSourceMatch: "Roofr",
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
    // Real "Meta Ads" pipeline mapped via the GHL MCP 2026-07-27 (only pipeline
    // in use — "AI Quote Follow Up" also exists but has 0 opportunities and is
    // intentionally ignored, confirmed with the user). Single active service
    // line right now: kitchen cabinet refacing (a separate roofing survey is
    // defined in this location's custom fields but unused/legacy — confirmed
    // with the user, not a second live funnel to design around).
    //
    // There's no separate "quote sent" step here — the in-home visit itself
    // delivers the quote (the stage is literally named "Showed and Quoted"),
    // so quotesSent and the pipeline-based show count share the same stage
    // set: everyone who reached "Showed and Quoted" or any stage downstream
    // of it (they don't move backward out of this set once they're in it).
    //
    // Confirmed with the user: the pipeline stage is the reliable source for
    // show/no-show/cancelled — neither the calendar's own appointmentStatus
    // nor the "Customer Status" custom field are kept in sync (found stale in
    // concrete cases, e.g. an opportunity already at "Closed" whose calendar
    // event still said "confirmed"). ghlShowStatus is deliberately left unset
    // so getAppointmentStats uses ghlShowStageNames instead of calendar status.
    ghlPipelineName: "Meta Ads",
    ghlQuoteSentStageNames: [
      "Showed and Quoted",
      "In AI Quote Followup Sequence",
      "Closed",
      "Quote Rejected - Job Lost",
    ],
    ghlClosedStageNames: ["Closed"],
    ghlShowStageNames: [
      "Showed and Quoted",
      "In AI Quote Followup Sequence",
      "Closed",
      "Quote Rejected - Job Lost",
    ],
  },
];

export function getClientBySlug(slug: string): ClientConfig | undefined {
  return clients.find((c) => c.slug === slug);
}
