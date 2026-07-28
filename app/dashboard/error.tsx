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
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#1e2128]">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white/90">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
          We couldn&apos;t load the client list. Please try again.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-6 w-full rounded-md bg-[#0067eb] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0052ba]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
