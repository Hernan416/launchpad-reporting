import type { Period } from "@/types";

export function ExportPdfButton({
  slug,
  period,
  extraQuery = "",
}: {
  slug: string;
  period: Period;
  /** Extra query string to append, e.g. "&pipeline=combined" for the Launchpad dashboard. Must start with "&". */
  extraQuery?: string;
}) {
  return (
    <a
      href={`/api/report-pdf/${slug}?period=${period}${extraQuery}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-card transition-[color,border-color,transform] duration-150 ease-snappy hover:border-[#0067eb] hover:text-[#0067eb] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067eb]/50 dark:bg-[#1e2128] dark:text-white/60 dark:hover:text-[#ffcf00]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
      </svg>
      Export PDF
    </a>
  );
}
