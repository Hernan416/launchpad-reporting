import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ClientReport, Period, WeeklyDataPoint } from "@/types";
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "@/lib/format";
import { groupWeeksByMonth, summarizeStandardMonth, type StandardMonthTotals } from "@/lib/monthlyRollup";
import { pdfStyles } from "./pdfStyles";

function periodLabel(period: Period, clientSinceLabel?: string, customRangeLabel?: string): string {
  if (period === "custom") return customRangeLabel ?? "Custom Range";
  if (period === "lifetime") return clientSinceLabel ? `Lifetime (since ${clientSinceLabel})` : "Lifetime";
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
  key: keyof StandardMonthTotals;
  label: string;
  format: (v: number) => string;
}[] = [
  { key: "adSpend", label: "Ad Spend", format: formatCurrency },
  { key: "leads", label: "Leads", format: formatNumber },
  { key: "appointments", label: "Appts", format: formatNumber },
  { key: "shows", label: "Shows", format: formatNumber },
  { key: "quotesSent", label: "Quotes", format: formatNumber },
  { key: "closed", label: "Closed", format: formatNumber },
  { key: "revenueClosed", label: "Revenue", format: formatCurrency },
  { key: "cac", label: "CAC", format: formatCurrency },
  { key: "roas", label: "ROAS", format: formatMultiplier },
  { key: "closeRate", label: "Close %", format: formatPercent },
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

function WeeklyTableRow({ label, data, bold }: { label: string; data: StandardMonthTotals; bold?: boolean }) {
  const cellStyle = bold ? pdfStyles.tableCellBold : pdfStyles.tableCell;
  const rowStyle = bold ? pdfStyles.tableTotalRow : pdfStyles.tableRow;
  return (
    <View style={rowStyle}>
      <Text style={pdfStyles.tableCellFirst}>{label}</Text>
      {WEEK_COLUMNS.map((col) => (
        <Text key={col.key} style={cellStyle}>
          {col.format(data[col.key])}
        </Text>
      ))}
    </View>
  );
}

export function StandardReportDocument({
  clientName,
  period,
  clientSinceLabel,
  customRangeLabel,
  report,
  trends,
}: {
  clientName: string;
  period: Period;
  clientSinceLabel?: string;
  customRangeLabel?: string;
  report: ClientReport;
  trends: WeeklyDataPoint[];
}) {
  const monthGroups = groupWeeksByMonth(trends);
  const grandTotal = trends.length > 0 ? summarizeStandardMonth(trends) : null;
  const generatedAt = new Date(report.updatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Document title={`${clientName} — ${periodLabel(period, clientSinceLabel, customRangeLabel)} Report`}>
      <Page size="A4" style={pdfStyles.page} wrap>
        <View style={pdfStyles.headerRow}>
          <View>
            <Text style={pdfStyles.clientName}>{clientName}</Text>
            <Text style={pdfStyles.reportSubtitle}>
              Performance Report — {periodLabel(period, clientSinceLabel, customRangeLabel)}
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
          <MetricCard label="Revenue Closed" value={formatCurrency(report.headline.revenueClosed)} />
          <MetricCard label="Ad Spend" value={formatCurrency(report.headline.adSpend)} />
          <MetricCard label="CAC" value={formatCurrency(report.headline.cac)} />
          <MetricCard label="ROAS" value={formatMultiplier(report.headline.roas)} />
          <MetricCard
            label="Close Rate"
            value={`${formatPercent(report.headline.closeRate)} (${formatNumber(report.headline.closedCount)}/${formatNumber(report.headline.shownCount)})`}
          />
          <MetricCard label="Cost / Appointment" value={formatCurrency(report.headline.costPerAppointment)} />
          <MetricCard label="Revenue Opportunity" value={formatCurrency(report.headline.revenueOpportunity)} />
        </View>

        <Text style={pdfStyles.sectionTitle}>Meta Ads &amp; Funnel</Text>
        <View style={pdfStyles.cardGrid}>
          <MetricCard label="Leads" value={formatNumber(report.meta.leads)} />
          <MetricCard label="Cost / Lead" value={formatCurrency(report.meta.costPerLead)} />
          <MetricCard label="CPC" value={formatCurrency(report.meta.cpc)} />
          <MetricCard label="CTR" value={formatPercent(report.meta.ctr)} />
          <MetricCard label="Landing Page Views" value={formatNumber(report.funnel.landingPageViews)} gold />
          <MetricCard label="Opt-in Rate" value={formatPercent(report.funnel.optInRate)} gold />
          <MetricCard label="Appointments" value={formatNumber(report.funnel.appointments)} gold />
          <MetricCard label="Cost / Appointment" value={formatCurrency(report.funnel.costPerAppointment)} gold />
        </View>

        <Text style={pdfStyles.sectionTitle}>Sales</Text>
        <View style={pdfStyles.cardGrid}>
          <MetricCard label="Show Rate" value={formatPercent(report.sales.showRate)} />
          <MetricCard label="Cost / Shown Appt" value={formatCurrency(report.sales.costPerShownAppt)} />
          <MetricCard label="Quotes Sent" value={formatNumber(report.sales.quotesSent)} />
          <MetricCard label="Closed" value={formatNumber(report.sales.closed)} />
        </View>

        <Text style={pdfStyles.sectionTitle}>Monthly Breakdown</Text>
        {monthGroups.length === 0 && <Text style={{ fontSize: 8, color: "#64748b" }}>No weekly data for this period.</Text>}
        {monthGroups.map((group) => {
          const monthTotal = summarizeStandardMonth(group.weeks);
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
            <Text style={pdfStyles.monthHeading}>
              All-Time Total ({periodLabel(period, clientSinceLabel, customRangeLabel)})
            </Text>
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
