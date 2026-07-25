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
    <div className="rounded-xl border border-slate-200 border-t-4 border-t-[#ffcf00] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#8a6d00]">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
    </div>
  );
}
