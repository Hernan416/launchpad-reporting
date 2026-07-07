import type { ClientConfig } from "@/types";

/**
 * Non-secret per-client config. Secrets (Meta token, GHL agency key, user
 * passwords) live in env vars — see .env.example.
 */
export const clients: ClientConfig[] = [
  {
    slug: "excel-roofing",
    name: "Excel Roofing",
    metaAdAccountId: "act_REPLACE_ME",
    ghlLocationId: "REPLACE_ME",
  },
  {
    slug: "one-day-roofing",
    name: "One Day Roofing",
    metaAdAccountId: "act_REPLACE_ME",
    ghlLocationId: "REPLACE_ME",
  },
  {
    slug: "us-home-pro",
    name: "US Home Pro",
    metaAdAccountId: "act_REPLACE_ME",
    ghlLocationId: "REPLACE_ME",
  },
];

export function getClientBySlug(slug: string): ClientConfig | undefined {
  return clients.find((c) => c.slug === slug);
}
