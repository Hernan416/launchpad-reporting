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
          className="animate-pulse rounded-2xl border border-black/[0.08] bg-white p-5 shadow-card dark:border-white/8 dark:bg-[#1e2128]"
        >
          <div className="flex items-center gap-2">
            <div className={`size-1.5 shrink-0 rounded-full opacity-40 ${classes.dot}`} />
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="mt-4 h-72 w-full rounded-lg bg-slate-100 dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}
