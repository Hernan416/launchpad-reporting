import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { clients } from "@/config/clients";
import { DashboardShell } from "@/components/DashboardShell";

export const metadata = { title: "All Clients" };

export default async function MasterDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Defense in depth: proxy.ts already redirects "client" role users to
  // their own slug, but a page should never trust routing alone.
  if (session.user.role !== "master") {
    redirect(`/dashboard/${session.user.clientSlug}`);
  }

  return (
    <DashboardShell title="Launchpad AI — All Clients">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Link
            key={client.slug}
            href={`/dashboard/${client.slug}`}
            className="group rounded-xl border border-border bg-white p-5 shadow-card transition-[box-shadow,transform,border-color] duration-200 ease-snappy hover:-translate-y-0.5 hover:border-[#0067eb]/40 hover:shadow-raised active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 dark:bg-[#1e2128] dark:hover:border-[#0067eb]/50"
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-white/90">
              {client.name}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#0067eb] dark:text-[#4d9fff]">
              View report
              <span className="transition-transform duration-200 ease-snappy group-hover:translate-x-0.5">→</span>
            </p>
          </Link>
        ))}
        {/* Admin-only internal account — not in config/clients.ts, so it's added directly here rather than via the clients.map above. */}
        <Link
          href="/dashboard/launchpad-ai"
          className="group rounded-xl border border-border bg-white p-5 shadow-card transition-[box-shadow,transform,border-color] duration-200 ease-snappy hover:-translate-y-0.5 hover:border-[#0067eb]/40 hover:shadow-raised active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 dark:bg-[#1e2128] dark:hover:border-[#0067eb]/50"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-white/90">Launchpad AI</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#0067eb] dark:text-[#4d9fff]">
            View report
            <span className="transition-transform duration-200 ease-snappy group-hover:translate-x-0.5">→</span>
          </p>
        </Link>
      </div>
    </DashboardShell>
  );
}
