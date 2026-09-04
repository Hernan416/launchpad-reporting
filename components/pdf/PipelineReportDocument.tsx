import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { PipelineFunnelReport, Period, WeeklyPipelineDataPoint } from "@/types";
import { formatNumber, formatPercent } from "@/lib/format";
import { groupWeeksByMonth, summarizePipelineMonth, type PipelineMonthTotals } from "@/lib/monthlyRollup";
import { pdfStyles } from "./pdfStyles";

function periodLabel(period: Period, customRangeLabel?: string): string {
  if (period === "custom") return customRangeLabel ?? "Custom Range";
  if (period === "lifetime") return "Lifetime";
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

const WEEK_COLUMNS: {
  key: keyof PipelineMonthTotals;
  label: string;
  format: (v: number) => string;
}[] = [
  { key: "totalLeads", label: "Leads", format: formatNumber },
  { key: "directQuoteLeads", label: "Direct Quote", format: formatNumber },
  { key: "quotesSent", label: "Quotes Sent", format: formatNumber },
  { key: "quoteYes", label: "Yes", format: formatNumber },
  { key: "quoteNo", label: "No", format: formatNumber },
  { key: "reviewing", label: "Reviewing", format: formatNumber },
  { key: "appointmentsBooked", label: "Booked", format: formatNumber },
  { key: "appointmentsCancelled", label: "Cancelled", format: formatNumber },
  { key: "appointmentsLost", label: "Lost", format: formatNumber },
];

function WeeklyTableHeader() {
  return (
    <View style={pdfStyles.tableHeaderRow}>
      <Text style={pdfStyles.tableCellHeader}>Week</Text>
      {WEEK_COLUMNS.map((col) => (
        <Text key={col.key} style={pdfStyles.tableCellHeader}>
          {col.label}
        </Text>
      ))}
    </View>
  );
}

function WeeklyTableRow({ label, data, bold }: { label: string; data: PipelineMonthTotals; bold?: boolean }) {
  const cellStyle = bold ? pdfStyles.tableCellBold : pdfStyles.tableCell;
  const rowStyle = bold ? pdfStyles.tableTotalRow : pdfStyles.tableRow;
  return (
    <View style={rowStyle}>
      <Text style={pdfStyles.tableCellFirst}>{label}</Text>
      {WEEK_COLUMNS.map((col) => (
        <Text key={col.key} style={cellStyle}>
          {col.format(data[col.key] as number)}
        </Text>
      ))}
    </View>
  );
}

export function PipelineReportDocument({
  clientName,
  period,
  customRangeLabel,
  report,
  trends,
}: {
  clientName: string;
  period: Period;
  customRangeLabel?: string;
  report: PipelineFunnelReport;
  trends: WeeklyPipelineDataPoint[];
}) {
  const monthGroups = groupWeeksByMonth(trends);
  const grandTotal = trends.length > 0 ? summarizePipelineMonth(trends) : null;
  const generatedAt = new Date(report.updatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Document title={`${clientName} — ${periodLabel(period, customRangeLabel)} Report`}>
      <Page size="A4" style={pdfStyles.page} wrap>
        <View style={pdfStyles.headerRow}>
          <View>
            <Text style={pdfStyles.clientName}>{clientName}</Text>
            <Text style={pdfStyles.reportSubtitle}>
              Performance Report — {periodLabel(period, customRangeLabel)}
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

        <Text style={pdfStyles.sectionTitle}>Leads</Text>
        <View style={pdfStyles.cardGrid}>
          <MetricCard label="Total Leads" value={formatNumber(report.totalLeads)} />
          {report.leadsBySource.map((source) => (
            <MetricCard key={source.label} label={source.label} value={formatNumber(source.count)} />
          ))}
        </View>

        <Text style={pdfStyles.sectionTitle}>Quotes</Text>
        <View style={pdfStyles.cardGrid}>
          <MetricCard label="Quotes Sent" value={formatNumber(report.quotesSent)} gold />
          <MetricCard label="Roofr (Direct Quotes)" value={formatNumber(report.directQuoteLeads)} gold />
          <MetricCard label="Quote — Yes" value={formatNumber(report.quoteYes)} gold />
          <MetricCard label="Quote — No" value={formatNumber(report.quoteNo)} gold />
          <MetricCard label="Reviewing" value={formatNumber(report.reviewing)} gold />
          <MetricCard label="Yes %" value={formatPercent(report.yesRate)} gold />
          <MetricCard label="No %" value={formatPercent(report.noRate)} gold />
          <MetricCard label="Decision %" value={formatPercent(report.decisionRate)} gold />
        </View>

        <Text style={pdfStyles.sectionTitle}>Appointments</Text>
        <View style={pdfStyles.cardGrid}>
          <MetricCard label="Booked" value={formatNumber(report.appointmentsBooked)} />
          <MetricCard label="Cancelled" value={formatNumber(report.appointmentsCancelled)} />
          <MetricCard label="Lost" value={formatNumber(report.appointmentsLost)} />
        </View>

        <Text style={pdfStyles.sectionTitle}>Monthly Breakdown</Text>
        {monthGroups.length === 0 && <Text style={{ fontSize: 8, color: "#64748b" }}>No weekly data for this period.</Text>}
        {monthGroups.map((group) => {
          const monthTotal = summarizePipelineMonth(group.weeks);
          return (
            <View key={group.monthLabel} wrap={false}>
              <Text style={pdfStyles.monthHeading}>{group.monthLabel}</Text>
              <View style={pdfStyles.table}>
                <WeeklyTableHeader />
                {group.weeks.map((week) => (
                  <WeeklyTableRow key={week.weekStart} label={week.weekLabel} data={week} />
                ))}
                <WeeklyTableRow label={`${group.monthLabel} Total`} data={monthTotal} bold />
              </View>
            </View>
          );
        })}

        {grandTotal && monthGroups.length > 1 && (
          <View wrap={false}>
            <Text style={pdfStyles.monthHeading}>All-Time Total ({periodLabel(period, customRangeLabel)})</Text>
            <View style={pdfStyles.table}>
              <WeeklyTableHeader />
              <WeeklyTableRow label="Grand Total" data={grandTotal} bold />
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
