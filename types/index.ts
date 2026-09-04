export type Role = "master" | "client";

export interface AppUser {
  username: string;
  passwordHash: string;
  role: Role;
  /** Required when role is "client". Must match a slug in config/clients.ts */
  clientSlug?: string;
  name?: string;
}

export interface LeadSourceRule {
  /** Matched as a substring against the contact's `source` field, normalized (lowercased, separators stripped) — so "Instant_Estimator" / "Instant Estimator" / "instant-estimator" all match `key: "instantestimator"`. */
  key: string;
  label: string;
}

export interface LeadSourceCount {
  label: string;
  count: number;
}

export interface CustomFunnelConfig {
  /** Quote-follow-up pipeline — only leads who already got a quote sent end up here. */
  pipelineName: string;
  /** Leads/appointments pipeline — every incoming lead gets an opportunity here, regardless of how far they get. Its opportunity count is summed with pipelineName's to get total leads, since a lead can independently exist in both. */
  showsPipelineName: string;
  /** Known source patterns, checked in order; a contact source not matching any rule is shown under its own raw label instead of being dropped. */
  leadSources: LeadSourceRule[];
  /** Bucket for contacts with no source value at all. */
  defaultSourceLabel: string;
  /** Leads whose contact OR opportunity `source` matches this (e.g. "Roofr") go straight into pipelineName without ever passing through showsPipelineName — tracked as directQuoteLeads instead of being folded into leadsBySource. */
  directQuoteSourceMatch: string;
  quoteYesStageNames: string[];
  quoteNoStageNames: string[];
  reviewingStageNames: string[];
  /** Stage names within showsPipelineName. */
  bookedStageNames: string[];
  cancelledStageNames: string[];
  lostStageNames: string[];
}

export interface ClientConfig {
  slug: string;
  name: string;
  metaAdAccountId: string;
  /** Meta action_type used as "lead" — varies per client's pixel/Lead Ads setup. */
  metaLeadActionType?: string;
  /** Meta action_type used as "landing page views" for Funnel/Opt-in Rate — defaults to "landing_page_view". Override when a client's leads mostly come from Facebook Instant Forms (no landing page in the funnel), which makes leads exceed landing_page_view and Opt-in Rate go over 100%. */
  metaLandingPageViewActionType?: string;
  /** false for clients with no Meta Ads involvement — renders the GHL-only custom funnel dashboard instead of the standard report. Defaults to true. */
  showMetaAds?: boolean;
  ghlLocationId: string;
  /** Calendars to pull booked appointments from (summed) — a client can run appointments across several calendars (e.g. per service line). */
  ghlCalendarIds?: string[];
  /** appointmentStatus value that counts as "showed" — ignored when ghlShowStageNames is set. */
  ghlShowStatus?: string;
  /** Pipeline to read for sales-stage counts (quotes sent, closed, and — when ghlShowStageNames is set — shows). */
  ghlPipelineName?: string;
  /** Stage names counted as "quote sent" — plural because a status can span several downstream stages (e.g. a client whose quote is given at the same time as the visit, so "quoted" plus everything reached after it all count). */
  ghlQuoteSentStageNames?: string[];
  ghlClosedStageNames?: string[];
  /** When set, "shows" for the standard dashboard come from these stage names in ghlPipelineName (opportunities created within the period, current-stage snapshot) instead of the calendar's appointmentStatus field. Needed when a client's automation doesn't keep the calendar status reliably in sync with the real pipeline stage. */
  ghlShowStageNames?: string[];
  /** Used instead of the standard Meta+GHL report when showMetaAds is false. */
  customFunnel?: CustomFunnelConfig;
  /** ISO date (YYYY-MM-DD) this client started working with us — the anchor for the "lifetime" period. The Lifetime option in PeriodToggle is only shown when this is set. */
  clientSince?: string;
}

/** "month" is a real calendar month (the 1st through the 30th/31st of whichever month is current) — not a rolling 30 days. Changed 2026-08-05 per the user, so reports line up with an actual calendar/invoicing month. "custom" is a user-picked [from, to] range (inclusive both ends, see CustomRange) — added 2026-09-04. */
export type Period = "7d" | "month" | "lifetime" | "custom";

/** Explicit date-range boundaries for the "custom" period, both YYYY-MM-DD, inclusive on both ends (matches the date-picker UI and Meta's own time_range convention — no off-by-one adjustment needed there, unlike "month"). */
export interface CustomRange {
  from: string;
  to: string;
}

export interface MetaMetrics {
  spend: number;
  clicks: number;
  impressions: number;
  cpc: number;
  ctr: number;
  leads: number;
  costPerLead: number;
}

export interface FunnelMetrics {
  landingPageViews: number;
  optInRate: number;
  appointments: number;
  costPerAppointment: number;
}

export interface SalesMetrics {
  showRate: number;
  costPerShownAppt: number;
  quotesSent: number;
  closed: number;
  cac: number;
}

export interface HeadlineMetrics {
  revenueClosed: number;
  cac: number;
  roas: number;
  adSpend: number;
  costPerAppointment: number;
  revenueOpportunity: number;
  closeRate: number;
  closedCount: number;
  shownCount: number;
}

