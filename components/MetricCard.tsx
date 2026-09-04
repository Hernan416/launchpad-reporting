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
    <div className="rounded-xl border border-black/[0.08] bg-white p-4 shadow-card transition duration-200 ease-snappy hover:-translate-y-0.5 hover:shadow-raised dark:border-white/8 dark:bg-[#1e2128] dark:hover:bg-[#242832]">
      <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-white/55">
        <span className={`size-1.5 shrink-0 rounded-full ${classes.dot}`} aria-hidden="true" />
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${classes.text}`}>{value}</p>
    </div>
  );
}
