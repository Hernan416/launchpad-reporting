import { ACCENT_CLASSES, type Accent } from "@/lib/accents";

export function MetricGroup({
  title,
  caption,
  accent = "blue",
  children,
}: {
  title: string;
  /** Short explanatory line under the title — e.g. clarifying why two related metrics in this group don't have to add up. */
  caption?: string;
  accent?: Accent;
  children: React.ReactNode;
}) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <section>
      <h2
        className={`${caption ? "mb-1" : "mb-3"} border-l-4 pl-3 text-lg font-semibold text-slate-900 dark:text-white/90 ${classes.border}`}
      >
        {title}
      </h2>
      {caption && (
        <p className="mb-3 pl-3 text-xs text-slate-400 dark:text-white/35">{caption}</p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}
