export type Role = "master" | "client";

export interface AppUser {
  email: string;
  passwordHash: string;
  role: Role;
  /** Required when role is "client". Must match a slug in config/clients.ts */
  clientSlug?: string;
  name?: string;
}

export interface CustomFunnelConfig {
  pipelineName: string;
  /** Case-insensitive substring match against the opportunity's contact's `source` field. */
  leadsSourceMatch: string;
  websiteLeadsSourceMatch: string;
  quoteFollowUpStageNames: string[];
  quoteYesStageNames: string[];
  quoteNoStageNames: string[];
  reviewingStageNames: string[];
  /** "Shows" are tracked as a stage in a different pipeline than the one above. */
  showsPipelineName: string;
  showsStageNames: string[];
}

export interface ClientConfig {
  slug: string;
  name: string;
  metaAdAccountId: string;
  /** Meta action_type used as "lead" — varies per client's pixel/Lead Ads setup. */
  metaLeadActionType?: string;
  /** false for clients with no Meta Ads involvement — renders the GHL-only custom funnel dashboard instead of the standard report. Defaults to true. */
  showMetaAds?: boolean;
  ghlLocationId: string;
  /** Calendars to pull booked appointments from (summed) — a client can run appointments across several calendars (e.g. per service line). */
  ghlCalendarIds?: string[];
  /** appointmentStatus value that counts as "showed". */
  ghlShowStatus?: string;
  /** Pipeline to read for sales-stage counts (quotes sent, closed). */
  ghlPipelineName?: string;
  ghlQuoteSentStageName?: string;
  ghlClosedStageName?: string;
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
  leads: number;
  websiteLeads: number;
  quoteFollowUp: number;
  quotesSent: number;
  revenueOpportunity: number;
  reviewing: number;
  decisions: number;
  quoteYes: number;
  quoteNo: number;
  revenueClosed: number;
  decisionRate: number;
  yesRate: number;
  noRate: number;
  appointments: number;
  shows: number;
  showRate: number;
  closeRate: number;
}

export interface WeeklyPipelineDataPoint {
  weekLabel: string;
  weekStart: string;
  leads: number;
  websiteLeads: number;
  quoteFollowUp: number;
  quotesSent: number;
  revenueOpportunity: number;
  reviewing: number;
  decisions: number;
  quoteYes: number;
  quoteNo: number;
  revenueClosed: number;
  decisionRate: number;
  yesRate: number;
  noRate: number;
  shows: number;
}
