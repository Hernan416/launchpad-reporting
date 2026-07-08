export type Role = "master" | "client";

export interface AppUser {
  email: string;
  passwordHash: string;
  role: Role;
  /** Required when role is "client". Must match a slug in config/clients.ts */
  clientSlug?: string;
  name?: string;
}

export interface ClientConfig {
  slug: string;
  name: string;
  metaAdAccountId: string;
  /** Meta action_type used as "lead" — varies per client's pixel/Lead Ads setup. */
  metaLeadActionType?: string;
  ghlLocationId: string;
  /** Calendars to pull booked appointments from (summed) — a client can run appointments across several calendars (e.g. per service line). */
  ghlCalendarIds?: string[];
  /** appointmentStatus value that counts as "showed". */
  ghlShowStatus?: string;
  /** Pipeline to read for sales-stage counts (quotes sent, closed). */
  ghlPipelineName?: string;
  ghlQuoteSentStageName?: string;
  ghlClosedStageName?: string;
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

export interface ClientReport {
  period: Period;
  updatedAt: string;
  meta: MetaMetrics;
  funnel: FunnelMetrics;
  sales: SalesMetrics;
  /** Populated when a data source (Meta/GHL) failed — shown as a banner instead of silently zeroing metrics. */
  warnings: string[];
}
