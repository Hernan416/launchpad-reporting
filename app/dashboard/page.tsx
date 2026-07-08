import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { clients } from "@/config/clients";
import { DashboardShell } from "@/components/DashboardShell";

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
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:border-blue-300 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-slate-900">
              {client.name}
            </p>
            <p className="mt-1 text-sm font-medium text-blue-600">
              View report →
            </p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
