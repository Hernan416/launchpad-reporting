import Link from "next/link";
import { clients } from "@/config/clients";

export function ClientNav({ currentSlug }: { currentSlug: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-6 py-3">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-700"
      >
        ← All Clients
      </Link>
      <span className="text-slate-300">|</span>
      {clients.map((client) => (
        <Link
          key={client.slug}
          href={`/dashboard/${client.slug}`}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            client.slug === currentSlug
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
          }`}
        >
          {client.name}
        </Link>
      ))}
    </div>
  );
}
