/**
 * Collapsible wrapper built on native <details>/<summary> — no client JS, no
 * "use client" needed, works inside a Server Component. Open by default
 * (per the user 2026-09-15: visible by default, collapsible on request).
 */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="mb-1 flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-90 dark:text-white/35"
          aria-hidden="true"
        >
          <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L10.94 10 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
        {title}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
