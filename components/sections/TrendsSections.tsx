import type { WeeklyDataPoint } from "@/types";
import { ChartCard } from "@/components/ChartCard";
import { WeeklyTable } from "@/components/WeeklyTable";
import { AdSpendRevenueChart } from "@/components/charts/AdSpendRevenueChart";
import { CacRoasChart } from "@/components/charts/CacRoasChart";
import { CpcCtrChart } from "@/components/charts/CpcCtrChart";
import { LeadsCostChart } from "@/components/charts/LeadsCostChart";
import { LandingViewsOptInChart } from "@/components/charts/LandingViewsOptInChart";
import { AppointmentsCostChart } from "@/components/charts/AppointmentsCostChart";
import { CloseRateChart } from "@/components/charts/CloseRateChart";
import { QuotesClosedChart } from "@/components/charts/QuotesClosedChart";
import { ShowRateDonut } from "@/components/charts/ShowRateDonut";

/**
 * Chart-and-table slice of the standard dashboard — the slower, weekly-
 * history half of the report. Streams in independently of SnapshotSections
 * via its own Suspense boundary and promise.
 */
export async function TrendsSections({
  trendsPromise,
  weeks,
}: {
  trendsPromise: Promise<WeeklyDataPoint[]>;
  weeks: number;
}) {
  const trends = await trendsPromise;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Ad Spend vs Revenue Closed"
          subtitle="Weekly ad spend (bars) against revenue from closed deals (line)"
          accent="blue"
        >
          <AdSpendRevenueChart data={trends} />
        </ChartCard>
        <ChartCard
          title="CAC & ROAS"
          subtitle="CAC = Ad Spend ÷ Closed · ROAS = Revenue Closed ÷ Ad Spend"
          accent="blue"
        >
          <CacRoasChart data={trends} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="CPC & CTR"
          subtitle="Weekly cost per click vs click-through rate"
          accent="blue"
        >
          <CpcCtrChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Leads & Cost per Lead"
          subtitle="Weekly lead volume (bars) vs cost per lead (line)"
          accent="blue"
        >
          <LeadsCostChart data={trends} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Landing Page Views & Opt-in Rate"
          subtitle="Weekly landing page views (bars) vs opt-in rate (line)"
          accent="gold"
        >
          <LandingViewsOptInChart data={trends} />
        </ChartCard>
        <ChartCard
          title="Appointments & Cost per Appointment"
          subtitle="Weekly appointments booked (bars) vs cost per appointment (line)"
          accent="gold"
        >
          <AppointmentsCostChart data={trends} />
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
          subtitle={`Total across the last ${weeks} weeks`}
          accent="blue"
        >
          <ShowRateDonut data={trends} />
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 border-l-4 border-slate-400 pl-3 text-lg font-semibold text-slate-900">
          Weekly Detail — Last {weeks} Weeks
        </h2>
        <WeeklyTable data={trends} />
      </div>
    </div>
  );
}
