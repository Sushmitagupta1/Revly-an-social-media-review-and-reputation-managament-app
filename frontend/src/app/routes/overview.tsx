import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useFilterStore } from "@/stores/filter-store"
import apiClient from "@/lib/api-client"
import DashboardKpis from "@/components/dashboard/dashboard-kpis"
import ReviewTrendChart from "@/components/dashboard/review-trend-chart"
import PlatformBreakdownCard from "@/components/dashboard/platform-breakdown-card"
import ComplaintsPraisesSection from "@/components/dashboard/complaints-praises-section"
import NpsScoreCard from "@/components/dashboard/nps-score-card"
import RatingsBreakdown from "@/components/dashboard/ratings-breakdown"
import LoadingSpinner from "@/components/shared/loading-spinner"
import type { DashboardData } from "@/types/dashboard"

export default function OverviewPage() {
  const user = useAuthStore((s) => s.user)
  const selectedLocations = useFilterStore((s) => s.selectedLocations)
  const dateRange = useFilterStore((s) => s.dateRange)
  const datePreset = useFilterStore((s) => s.datePreset)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  function getResolvedRange(): { from: string | null; to: string | null } {
    if (dateRange.from || dateRange.to) return dateRange
    const now = new Date()
    const toStr = now.toISOString().split("T")[0]
    switch (datePreset) {
      case "Today": {
        const s = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        return { from: s.toISOString().split("T")[0], to: toStr }
      }
      case "Yesterday": {
        const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const e = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        return { from: s.toISOString().split("T")[0], to: e.toISOString().split("T")[0] }
      }
      case "Past 7 Days": {
        const s = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return { from: s.toISOString().split("T")[0], to: toStr }
      }
      case "Past 30 Days": {
        const s = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return { from: s.toISOString().split("T")[0], to: toStr }
      }
      default:
        return { from: null, to: null }
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params: Record<string, string> = {}
        if (selectedLocations.length > 0) {
          params.locations = selectedLocations.join(",")
        }
        const resolved = getResolvedRange()
        if (resolved.from) params.date_from = resolved.from
        if (resolved.to) params.date_to = resolved.to
        const res = await apiClient.get("/dashboard", { params })
        if (!cancelled) setData(res.data)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load")
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedLocations, dateRange, datePreset])

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-danger font-medium">{error}</p>
          <button onClick={() => { setError(null); window.location.reload() }} className="mt-2 text-sm text-accent hover:underline">Retry</button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-[20px] bg-card-blue p-6">
        <h1 className="text-[20px] font-bold text-text">
          Hi, {user?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          You have <span className="font-semibold text-danger">{data.complaints_count} complaints</span> that need your attention.
        </p>
      </div>

      <DashboardKpis kpis={data.kpis} complaintsCount={data.complaints_count} />

      <ReviewTrendChart sentimentTrend={data.sentiment_trend} complaintsTrend={data.complaints_trend} />

      <PlatformBreakdownCard data={data.platform_breakdown} />

      <div>
        <h2 className="mb-4 text-[17px] font-semibold text-white">
          Here's what your customers love and hate about you
        </h2>
        <ComplaintsPraisesSection
          complaintsCount={data.complaints_count}
          praisesCount={data.praises_count}
          complaintsByLocation={data.complaints_by_location}
          praisesByLocation={data.praises_by_location}
          complaintTopics={data.complaint_topics}
          praiseTopics={data.praise_topics}
        />
      </div>

      <div>
        <h2 className="mb-4 text-[17px] font-semibold text-white">Here's your reputation snapshot</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <NpsScoreCard score={data.nps_score} sentiment={data.sentiment_breakdown} />
          <RatingsBreakdown data={data.rating_distribution} totalReviews={data.kpis.total_reviews} />
        </div>
      </div>
    </div>
  )
}
