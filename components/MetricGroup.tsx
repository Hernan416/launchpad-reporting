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
      <h2 className={`${caption ? "mb-1" : "mb-3"} flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white/90`}>
        <span className={`size-2 shrink-0 rounded-full ${classes.dot}`} aria-hidden="true" />
        {title}
      </h2>
      {caption && (
        <p className="mb-3 pl-4 text-xs text-slate-400 dark:text-white/35">{caption}</p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}
