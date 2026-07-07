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
  ghlLocationId: string;
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
}
