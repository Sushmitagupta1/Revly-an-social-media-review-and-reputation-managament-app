import { useEffect } from "react"
import { useDashboardStore } from "@/stores/dashboard-store"
import KpiRow from "@/components/dashboard/kpi-row"
import SentimentChart from "@/components/dashboard/sentiment-chart"
import RatingChart from "@/components/dashboard/rating-chart"
import PlatformChart from "@/components/dashboard/platform-chart"
import NpsGauge from "@/components/dashboard/nps-gauge"
import RecentReviews from "@/components/dashboard/recent-reviews"
import LocationSummary from "@/components/dashboard/location-summary"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function OverviewPage() {
  const { data, isLoading, fetchDashboard } = useDashboardStore()

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Overview of your reputation metrics</p>
      </div>

      <KpiRow kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SentimentChart data={data.sentiment_trend} />
        </div>
        <NpsGauge score={data.nps_score} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RatingChart data={data.rating_distribution} />
        <PlatformChart data={data.platform_breakdown} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentReviews reviews={data.recent_reviews} />
        </div>
        <div className="space-y-6">
          <LocationSummary
            title="Top Locations"
            locations={data.top_locations}
            variant="top"
          />
          <LocationSummary
            title="Needs Attention"
            locations={data.bottom_locations}
            variant="bottom"
          />
        </div>
      </div>
    </div>
  )
}
