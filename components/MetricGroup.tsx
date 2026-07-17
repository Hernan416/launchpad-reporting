import { ACCENT_CLASSES, type Accent } from "@/lib/accents";

export function MetricGroup({
  title,
  accent = "blue",
  children,
}: {
  title: string;
  accent?: Accent;
  children: React.ReactNode;
}) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <section>
      <h2
        className={`mb-3 border-l-4 pl-3 text-lg font-semibold text-slate-900 ${classes.border}`}
      >
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}
