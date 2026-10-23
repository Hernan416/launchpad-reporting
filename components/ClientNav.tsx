import Link from "next/link";
import { clients as allClients } from "@/config/clients";
import type { ClientConfig } from "@/types";

export function ClientNav({
  currentSlug,
  clients = allClients,
  showAllClientsLink = true,
  showLaunchpadLink = true,
}: {
  currentSlug: string;
  /** Restrict the switcher to a subset of clients — used for a multi-client "client" role user (see AppUser.clientSlugs). Defaults to every client, which is correct for the master role. */
  clients?: ClientConfig[];
  /** "← All Clients" only makes sense for master, who can reach the full roster. */
  showAllClientsLink?: boolean;
  /** The internal Launchpad AI dashboard is admin-only — never shown to a "client" role user. */
  showLaunchpadLink?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-3">
      {showAllClientsLink && (
        <>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-sm text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-[#0067eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 dark:text-white/60 dark:hover:text-[#ffcf00]"
          >
            ← All Clients
          </Link>
          <span className="text-slate-300 dark:text-white/20">|</span>
        </>
      )}
      {clients.map((client) => (
        <Link
          key={client.slug}
          href={`/dashboard/${client.slug}`}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 ${
            client.slug === currentSlug
              ? "bg-[#0067eb] text-white"
              : "text-slate-600 hover:bg-black/[0.05] hover:text-[#0067eb] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-[#ffcf00]"
          }`}
        >
          {client.name}
        </Link>
      ))}
      {showLaunchpadLink && (
        <>
          <span className="text-slate-300 dark:text-white/20">|</span>
          {/* Admin-only internal account — not in config/clients.ts, so it's rendered here directly rather than via the clients.map above. See config/launchpad.ts and proxy.ts for why a "client" role user can never reach it. */}
          <Link
            href="/dashboard/launchpad-ai"
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 ${
              currentSlug === "launchpad-ai"
                ? "bg-[#0067eb] text-white"
                : "text-slate-600 hover:bg-black/[0.05] hover:text-[#0067eb] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-[#ffcf00]"
            }`}
          >
            Launchpad AI
          </Link>
        </>
      )}
    </div>
  );
}
