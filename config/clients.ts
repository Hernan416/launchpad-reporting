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
    //
    // *** RESTRUCTURED AGAIN 2026-09-01 — same coordinated, account-wide
    // change as JJ Roofing and US Home Pro that day (all three pipelines'
    // dateUpdated within ~2.5 hours of each other). ghlQuoteSentStageNames/
    // ghlShowStageNames below were stale from 2026-08-09 until fixed
    // 2026-09-03 — "Showed and Quoted"/"In AI Quote Followup Sequence"/
    // "Closed" haven't existed since 2026-08-09, and stayed unfixed pending
    // a business-logic call (see JJ Roofing's 2026-08-09 comment above — a
    // 15+ stage pipeline needs a human decision on what counts as
    // quoted/shown, not a mechanical rename). Now mapped to match JJ
    // Roofing's (already-confirmed) logic one-for-one, since GHL's own
    // per-stage `originId` field proves this is literally the same pipeline
    // template pushed to all three accounts. One difference from JJ
    // Roofing: this pipeline additionally has a "Quote Rejected - Job Lost"
    // stage alongside "Quote Rejected" (JJ Roofing only has the latter) —
    // both have real opportunities with populated monetaryValue (i.e. both
    // represent "got a real quote, then rejected it"), so both are included
    // everywhere "Quote Rejected" is. "Long Term Nurture" is excluded from
    // ghlShowStageNames for the same reason as JJ Roofing (confirmed
    // 2026-08-17): a lead parked there shouldn't count toward Show Rate.
    ghlPipelineName: "Meta Ads",
    ghlQuoteSentStageNames: [
      "Quote Delivered",
      "Quote Closed",
      "Deposit Collected",
      "Job Completed",
      "Quote Rejected",
      "Quote Rejected - Job Lost",
    ],
    ghlClosedStageNames: ["Quote Closed", "Deposit Collected", "Job Completed"],
    ghlShowStageNames: [
      "Appt Showed - Quote Requested",
      "Quote Delivered",
      "Quote Closed",
      "Deposit Collected",
      "Job Completed",
      "Quote Rejected",
      "Quote Rejected - Job Lost",
    ],
    // Confirmed with the user 2026-09-15: "In-Home Roof Estimate" is the
    // self-serve booking widget calendar — this pipeline has no separate
    // "Assisted Booking" calendar the way JJ Roofing/US Home Pro/Osland/
    // McGuire do, so every booked appointment here counts as self-booked.
    selfBookedCalendarIds: ["RyVQrAhULnwIxgCXH0uX"],
    // No dedicated "Disqualified" stage exists in this template — "Dead
    // Lead" is the closest equivalent (never converted / not viable).
    ghlDisqualifiedStageNames: ["Dead Lead"],
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
  {
    slug: "us-home-pro",
    name: "US Home Pro",
    metaAdAccountId: "act_1309927616632065",
    // Client's own start date with us, per the user 2026-08-05 — anchors the Lifetime period.
    clientSince: "2026-06-11",
    ghlLocationId: "ZamGgQEEEFmbnEaCE2ru",
    // Manual Booking, Free Design Visit Appointment
    ghlCalendarIds: ["eYnFUn36MWEDuyv5BPq6", "jOlkgFgxZinYvHUWo7uq"],
    // Originally mapped via the GHL MCP 2026-07-27 as a single-pipeline,
    // simple 4-stage flow: showing up and getting quoted were the same
    // event ("Showed and Quoted"), so quotesSent and shows shared one stage
    // set (see the old comment this replaced, preserved in git history at
    // config/clients.ts if needed).
    //
    // *** REPLACED ENTIRELY 2026-09-01 — same coordinated, account-wide
    // pipeline change as JJ Roofing and One Day Roofing that day. This
    // wasn't a rename like the others; the ENTIRE pipeline was swapped for
    // JJ Roofing's 15+ stage structure (New Application, Attempted Contact
    // (No Booking), Appointment Booked, Appt Confirmed, Appt Showed - Quote
    // Requested, Waiting for Quote, Quote Delivered, Quote Closed, Deposit
    // Collected, Job Completed, Appt Cancelled, Quote Rejected - Job Lost,
    // No Show/Ghosting, Quote Rejected, Long Term Nurture, Dead Lead) —
    // confirmed via GHL's per-stage `originId` field, which every one of
    // these new stages has, pointing back to a shared template; JJ
    // Roofing's own stages have no originId at all, meaning JJ Roofing is
    // the template source. Single active service line (kitchen cabinet
    // refacing) is unaffected by this — it's purely a pipeline-stage
    // change.
    //
    // Mapped identically to JJ Roofing/One Day Roofing's now-confirmed
    // logic (same template = same business meaning per stage): quotesSent/
    // closed/shows all follow the same stage sets. ghlShowStatus stays
    // unset — same reasoning as before (calendar appointmentStatus isn't
    // reliable), now via ghlShowStageNames' pipeline-stage logic instead of
    // the old 4-stage set.
    //
    // *** "Quote Rejected - Job Lost" REMOVED 2026-09-03 — the client
    // deleted this stage from the live pipeline that day (confirmed via the
    // GHL API: the stage ID no longer exists) and merged its opportunities
    // into "Quote Rejected" via GHL's own UI. Verified this reassignment
    // was already complete and correct on GHL's side before touching
    // anything here — every one of this client's 48 opportunities points to
    // a still-valid current stage ID, zero orphans — so nothing needed
    // moving. This is a pure config cleanup: the string "Quote Rejected -
    // Job Lost" can never match a real stage again, so it's removed rather
    // than left as harmless-but-dead. (Same change was made to One Day
    // Roofing's live pipeline the same day, per the user — its config still
    // has the entry as of this comment; ask before touching it, since the
    // user scoped this cleanup to US Home Pro only.)
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
    // Confirmed with the user 2026-09-15: despite the name, "Assisted
    // Booking" (eYnFUn36MWEDuyv5BPq6, already in ghlCalendarIds above) is the
    // rep-assisted calendar, NOT self-booked — "Free Kitchen Remodel
    // Appointment" is the real self-serve widget one.
    selfBookedCalendarIds: ["jOlkgFgxZinYvHUWo7uq"],
    // No dedicated "Disqualified" stage exists in this template — "Dead
    // Lead" is the closest equivalent (never converted / not viable).
    ghlDisqualifiedStageNames: ["Dead Lead"],
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
        // Real stage name here is lowercase "territory" — confirmed via the
        // GHL API 2026-09-15, unlike every other client's "Out of Territory".
        stageNames: ["Out of territory"],
      },
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
    // Confirmed with the user 2026-09-15: despite the name, "Assisted
    // Booking" (yh0U7Sv8J2J6dGfvRiqE, already in ghlCalendarIds above) is the
    // rep-assisted calendar, NOT self-booked — "Roof Estimates (in-person)"
    // is the real self-serve widget one.
    selfBookedCalendarIds: ["6DDI0zvqHt7fsZny08vB"],
    // No dedicated "Disqualified" stage exists in this template — "Dead
    // Lead" is the closest equivalent (never converted / not viable).
    ghlDisqualifiedStageNames: ["Dead Lead"],
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
  {
    slug: "osland-roofing",
    name: "Osland Roofing",
    metaAdAccountId: "act_1221978998703447",
    // Client's own start date with us, per the user 2026-09-04.
    clientSince: "2026-08-31",
    ghlLocationId: "nCEHlfXdchVCeaz1sIBp",
    // Mapped 2026-09-04 via direct GHL API calls. Brand new account (pipeline
    // created 2026-08-23, only 3 opportunities total at mapping time) — this
    // config is based on matching JJ Roofing's already-confirmed template
    // one-for-one (same "Meta Ads" pipeline, same stage set) rather than on
    // deep cross-referencing against real data, since there isn't enough
    // volume yet to validate assumptions the way it was done for the other
    // clients. Revisit once real volume builds up.
    //
    // Two real calendars exist: "MANUAL BOOKING - In-Person Roof
    // Inspections" and "In-person Roof Inspection" (the self-serve booking
    // widget one — confirmed as the real one via an actual opportunity's
    // attribution data, mediumId matching this calendar's ID). *** BOTH
    // currently show 0 events even over a wide past+future window despite
    // a live opportunity sitting at "Appt Booked" — either nothing's been
    // booked yet, or this Private Integration Token may be missing the
    // Calendars read scope. Ask the user to double-check that scope if
    // appointments/shows read as zero once real leads start booking.
    //
    // Stage set is JJ Roofing's exact template, with one real naming
    // difference: this pipeline's show-stage is called "Appt Showed" (no
    // "- Quote Requested" suffix). It also has an extra stage, "Needs Follow
    // Up", not present in any other client's pipeline — left out of every
    // stage-name list below since its business meaning hasn't been
    // confirmed yet (ask the user once it starts getting used).
    ghlCalendarIds: ["0MKvdysMQ3Zjsx2l4EHT", "IaCz8mmxNtzejVfZYW3N"],
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
      "Appt Showed",
      "Quote Delivered",
      "Quote Closed",
      "Deposit Collected",
      "Job Completed",
      "Quote Rejected",
    ],
    // Confirmed with the user 2026-09-15: despite the name, "Assisted
    // Booking" (0MKvdysMQ3Zjsx2l4EHT, already in ghlCalendarIds above) is the
    // rep-assisted calendar, NOT self-booked — "In-person Roof Inspection"
    // is the real self-serve widget one (this is the same calendar the old
    // comment above already identified as "the self-serve booking widget
    // one" back when it was still named "MANUAL BOOKING - In-Person Roof
    // Inspections" — only the display name changed).
    selfBookedCalendarIds: ["IaCz8mmxNtzejVfZYW3N"],
    // No dedicated "Disqualified" stage exists in this template — "Dead
    // Lead" is the closest equivalent (never converted / not viable). "Needs
    // Follow Up" still excluded (see comment above — meaning unconfirmed).
    ghlDisqualifiedStageNames: ["Dead Lead"],
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
  {
    slug: "mcguire-roofing",
    name: "McGuire Roofing",
    metaAdAccountId: "act_966629862503342",
    // Client's own start date with us, per the user 2026-09-04.
    clientSince: "2026-09-03",
    ghlLocationId: "fXAFPRrS3OxhfgO1or7L",
    // Mapped 2026-09-04 via direct GHL API calls. This location also has two
    // OTHER pipelines ("Repairs", "Organic Re-Roof") for non-Meta-Ads lead
    // sources — ignored here, same as every other client's dormant
    // secondary pipelines. The "Meta Ads" pipeline itself was created the
    // SAME DAY as this mapping (2026-09-03) with 0 opportunities in it yet —
    // its `originId` on every stage points back to Osland Roofing's "Meta
    // Ads" pipeline ID, confirming Osland's structure was used as the
    // template to build this one. Config below mirrors Osland/JJ Roofing's
    // template one-for-one; there is currently ZERO real data to validate
    // any of it against, so treat every assumption here as provisional
    // until real leads start flowing through.
    //
    // Three calendars exist: "SDR Calendar" (excluded — looks internal/rep-
    // facing, not client-appointment-facing, but unconfirmed), "Testing"
    // (excluded — same dummy-calendar pattern seen at other clients), and
    // "In-Home Roof Estimate" (included — matches the real-calendar naming
    // convention used at JJ Roofing/One Day Roofing). *** All three show 0
    // events even over a wide past+future window — same
    // possibly-missing-Calendars-scope concern as Osland above.
    //
    // Same "Needs Follow Up" extra stage as Osland (business meaning
    // unconfirmed, left out of every list below) and the same "Appt Showed"
    // naming (no "- Quote Requested" suffix).
    ghlCalendarIds: ["uODbVmNBqFAzTx7hKpDu"],
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
      "Appt Showed",
      "Quote Delivered",
      "Quote Closed",
      "Deposit Collected",
      "Job Completed",
      "Quote Rejected",
    ],
    // Confirmed with the user 2026-09-15: this account now also has its own
    // "Assisted Booking" calendar (rep-assisted, not tracked in
    // ghlCalendarIds above), so the single calendar already tracked here
    // ("In-Home Roof Estimate") is the self-serve widget one — every booked
    // appointment we count here counts as self-booked.
    selfBookedCalendarIds: ["uODbVmNBqFAzTx7hKpDu"],
    // No dedicated "Disqualified" stage exists in this template — "Dead
    // Lead" is the closest equivalent (never converted / not viable). "Needs
    // Follow Up" still excluded (see comment above — meaning unconfirmed).
    ghlDisqualifiedStageNames: ["Dead Lead"],
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
];

export function getClientBySlug(slug: string): ClientConfig | undefined {
  return clients.find((c) => c.slug === slug);
}
