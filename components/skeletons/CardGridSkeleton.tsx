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
          className="animate-pulse rounded-xl border border-black/[0.08] bg-white p-4 shadow-card dark:border-white/8 dark:bg-[#1e2128]"
        >
          <div className="flex items-center gap-1.5">
            <div className={`size-1.5 shrink-0 rounded-full opacity-40 ${classes.dot}`} />
            <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="mt-3 h-6 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}
