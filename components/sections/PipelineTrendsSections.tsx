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
  weeks,
}: {
  trendsPromise: Promise<WeeklyPipelineDataPoint[]>;
  weeks: number;
}) {
  const trends = await trendsPromise;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title={`Leads — Last ${weeks} Weeks`}
          subtitle="Total leads per week"
          accent="blue"
        >
          <LeadsTrendChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Leads by Source"
          subtitle={`Total across the last ${weeks} weeks`}
          accent="blue"
        >
          <LeadSourcesDonut data={trends} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title={`Quotes — Last ${weeks} Weeks`}
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
          title={`Appointments — Last ${weeks} Weeks`}
          subtitle="Booked, Cancelled and Lost, per week"
          accent="blue"
        >
          <AppointmentsTrendChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Appointments Outcome"
          subtitle={`Total across the last ${weeks} weeks`}
          accent="blue"
        >
          <AppointmentsOutcomeDonut data={trends} />
        </ChartCard>
      </div>
    </div>
  );
}
