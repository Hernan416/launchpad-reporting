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
}

export type Period = "7d" | "30d";

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
