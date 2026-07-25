// Brand palette sourced from golaunchpad.co (blue / black / gold), adapted
// for a light theme — gold gets a darkened text variant since the brand's
// bright #ffcf00 has poor contrast as text on a white background.
export type Accent = "blue" | "gold";

interface AccentClasses {
  border: string;
  text: string;
}

/** Tailwind classes per section accent — used by MetricCard, MetricGroup, ChartCard. */
export const ACCENT_CLASSES: Record<Accent, AccentClasses> = {
  blue: { border: "border-t-[#0067eb] border-l-[#0067eb]", text: "text-[#0067eb]" },
  gold: { border: "border-t-[#ffcf00] border-l-[#ffcf00]", text: "text-[#8a6d00]" },
};

/** Hex values for the same accents, for Recharts (SVG fill/stroke can't take Tailwind classes). */
export const ACCENT_HEX: Record<Accent, { strong: string; soft: string }> = {
  blue: { strong: "#0067eb", soft: "#5aa6ff" },
  gold: { strong: "#b8860b", soft: "#ffcf00" },
};

/** Shared Recharts theming for the light brand background. */
export const CHART_GRID_STROKE = "#e2e8f0";
export const CHART_TICK = { fontSize: 12, fill: "#64748b" };

/** Rotating palette for charts with a dynamic number of series (e.g. lead sources) — stays within the blue/gold/black brand family, using darker tones where needed for contrast on white. */
export const CHART_PALETTE = [
  "#0067eb", // blue
  "#b8860b", // gold (darkened for contrast)
  "#5aa6ff", // light blue
  "#1a1a1a", // black
  "#003d94", // dark blue
  "#ffcf00", // bright gold
];
