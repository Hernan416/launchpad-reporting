"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] Failed to render:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa] px-4 dark:bg-[#16181d]">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 text-center shadow-raised dark:bg-[#1e2128]">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white/90">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
          We couldn&apos;t load the client list. Try again.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-6 w-full rounded-full bg-[#0067eb] px-3 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-snappy hover:bg-[#0052ba] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1e2128]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
