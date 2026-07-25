export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      <div className="border-b border-slate-200 bg-white">
        <div className="h-1.5 bg-gradient-to-r from-[#0067eb] to-[#ffcf00]" />
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="h-6 w-64 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-1/3 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
