import type { ClientConfig } from "@/types";

/**
 * Non-secret per-client config. Secrets live in env vars — see .env.example.
 * Each client also needs a GHL Private Integration Token in env var
 * GHL_TOKEN_<SLUG_UPPER_SNAKE> (e.g. GHL_TOKEN_EXCEL_ROOFING) — see lib/ghl.ts.
 *
 * Every client below now has real pipeline/stage names mapped from its own
 * GHL account — lib/ghl.ts's "Sales Pipeline"/"Quote Sent"/"Closed Won"
 * defaults are unused placeholders at this point, kept only as a fallback
 * for a future client that hasn't been mapped yet.
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
    // Verified against real ad data 2026-07-28: most leads here come from
    // Facebook Instant Forms with no landing page in the funnel at all (30d:
    // 34 leads vs. only 10 landing_page_view), which pushed Opt-in Rate over
    // 100%. "link_click" (187 in the same window) is the best available
    // proxy for "reached the conversion surface" for this client.
    metaLandingPageViewActionType: "link_click",
    // Client's own start date with us, per the user 2026-08-05 — anchors the Lifetime period.
    clientSince: "2026-04-04",
    ghlLocationId: "6DiccF7Ccfm34ctwznt3",
    // In-Home Roof Estimate ("Testing" calendar excluded — 0 events, confirmed dummy)
    ghlCalendarIds: ["RyVQrAhULnwIxgCXH0uX"],
    // Mapped via direct GHL API calls 2026-07-28. This location has 7
    // pipelines, but only "Meta Ads" carries real sales data (58 opportunities
    // in 60d) — "AI Quote Follow Up" and "Website Leads" exist but are
    // completely unused (0 opportunities each, same dormant-legacy pattern as
    // Excel Roofing/US Home Pro's unused second pipeline), and the other four
    // "AI ... Tracking" pipelines are internal bot-orchestration plumbing (one
    // of them, "AI Setting Tracking", has 39 opportunities but mirrors the
    // same contacts already in "Meta Ads" — not a separate lead source).
    //
    // Same structure as US Home Pro's "Meta Ads" pipeline: showing up and
    // getting quoted are the same stage ("Showed and Quoted"), so quotesSent
    // and shows share one stage set. Verified the calendar's own
    // appointmentStatus is unreliable here too — cross-checked all 13
    // opportunities at or past "Showed and Quoted" against their calendar
    // event: only 6/13 actually said "showed" (rest were stale
    // confirmed/cancelled/invalid, one had no calendar event at all) — so
    // ghlShowStatus is deliberately left unset in favor of ghlShowStageNames.
    //
    // *** STALE as of 2026-08-17 — the client restructured this pipeline on
    // 2026-08-09 (confirmed via the GHL API's pipeline dateUpdated) into a
    // much longer, more granular stage list: New Application, Not Answering
    // + Unconfirmed, Appointment Booked, Appt Confirmed, Appt Showed - Quote
    // Requested, Waiting for Quote, Quote Delivered, Quote Closed, Deposit
    // Collected, Job Completed, Appt Cancelled, Quote Rejected - Job Lost,
    // No Show/Ghosting, Quote Rejected, Long Term Nurture, Dead Lead, Out of
    // Territory. "Showed and Quoted" and "In AI Quote Followup Sequence"
    // (below) no longer exist AT ALL, so ghlQuoteSentStageNames/
    // ghlShowStageNames are currently matching nothing real — quotesSent and
    // shows are silently wrong for this client until someone maps the new
    // stage list the same way JJ Roofing's Home Services Pipeline was
    // mapped (confirm with the user which of the new stages count as
    // "quoted" vs. "showed" before touching this — it's a business call, not
    // a mechanical rename like ghlClosedStageNames below was).
    //
    // ghlClosedStageNames WAS fixed 2026-08-17: "Closed" was renamed to
    // "Quote Closed" in the restructure (confirmed via real opportunities —
    // 3 won deals sitting exactly there). Also see isClosedInRange in
    // lib/ghl.ts (added same day): 2 of this client's real won deals were
    // found sitting in "Appt Confirmed" with status "won", never dragged to
    // a closed-looking stage — GHL's own opportunity status field is now
    // checked as a second, independent path to "closed" for every standard
    // client, not just this one.
    ghlPipelineName: "Meta Ads",
    ghlQuoteSentStageNames: [
      "Showed and Quoted",
      "In AI Quote Followup Sequence",
      "Closed",
      "Quote Rejected - Job Lost",
    ],
    ghlClosedStageNames: ["Quote Closed"],
    ghlShowStageNames: [
      "Showed and Quoted",
      "In AI Quote Followup Sequence",
      "Closed",
      "Quote Rejected - Job Lost",
    ],
  },
  {
    slug: "us-home-pro",
    name: "US Home Pro",
    metaAdAccountId: "act_1309927616632065",
    // Client's own start date with us, per the user 2026-08-05 — anchors the Lifetime period.
    clientSince: "2026-06-11",
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
  {
    slug: "jj-roofing",
    name: "JJ Roofing",
    metaAdAccountId: "act_1757690398122189",
    // Client's own start date with us, per the user 2026-08-05 (updated same
    // day to match the Meta ad account's actual creation date) — anchors the
    // Lifetime period.
    clientSince: "2025-03-01",
    ghlLocationId: "8ZAnZs0waICI9kZ8hE23",
    // Roof Estimates (in-person), MANUAL BOOKING - Roof Estimates (in-person)
    ghlCalendarIds: ["6DDI0zvqHt7fsZny08vB", "yh0U7Sv8J2J6dGfvRiqE"],
    // Originally mapped as "Home Services Pipeline" via direct GHL API calls
    // 2026-07-28 (single pipeline, single service line — roof
    // replacement/estimates).
    //
    // *** RENAMED 2026-08-09 — the client restructured this pipeline the
    // same day as One Day Roofing's "Meta Ads" pipeline (confirmed via the
    // GHL API's pipeline dateUpdated, 26 seconds apart — a coordinated,
    // account-wide change, not a coincidence). It's now also named "Meta
    // Ads". ghlPipelineName below was stale until 2026-08-17 — it matched no
    // real pipeline and was silently falling back to "the first pipeline in
    // the list" (see getSalesPipelineOpportunities in lib/ghl.ts), which
    // only worked because this location still has exactly one pipeline.
    // Fixed to reference the real name directly instead of relying on that
    // fallback. Unlike One Day Roofing's restructure, the stage NAMES here
    // mostly survived intact — only "Appt Showed - not moving forward" (below)
    // stopped existing (removed 2026-08-17, confirmed 0 opportunities sitting
    // there).
    //
    // Confirmed with the user, same finding as Excel Roofing/US Home Pro: the
    // calendar's own appointmentStatus isn't kept in sync with reality (e.g. a
    // contact already at "Quote Closed" still had a "confirmed" calendar
    // event, never updated to "showed") — ghlShowStatus is deliberately left
    // unset so getAppointmentStats uses ghlShowStageNames (pipeline-based)
    // instead.
    //
    // Unlike US Home Pro, showing up and getting a quote are two separate,
    // sequential stages here ("Appt Showed - Quote Requested" then later
    // "Quote Delivered"), so quotesSent and shows are different stage sets.
    // "Deposit Collected"/"Job Completed" are post-sale fulfillment stages of
    // an already-won deal, so they count as Closed same as "Quote Closed".
    //
    // "Long Term Nurture" was in ghlShowStageNames until 2026-08-17 (leads
    // who showed up but weren't ready to buy yet were still counted as
    // shown) — removed per the user that day: Long Term Nurture leads are no
    // longer counted toward Show Rate at all now, regardless of whether they
    // actually attended the appointment.
    ghlPipelineName: "Meta Ads",
    ghlQuoteSentStageNames: [
      "Quote Delivered",
      "Quote Closed",
      "Deposit Collected",
      "Job Completed",
      "Quote Rejected",
    ],
    ghlClosedStageNames: ["Quote Closed", "Deposit Collected", "Job Completed"],
    ghlShowStageNames: [
      "Appt Showed - Quote Requested",
      "Quote Delivered",
      "Quote Closed",
      "Deposit Collected",
      "Job Completed",
      "Quote Rejected",
    ],
  },
];

export function getClientBySlug(slug: string): ClientConfig | undefined {
  return clients.find((c) => c.slug === slug);
}
