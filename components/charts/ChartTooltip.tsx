"use client";

import type { TooltipContentProps } from "recharts";

/**
 * Replaces Recharts' default tooltip content, which hardcodes
 * `background: #fff; color: #000` and ignores the app's dark theme entirely.
 * `valueFormatter` mirrors the per-chart `formatter` most charts previously
 * passed to `<Tooltip formatter={...}>` (currency/percent/x-suffix), applied
 * here instead since a custom `content` renderer bypasses that prop.
 */
type ChartTooltipProps = TooltipContentProps & {
  valueFormatter?: (value: number, name: string) => string;
};

export function ChartTooltip({ active, payload, label, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-xs shadow-card dark:border-white/10 dark:bg-[#1e2128]">
      {label != null && label !== "" && (
        <p className="mb-1.5 font-medium text-slate-500 dark:text-white/50">{label}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => {
          const numericValue = typeof entry.value === "number" ? entry.value : Number(entry.value);
          const name = String(entry.name ?? "");
          const displayValue =
            valueFormatter && !Number.isNaN(numericValue)
              ? valueFormatter(numericValue, name)
              : String(entry.value);

          return (
            <div key={String(entry.dataKey ?? entry.name ?? index)} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: (entry.color ?? entry.fill) as string }}
              />
              <span className="text-slate-600 dark:text-white/70">{name}</span>
              <span className="ml-3 font-medium tabular-nums text-slate-900 dark:text-white/90">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Shared `<Legend>` styling so every chart's legend matches instead of Recharts' default squares + browser-default text color. */
export const CHART_LEGEND_PROPS = {
  iconType: "circle" as const,
  iconSize: 8,
  wrapperStyle: { fontSize: 12, paddingTop: 8 },
};
