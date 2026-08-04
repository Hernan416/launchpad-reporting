import type { WeeklyDataPoint } from "@/types";
import { ChartCard } from "@/components/ChartCard";
import { WeeklyTable } from "@/components/WeeklyTable";
import { AdSpendRevenueChart } from "@/components/charts/AdSpendRevenueChart";
import { CacChart } from "@/components/charts/CacChart";
import { RoasChart } from "@/components/charts/RoasChart";
import { CpcChart } from "@/components/charts/CpcChart";
import { CtrChart } from "@/components/charts/CtrChart";
import { LeadsChart } from "@/components/charts/LeadsChart";
import { CostPerLeadChart } from "@/components/charts/CostPerLeadChart";
import { LandingViewsChart } from "@/components/charts/LandingViewsChart";
import { OptInRateChart } from "@/components/charts/OptInRateChart";
import { AppointmentsChart } from "@/components/charts/AppointmentsChart";
import { CostPerAppointmentChart } from "@/components/charts/CostPerAppointmentChart";
import { CloseRateChart } from "@/components/charts/CloseRateChart";
import { QuotesClosedChart } from "@/components/charts/QuotesClosedChart";
import { ShowRateDonut } from "@/components/charts/ShowRateDonut";

/**
 * Chart-and-table slice of the standard dashboard — the slower, weekly-
 * history half of the report. Streams in independently of SnapshotSections
 * via its own Suspense boundary and promise. The table comes first (it's
 * the fastest thing to scan), then one simple single-metric chart per row
 * instead of dual-axis/mixed-unit combos — easier to read at a glance.
 */
export async function TrendsSections({
  trendsPromise,
  rangeHeading,
  rangePhrase,
}: {
  trendsPromise: Promise<WeeklyDataPoint[]>;
  /** e.g. "Last 4 Weeks" or "Since Apr 4, 2026" (lifetime view) — see app/dashboard/[clientSlug]/page.tsx. */
  rangeHeading: string;
  /** Lowercase phrase form of rangeHeading, e.g. "the last 4 weeks" or "since Apr 4, 2026". */
  rangePhrase: string;
}) {
  const trends = await trendsPromise;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 border-l-4 border-slate-400 pl-3 text-lg font-semibold text-slate-900 dark:border-white/20 dark:text-white/90">
          Weekly Detail — {rangeHeading}
        </h2>
        <WeeklyTable data={trends} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Ad Spend vs Revenue Closed" subtitle="Weekly, per week" accent="blue">
          <AdSpendRevenueChart data={trends} />
        </ChartCard>
        <ChartCard title="CAC" subtitle="Ad Spend ÷ Closed, per week" accent="blue">
          <CacChart data={trends} />
        </ChartCard>
        <ChartCard title="ROAS" subtitle="Revenue Closed ÷ Ad Spend, per week" accent="blue">
          <RoasChart data={trends} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="CPC" subtitle="Cost per click, per week" accent="blue">
          <CpcChart data={trends} />
        </ChartCard>
        <ChartCard title="CTR" subtitle="Click-through rate, per week" accent="blue">
          <CtrChart data={trends} />
        </ChartCard>
        <ChartCard title="Leads" subtitle="Weekly lead volume" accent="blue">
          <LeadsChart data={trends} />
        </ChartCard>
        <ChartCard title="Cost per Lead" subtitle="Weekly, per week" accent="blue">
          <CostPerLeadChart data={trends} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Landing Page Views" subtitle="Weekly volume" accent="gold">
          <LandingViewsChart data={trends} />
        </ChartCard>
        <ChartCard title="Opt-in Rate" subtitle="Leads ÷ Landing Page Views, per week" accent="gold">
          <OptInRateChart data={trends} />
        </ChartCard>
        <ChartCard title="Appointments" subtitle="Weekly appointments booked" accent="gold">
          <AppointmentsChart data={trends} />
        </ChartCard>
        <ChartCard title="Cost per Appointment" subtitle="Weekly, per week" accent="gold">
          <CostPerAppointmentChart data={trends} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Close Rate vs Show Rate"
          subtitle="Close Rate = Closed ÷ Appointments Shown"
          accent="blue"
        >
          <CloseRateChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Quotes Sent vs Closed"
          subtitle="Weekly opportunity volume by stage"
          accent="blue"
        >
          <QuotesClosedChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Appointments: Showed vs No-show"
          subtitle={`Total across ${rangePhrase}`}
          accent="blue"
        >
          <ShowRateDonut data={trends} />
        </ChartCard>
      </div>
    </div>
  );
}
