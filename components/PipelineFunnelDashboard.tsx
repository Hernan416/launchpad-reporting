import type { PipelineFunnelReport, WeeklyPipelineDataPoint } from "@/types";
import { MetricGroup } from "@/components/MetricGroup";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { DecisionOutcomeDonut } from "@/components/charts/DecisionOutcomeDonut";
import { LeadSourcesTrendChart } from "@/components/charts/LeadSourcesTrendChart";
import { QuotePipelineTrendChart } from "@/components/charts/QuotePipelineTrendChart";
import { DecisionsTrendChart } from "@/components/charts/DecisionsTrendChart";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export function PipelineFunnelDashboard({
  report,
  trends,
}: {
  report: PipelineFunnelReport;
  trends: WeeklyPipelineDataPoint[];
}) {
  return (
    <>
      <section>
        <MetricGroup title="Lead Sources" accent="cyan">
          <MetricCard accent="cyan" label="Leads (VELUX)" value={formatNumber(report.leads)} />
          <MetricCard
            accent="cyan"
            label="Website Leads"
            value={formatNumber(report.websiteLeads)}
          />
        </MetricGroup>
        <div className="mt-5">
          <ChartCard
            title="Lead Sources — Last 4 Weeks"
            subtitle="Leads by source, per week"
            accent="cyan"
          >
            <LeadSourcesTrendChart data={trends} />
          </ChartCard>
        </div>
      </section>

      <section>
        <MetricGroup title="Quote Pipeline" accent="indigo">
          <MetricCard
            accent="indigo"
            label="Quote Follow-up"
            value={formatNumber(report.quoteFollowUp)}
          />
          <MetricCard accent="indigo" label="Quotes Sent" value={formatNumber(report.quotesSent)} />
          <MetricCard
            accent="indigo"
            label="Revenue Opportunity"
            value={formatCurrency(report.revenueOpportunity)}
          />
          <MetricCard accent="indigo" label="Reviewing" value={formatNumber(report.reviewing)} />
        </MetricGroup>
        <div className="mt-5">
          <ChartCard
            title="Quote Pipeline — Last 4 Weeks"
            subtitle="Quotes sent (bars) vs still in follow-up (line)"
            accent="indigo"
          >
            <QuotePipelineTrendChart data={trends} />
          </ChartCard>
        </div>
      </section>

      <section>
        <MetricGroup title="Decisions" accent="emerald">
          <MetricCard accent="emerald" label="Decisions" value={formatNumber(report.decisions)} />
          <MetricCard accent="emerald" label="Quote - Yes" value={formatNumber(report.quoteYes)} />
          <MetricCard accent="emerald" label="Quote - No" value={formatNumber(report.quoteNo)} />
          <MetricCard
            accent="emerald"
            label="Revenue Closed"
            value={formatCurrency(report.revenueClosed)}
          />
          <MetricCard
            accent="emerald"
            label="Decision %"
            value={formatPercent(report.decisionRate)}
          />
          <MetricCard accent="emerald" label="Yes %" value={formatPercent(report.yesRate)} />
          <MetricCard accent="emerald" label="No %" value={formatPercent(report.noRate)} />
        </MetricGroup>
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Decisions — Last 4 Weeks"
            subtitle="Quote - Yes vs Quote - No, per week"
            accent="emerald"
          >
            <DecisionsTrendChart data={trends} />
          </ChartCard>
          <ChartCard
            title="Decision Outcome"
            subtitle="Quote - Yes vs Quote - No vs Reviewing (current snapshot)"
            accent="emerald"
          >
            <DecisionOutcomeDonut
              quoteYes={report.quoteYes}
              quoteNo={report.quoteNo}
              reviewing={report.reviewing}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <MetricGroup title="Appointments" accent="blue">
          <MetricCard accent="blue" label="Appointments" value={formatNumber(report.appointments)} />
          <MetricCard accent="blue" label="Shows" value={formatNumber(report.shows)} />
          <MetricCard accent="blue" label="Show Rate" value={formatPercent(report.showRate)} />
          <MetricCard accent="blue" label="Close Rate" value={formatPercent(report.closeRate)} />
        </MetricGroup>
      </section>
    </>
  );
}
