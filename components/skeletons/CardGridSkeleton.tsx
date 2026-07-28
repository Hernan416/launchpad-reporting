import { ACCENT_CLASSES, type Accent } from "@/lib/accents";

export function CardGridSkeleton({
  count = 4,
  accent = "blue",
}: {
  count?: number;
  accent?: Accent;
}) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg border border-slate-200 border-t-4 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1e2128] ${classes.border}`}
        >
          <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-white/10" />
          <div className="mt-3 h-6 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}
