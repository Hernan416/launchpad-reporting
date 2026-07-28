import { ACCENT_CLASSES, type Accent } from "@/lib/accents";

export function ChartGridSkeleton({
  count = 2,
  accent = "blue",
}: {
  count?: number;
  accent?: Accent;
}) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1e2128]"
        >
          <div className={`h-4 w-1/3 rounded bg-slate-200 border-l-4 pl-3 dark:bg-white/10 ${classes.border}`} />
          <div className="mt-4 h-72 w-full rounded bg-slate-100 dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}
