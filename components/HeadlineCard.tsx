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
    <div className="rounded-xl border border-slate-200 border-t-4 border-t-[#ffcf00] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:border-t-[#ffcf00] dark:bg-[#1e2128] dark:hover:bg-[#242832]">
      <p className="text-sm font-medium text-slate-500 dark:text-white/55">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#8a6d00] dark:text-[#ffcf00]">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-400 dark:text-white/35">{sublabel}</p>}
    </div>
  );
}
