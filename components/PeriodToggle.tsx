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
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
  ];

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {options.map((option) => {
        const active = option.value === period;
        return (
          <Link
            key={option.value}
            href={`/dashboard/${slug}?period=${option.value}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
