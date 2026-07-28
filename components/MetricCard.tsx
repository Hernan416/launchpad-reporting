import { ACCENT_CLASSES, type Accent } from "@/lib/accents";

export function MetricCard({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string;
  accent?: Accent;
}) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <div
      className={`rounded-lg border border-slate-200 border-t-4 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1e2128] dark:hover:bg-[#242832] ${classes.border}`}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-white/55">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${classes.text}`}>{value}</p>
    </div>
  );
}
