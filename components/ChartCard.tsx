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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3
        className={`mb-1 border-l-4 pl-3 text-base font-semibold text-slate-900 ${classes.border}`}
      >
        {title}
      </h3>
      {subtitle && <p className="mb-4 pl-3 text-xs text-slate-400">{subtitle}</p>}
      <div className="h-72 w-full">{children}</div>
    </div>
  );
}
