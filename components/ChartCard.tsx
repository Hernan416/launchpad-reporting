import { ACCENT_CLASSES, type Accent } from "@/lib/accents";

export function ChartCard({
  title,
  subtitle,
  accent = "blue",
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: Accent;
  children: React.ReactNode;
}) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-card dark:border-white/8 dark:bg-[#1e2128]">
      <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white/90">
        <span className={`size-1.5 shrink-0 rounded-full ${classes.dot}`} aria-hidden="true" />
        {title}
      </h3>
      {subtitle && <p className="mb-4 text-xs text-slate-400 dark:text-white/35">{subtitle}</p>}
      <div className="h-72 w-full">{children}</div>
    </div>
  );
}
