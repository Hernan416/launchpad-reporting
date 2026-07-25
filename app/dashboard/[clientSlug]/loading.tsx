import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";

// Next auto-wraps page.tsx in a Suspense boundary using this as the
// fallback, shown instantly on navigation before the page even starts
// its own (fast) auth/lookup work.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      <div className="border-b border-slate-200 bg-white">
        <div className="h-1.5 bg-gradient-to-r from-[#0067eb] to-[#ffcf00]" />
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-200" />
        <CardGridSkeleton count={4} accent="blue" />
      </main>
    </div>
  );
}
