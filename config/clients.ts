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
    // Real pipeline "AI Quote Follow Up" — confirmed with the user 2026-07-16.
    customFunnel: {
      pipelineName: "AI Quote Follow Up",
      leadsSourceMatch: "VELUX",
      websiteLeadsSourceMatch: "website",
      quoteFollowUpStageNames: [
        "Active In Followup Sequence",
        "Call Attempted - No Answer",
        "Manual Follow Up Needed",
      ],
      quoteYesStageNames: ["Signed and closed"],
      quoteNoStageNames: ["Quote Declined"],
      reviewingStageNames: ["Spoke - Thinking/Reviewing", "Verbal Yes - Deposit Pending"],
      // "Shows" isn't tracked via calendar appointmentStatus here — it's a stage in a different
      // pipeline. Includes stages reached only after showing up (confirmed with the user 2026-07-16).
      showsPipelineName: "Website Leads",
      showsStageNames: ["Showed", "Need an Proposal", "Proposal sent/presented"],
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
