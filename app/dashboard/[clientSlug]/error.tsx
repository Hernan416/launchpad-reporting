"use client";

import { useEffect } from "react";
import Link from "next/link";

// Error boundaries must be Client Components. Next.js 16 renamed the retry
// callback from reset() to unstable_retry().
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] Report failed to render:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa] px-4 dark:bg-[#16181d]">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 text-center shadow-raised dark:bg-[#1e2128]">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white/90">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
          We couldn&apos;t load this report. Try again, or head back to all clients.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-6 w-full rounded-full bg-[#0067eb] px-3 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-snappy hover:bg-[#0052ba] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1e2128]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="mt-3 block rounded-sm text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-[#0067eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 dark:text-white/55 dark:hover:text-[#ffcf00]"
        >
          ← All Clients
        </Link>
      </div>
    </div>
  );
}