export interface WeeklyDataPoint {
  weekLabel: string;
  weekStart: string;
  adSpend: number;
  /** Raw click/impression counts, not just the derived cpc/ctr rates — needed to correctly roll several weeks up into a month's CPC/CTR (averaging weekly rates would be wrong; you have to sum the raw counts first). */
  clicks: number;
  impressions: number;
  leads: number;
  cpc: number;
  ctr: number;
  costPerLead: number;
  landingPageViews: number;
  optInRate: number;
  appointments: number;
  shows: number;
  showRate: number;
  costPerAppointment: number;
  costPerShownAppt: number;
  quotesSent: number;
  revenueOpportunity: number;
  closed: number;
  revenueClosed: number;
  closeRate: number;
  cac: number;
  roas: number;
}

export interface ClientReport {
  period: Period;
  updatedAt: string;
  headline: HeadlineMetrics;
  meta: MetaMetrics;
  funnel: FunnelMetrics;
  sales: SalesMetrics;
  /** Populated when a data source (Meta/GHL) failed — shown as a banner instead of silently zeroing metrics. */
  warnings: string[];
}

/** GHL-only report for clients with no Meta Ads involvement (see ClientConfig.customFunnel). */
export interface PipelineFunnelReport {
  period: Period;
  updatedAt: string;
  warnings: string[];
  totalLeads: number;
  leadsBySource: LeadSourceCount[];
  directQuoteLeads: number;
  quotesSent: number;
  quoteYes: number;
  quoteNo: number;
  reviewing: number;
  decisions: number;
  decisionRate: number;
  yesRate: number;
  noRate: number;
  appointmentsBooked: number;
  appointmentsCancelled: number;
  appointmentsLost: number;
}

export interface WeeklyPipelineDataPoint {
  weekLabel: string;
  weekStart: string;
  totalLeads: number;
  leadsBySource: LeadSourceCount[];
  directQuoteLeads: number;
  quotesSent: number;
  quoteYes: number;
  quoteNo: number;
  reviewing: number;
  decisions: number;
  decisionRate: number;
  yesRate: number;
  noRate: number;
  appointmentsBooked: number;
  appointmentsCancelled: number;
  appointmentsLost: number;
}

/**
 * Launchpad AI's own internal admin-only dashboard (config/launchpad.ts) —
 * a single GHL pipeline tracked call-center-style: every opportunity CREATED
 * is one call/contact made, current pipeline stage tells whether it turned
 * into a booked appointment, a show/no-show, and a close. Distinct from
 * CustomFunnelConfig because that shape assumes TWO pipelines (a quote
 * pipeline plus a separate booking pipeline) merged together — Launchpad's
 * two pipelines ("Roofing Ads 2026", "Cold Call Sales") are each already
 * self-contained, and are combined at the report level instead (see
 * getLaunchpadReport), not the stage-config level.
 */
export interface CallFunnelStageConfig {
  pipelineName: string;
  /** Every stage from "an appointment exists" onward, current-stage snapshot — mirrors ghlShowStageNames' "reached this far" convention. */
  bookedStageNames: string[];
  /** Showed up, regardless of what happened after (includes Not Closed/Closed, not just the "Showed" stage itself). */
  showStageNames: string[];
  noShowStageNames: string[];
  closedStageNames: string[];
  /** Showed up but didn't close — the equivalent of "Quote Rejected" at the roofing clients. */
  notClosedStageNames: string[];
}

export interface CallPipelineViewConfig {
  key: string;
  name: string;
  /** "Leads" for the ad-driven pipeline, "Calls Made" for the cold-calling one — same underlying number (opportunities created in the period), different label per view's vocabulary. */
  entryLabel: string;
  /** Reused purely as a vehicle for lib/ghl.ts's fetch plumbing (GHL_TOKEN_LAUNCHPAD_AI env var via slug, ghlLocationId, clientSince as this pipeline's own Lifetime anchor) — metaAdAccountId is only read when hasMetaAds is true. */
  client: ClientConfig;
  hasMetaAds: boolean;
  funnel: CallFunnelStageConfig;
}

export interface CallFunnelMetrics {
  callsMade: number;
  appointmentsBooked: number;
  shows: number;
  noShows: number;
  /** Shows ÷ (Shows + No-Shows) — excludes Cancelled/Territory Taken/Disqualified/etc., which never had a real appointment pending. */
  showRate: number;
  closed: number;
  notClosed: number;
  closeRate: number;
  closedRevenue: number;
}

export interface CallFunnelReport {
  period: Period;
  updatedAt: string;
  warnings: string[];
  metrics: CallFunnelMetrics;
  /** Absent for the Combined view (per the user 2026-09-04: no blended ad spend/CAC/ROAS, and Calls Made isn't shown there either — see components/sections/CallFunnelSnapshotSections.tsx). */
  meta?: MetaMetrics & { cac: number; roas: number };
}

export interface WeeklyCallFunnelDataPoint {
  weekLabel: string;
  weekStart: string;
  callsMade: number;
  appointmentsBooked: number;
  shows: number;
  noShows: number;
  showRate: number;
  closed: number;
  notClosed: number;
  closeRate: number;
  closedRevenue: number;
}
