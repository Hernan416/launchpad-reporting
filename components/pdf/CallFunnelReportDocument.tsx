import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { CallFunnelReport, Period, WeeklyCallFunnelDataPoint } from "@/types";
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "@/lib/format";
import {
  groupWeeksByMonth,
  summarizeCallFunnelMonth,
  type CallFunnelMonthTotals,
} from "@/lib/monthlyRollup";
import { pdfStyles } from "./pdfStyles";

function periodLabel(period: Period, sinceLabel?: string, customRangeLabel?: string): string {
  if (period === "custom") return customRangeLabel ?? "Custom Range";
  if (period === "lifetime") return sinceLabel ? `Lifetime (since ${sinceLabel})` : "Lifetime";
  if (period === "month") {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return "Last 7 Days";
}

function MetricCard({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <View style={gold ? [pdfStyles.card, pdfStyles.cardGold] : pdfStyles.card}>
      <Text style={pdfStyles.cardLabel}>{label}</Text>
      <Text style={pdfStyles.cardValue}>{value}</Text>
    </View>
  );
}

/** Columns are built per-document since entryLabel is absent for the Combined view (no blended Calls Made/Leads count — see getLaunchpadReport). */
function buildWeekColumns(
  entryLabel?: string
): { key: keyof CallFunnelMonthTotals; label: string; format: (v: number) => string }[] {
  return [
    ...(entryLabel
      ? [{ key: "callsMade" as const, label: entryLabel, format: formatNumber }]
      : []),
    { key: "appointmentsBooked", label: "Booked", format: formatNumber },
    { key: "shows", label: "Shows", format: formatNumber },
    { key: "noShows", label: "No-Shows", format: formatNumber },
    { key: "showRate", label: "Show %", format: formatPercent },
    { key: "notClosed", label: "Not Closed", format: formatNumber },
    { key: "closed", label: "Closed", format: formatNumber },
    { key: "closeRate", label: "Close %", format: formatPercent },
    { key: "closedRevenue", label: "Revenue", format: formatCurrency },
  ];
}

function WeeklyTableHeader({
  columns,
}: {
  columns: ReturnType<typeof buildWeekColumns>;
}) {
  return (
    <View style={pdfStyles.tableHeaderRow}>
      <Text style={pdfStyles.tableCellHeader}>Week</Text>
      {columns.map((col) => (
        <Text key={col.key} style={pdfStyles.tableCellHeader}>
          {col.label}
        </Text>
      ))}
    </View>
  );
}

function WeeklyTableRow({
  label,
  data,
  columns,
  bold,
}: {
  label: string;
  data: CallFunnelMonthTotals;
  columns: ReturnType<typeof buildWeekColumns>;
  bold?: boolean;
}) {
  const cellStyle = bold ? pdfStyles.tableCellBold : pdfStyles.tableCell;
  const rowStyle = bold ? pdfStyles.tableTotalRow : pdfStyles.tableRow;
  return (
    <View style={rowStyle}>
      <Text style={pdfStyles.tableCellFirst}>{label}</Text>
      {columns.map((col) => (
        <Text key={col.key} style={cellStyle}>
          {col.format(data[col.key])}
        </Text>
      ))}
    </View>
  );
}

/**
 * PDF export for the Launchpad AI dashboard (see
 * components/sections/CallFunnelSnapshotSections.tsx, the on-screen
 * equivalent). `entryLabel`/`pipelineTitle` are undefined for the Combined
 * view — no Calls Made/Leads column and no Meta Ads section there either,
 * same rule as the live page (see getLaunchpadReport).
 */
export function CallFunnelReportDocument({
  pipelineTitle,
  entryLabel,
  period,
  sinceLabel,
  customRangeLabel,
  report,
  trends,
}: {
  pipelineTitle: string;
  entryLabel?: string;
  period: Period;
  sinceLabel?: string;
  customRangeLabel?: string;
  report: CallFunnelReport;
  trends: WeeklyCallFunnelDataPoint[];
}) {
  const columns = buildWeekColumns(entryLabel);
  const monthGroups = groupWeeksByMonth(trends);
  const grandTotal = trends.length > 0 ? summarizeCallFunnelMonth(trends) : null;
  const generatedAt = new Date(report.updatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Document
      title={`Launchpad AI — ${pipelineTitle} — ${periodLabel(period, sinceLabel, customRangeLabel)} Report`}
    >
      <Page size="A4" style={pdfStyles.page} wrap>
        <View style={pdfStyles.headerRow}>
          <View>
            <Text style={pdfStyles.clientName}>Launchpad AI — {pipelineTitle}</Text>
            <Text style={pdfStyles.reportSubtitle}>
              Performance Report — {periodLabel(period, sinceLabel, customRangeLabel)}
            </Text>
          </View>
          <Text style={pdfStyles.generatedAt}>Generated {generatedAt}</Text>
        </View>
        <View style={pdfStyles.divider} />

        {report.warnings.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            {report.warnings.map((w) => (
              <Text key={w} style={{ fontSize: 8, color: "#b45309" }}>
                ⚠ {w}
              </Text>
            ))}
          </View>
        )}

        <Text style={pdfStyles.sectionTitle}>Headline</Text>
        <View style={pdfStyles.cardGrid}>
          <MetricCard label="Revenue Closed" value={formatCurrency(report.metrics.closedRevenue)} />
          {report.meta && (
            <>
              <MetricCard label="Ad Spend" value={formatCurrency(report.meta.spend)} />
              <MetricCard label="CAC" value={formatCurrency(report.meta.cac)} />
              <MetricCard label="ROAS" value={formatMultiplier(report.meta.roas)} />
            </>
          )}
          <MetricCard
            label="Show Rate"
            value={`${formatPercent(report.metrics.showRate)} (${formatNumber(report.metrics.shows)}/${formatNumber(
              report.metrics.shows + report.metrics.noShows
            )})`}
          />
          <MetricCard
            label="Close Rate"
            value={`${formatPercent(report.metrics.closeRate)} (${formatNumber(report.metrics.closed)}/${formatNumber(report.metrics.shows)})`}
          />
        </View>

        {report.meta && (
          <>
            <Text style={pdfStyles.sectionTitle}>Meta Ads</Text>
            <View style={pdfStyles.cardGrid}>
              <MetricCard label={entryLabel ?? "Leads"} value={formatNumber(report.meta.leads)} />
              <MetricCard
                label={!entryLabel || entryLabel === "Leads" ? "Cost / Lead" : `Cost / ${entryLabel}`}
                value={formatCurrency(report.meta.costPerLead)}
              />
              <MetricCard label="CPC" value={formatCurrency(report.meta.cpc)} />
              <MetricCard label="CTR" value={formatPercent(report.meta.ctr)} />
            </View>
          </>
        )}

        <Text style={pdfStyles.sectionTitle}>Funnel</Text>
        <View style={pdfStyles.cardGrid}>
          {entryLabel && (
            <MetricCard label={entryLabel} value={formatNumber(report.metrics.callsMade)} gold />
          )}
          <MetricCard
            label="Appointments Booked"
            value={formatNumber(report.metrics.appointmentsBooked)}
            gold
          />
          <MetricCard label="Shows" value={formatNumber(report.metrics.shows)} gold />
          <MetricCard label="No-Shows" value={formatNumber(report.metrics.noShows)} gold />
          <MetricCard label="Not Closed" value={formatNumber(report.metrics.notClosed)} gold />
          <MetricCard label="Closed" value={formatNumber(report.metrics.closed)} gold />
        </View>

        <Text style={pdfStyles.sectionTitle}>Monthly Breakdown</Text>
        {monthGroups.length === 0 && (
          <Text style={{ fontSize: 8, color: "#64748b" }}>No weekly data for this period.</Text>
        )}
        {monthGroups.map((group) => {
          const monthTotal = summarizeCallFunnelMonth(group.weeks);
          return (
            <View key={group.monthLabel} wrap={false}>
              <Text style={pdfStyles.monthHeading}>{group.monthLabel}</Text>
              <View style={pdfStyles.table}>
                <WeeklyTableHeader columns={columns} />
                {group.weeks.map((week) => (
                  <WeeklyTableRow key={week.weekStart} label={week.weekLabel} data={week} columns={columns} />
                ))}
                <WeeklyTableRow
                  label={`${group.monthLabel} Total`}
                  data={monthTotal}
                  columns={columns}
                  bold
                />
              </View>
            </View>
          );
        })}

        {grandTotal && monthGroups.length > 1 && (
          <View wrap={false}>
            <Text style={pdfStyles.monthHeading}>
              All-Time Total ({periodLabel(period, sinceLabel, customRangeLabel)})
            </Text>
            <View style={pdfStyles.table}>
              <WeeklyTableHeader columns={columns} />
              <WeeklyTableRow label="Grand Total" data={grandTotal} columns={columns} bold />
            </View>
          </View>
        )}

        <Text
          style={pdfStyles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
