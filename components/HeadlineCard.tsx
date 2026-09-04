export function HeadlineCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-card transition duration-200 ease-snappy hover:-translate-y-0.5 hover:shadow-raised dark:border-white/8 dark:bg-[#1e2128] dark:hover:bg-[#242832]">
      <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-white/55">
        <span className="size-1.5 shrink-0 rounded-full bg-[#b8860b] dark:bg-[#ffcf00]" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums text-[#8a6d00] dark:text-[#ffcf00]">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-400 dark:text-white/35">{sublabel}</p>}
    </div>
  );
}
