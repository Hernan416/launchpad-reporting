import Link from "next/link";
import type { Period } from "@/types";

export function PeriodToggle({
  slug,
  period,
  showLifetime = false,
}: {
  slug: string;
  period: Period;
  /** Only shown once a client has a clientSince date configured (see ClientConfig.clientSince) — otherwise there's no real anchor for "lifetime". */
  showLifetime?: boolean;
}) {
  const options: { value: Period; label: string }[] = [
    { value: "7d", label: "Last 7 days" },
    { value: "month", label: "This Month" },
    ...(showLifetime ? [{ value: "lifetime" as const, label: "Lifetime" }] : []),
  ];

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-[#1e2128]">
      {options.map((option) => {
        const active = option.value === period;
        return (
          <Link
            key={option.value}
            href={`/dashboard/${slug}?period=${option.value}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#0067eb] text-white"
                : "text-slate-600 hover:text-[#0067eb] dark:text-white/60 dark:hover:text-[#ffcf00]"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
