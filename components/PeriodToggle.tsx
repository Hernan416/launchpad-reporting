import Link from "next/link";
import type { Period } from "@/types";

export function PeriodToggle({
  slug,
  period,
}: {
  slug: string;
  period: Period;
}) {
  const options: { value: Period; label: string }[] = [
    { value: "7d", label: "Últimos 7 días" },
    { value: "30d", label: "Últimos 30 días" },
  ];

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
      {options.map((option) => {
        const active = option.value === period;
        return (
          <Link
            key={option.value}
            href={`/dashboard/${slug}?period=${option.value}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
