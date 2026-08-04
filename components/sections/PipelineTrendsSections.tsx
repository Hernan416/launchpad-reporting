import type { WeeklyPipelineDataPoint } from "@/types";
import { ChartCard } from "@/components/ChartCard";
import { LeadsTrendChart } from "@/components/charts/LeadsTrendChart";
import { LeadSourcesDonut } from "@/components/charts/LeadSourcesDonut";
import { QuotesTrendChart } from "@/components/charts/QuotesTrendChart";
import { DecisionRateTrendChart } from "@/components/charts/DecisionRateTrendChart";
import { AppointmentsTrendChart } from "@/components/charts/AppointmentsTrendChart";
import { AppointmentsOutcomeDonut } from "@/components/charts/AppointmentsOutcomeDonut";

/**
 * Chart slice of the Excel Roofing custom funnel dashboard — the slower,
 * weekly-history half. Streams in independently of PipelineSnapshotSections
 * via its own Suspense boundary and promise. Each section pairs a simple
 * per-week trend chart with a totals breakdown for the same window.
 */
export async function PipelineTrendsSections({
  trendsPromise,
  rangeHeading,
  rangePhrase,
}: {
  trendsPromise: Promise<WeeklyPipelineDataPoint[]>;
  /** e.g. "Last 4 Weeks" or "Since Apr 4, 2026" (lifetime view) — see app/dashboard/[clientSlug]/page.tsx. */
  rangeHeading: string;
  /** Lowercase phrase form of rangeHeading, e.g. "the last 4 weeks" or "since Apr 4, 2026". */
  rangePhrase: string;
}) {
  const trends = await trendsPromise;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title={`Leads — ${rangeHeading}`} subtitle="Total leads per week" accent="blue">
          <LeadsTrendChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Leads by Source"
          subtitle={`Total across ${rangePhrase}`}
          accent="blue"
        >
          <LeadSourcesDonut data={trends} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title={`Quotes — ${rangeHeading}`}
          subtitle="Sent, Yes, No and Reviewing, per week"
          accent="gold"
        >
          <QuotesTrendChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Decision Rates"
          subtitle="Yes %, No % and Decision %, per week"
          accent="gold"
        >
          <DecisionRateTrendChart data={trends} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title={`Appointments — ${rangeHeading}`}
          subtitle="Booked, Cancelled and Lost, per week"
          accent="blue"
        >
          <AppointmentsTrendChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Appointments Outcome"
          subtitle={`Total across ${rangePhrase}`}
          accent="blue"
        >
          <AppointmentsOutcomeDonut data={trends} />
        </ChartCard>
      </div>
    </div>
  );
}
