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
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#1e2128]">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white/90">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
          We couldn&apos;t load this report. Try again, or head back to all clients.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-6 w-full rounded-md bg-[#0067eb] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0052ba]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="mt-3 block text-sm font-medium text-slate-500 hover:text-[#0067eb] dark:text-white/55 dark:hover:text-[#ffcf00]"
        >
          ← All Clients
        </Link>
      </div>
    </div>
  );
}
