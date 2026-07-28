// Brand palette sourced from golaunchpad.co (blue / black / gold). Chart
// colors reference CSS custom properties (defined per-theme in globals.css)
// instead of literal hex, so Recharts SVGs follow the active theme without
// each chart component needing to know which one is active.
export type Accent = "blue" | "gold";

interface AccentClasses {
  border: string;
  text: string;
}

/**
 * Tailwind classes per section accent — used by MetricCard, MetricGroup,
 * ChartCard. The repeated dark:border-t and dark:border-l entries are
 * load-bearing, not redundant: cards also carry a blanket
 * dark:border-white/10 for their other two sides, and since both are dark:
 * utilities in the same cascade layer, only an explicit same-layer per-side
 * override reliably beats it.
 */
export const ACCENT_CLASSES: Record<Accent, AccentClasses> = {
  blue: {
    border: "border-t-[#0067eb] border-l-[#0067eb] dark:border-t-[#0067eb] dark:border-l-[#0067eb]",
    text: "text-[#0067eb] dark:text-[#4d9fff]",
  },
  gold: {
    border: "border-t-[#ffcf00] border-l-[#ffcf00] dark:border-t-[#ffcf00] dark:border-l-[#ffcf00]",
    text: "text-[#8a6d00] dark:text-[#ffcf00]",
  },
};

/** CSS-variable-backed values for the same accents, for Recharts (SVG fill/stroke can't take Tailwind classes). */
export const ACCENT_HEX: Record<Accent, { strong: string; soft: string }> = {
  blue: { strong: "var(--chart-blue-strong)", soft: "var(--chart-blue-soft)" },
  gold: { strong: "var(--chart-gold-strong)", soft: "var(--chart-gold-soft)" },
};

/** Shared Recharts theming — reads the active theme's CSS variables. */
export const CHART_GRID_STROKE = "var(--chart-grid)";
export const CHART_TICK = { fontSize: 12, fill: "var(--chart-tick)" };
export const CHART_NEUTRAL = "var(--chart-neutral)";

/** Rotating palette for charts with a dynamic number of series (e.g. lead sources) — stays within the blue/gold/black brand family, and follows the active theme via CSS variables. */
export const CHART_PALETTE = [
  "var(--chart-palette-1)",
  "var(--chart-palette-2)",
  "var(--chart-palette-3)",
  "var(--chart-palette-4)",
  "var(--chart-palette-5)",
  "var(--chart-palette-6)",
];
