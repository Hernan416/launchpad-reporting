import Link from "next/link";
import type { CustomRange, Period } from "@/types";

export function PeriodToggle({
  slug,
  period,
  showLifetime = false,
  extraQuery = "",
  customRange,
}: {
  slug: string;
  period: Period;
  /** Only shown once a client has a clientSince date configured (see ClientConfig.clientSince) — otherwise there's no real anchor for "lifetime". */
  showLifetime?: boolean;
  /** Extra query string to preserve across period changes, e.g. "&pipeline=combined" for the Launchpad dashboard's pipeline toggle. Must start with "&". */
  extraQuery?: string;
  /** The currently-picked custom range, if any — reused as the Custom pill's own target so switching to another period and back to Custom doesn't lose the picked dates. Defaults to the trailing 30 days when never set. */
  customRange?: CustomRange;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = customRange?.from ?? new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultTo = customRange?.to ?? today;

  const options: { value: Period; label: string; href: string }[] = [
    { value: "7d", label: "Last 7 days", href: `/dashboard/${slug}?period=7d${extraQuery}` },
    { value: "month", label: "This Month", href: `/dashboard/${slug}?period=month${extraQuery}` },
    ...(showLifetime
      ? [{ value: "lifetime" as const, label: "Lifetime", href: `/dashboard/${slug}?period=lifetime${extraQuery}` }]
      : []),
    {
      value: "custom",
      label: "Custom",
      href: `/dashboard/${slug}?period=custom&from=${defaultFrom}&to=${defaultTo}${extraQuery}`,
    },
  ];

  return (
    <div className="inline-flex rounded-xl border border-border bg-white p-1 shadow-card dark:bg-[#1e2128]">
      {options.map((option) => {
        const active = option.value === period;
        return (
          <Link
            key={option.value}
            href={option.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 ${
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
