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
    <DashboardShell title="Launchpad AI — Todos los clientes">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Link
            key={client.slug}
            href={`/dashboard/${client.slug}`}
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {client.name}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Ver reporte →
            </p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
