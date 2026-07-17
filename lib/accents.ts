export type Accent = "blue" | "cyan" | "indigo" | "emerald";

interface AccentClasses {
  border: string;
  text: string;
}

/** Tailwind classes per section accent — used by MetricCard, MetricGroup, ChartCard. */
export const ACCENT_CLASSES: Record<Accent, AccentClasses> = {
  blue: { border: "border-t-blue-600 border-l-blue-600", text: "text-blue-700" },
  cyan: { border: "border-t-cyan-600 border-l-cyan-600", text: "text-cyan-700" },
  indigo: { border: "border-t-indigo-600 border-l-indigo-600", text: "text-indigo-700" },
  emerald: { border: "border-t-emerald-600 border-l-emerald-600", text: "text-emerald-700" },
};

/** Hex values for the same accents, for Recharts (SVG fill/stroke can't take Tailwind classes). */
export const ACCENT_HEX: Record<Accent, { strong: string; soft: string }> = {
  blue: { strong: "#1d4ed8", soft: "#93c5fd" },
  cyan: { strong: "#0e7490", soft: "#67e8f9" },
  indigo: { strong: "#4338ca", soft: "#a5b4fc" },
  emerald: { strong: "#047857", soft: "#6ee7b7" },
};
