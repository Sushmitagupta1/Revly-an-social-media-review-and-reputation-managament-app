import { useEffect, useMemo, useState } from "react"
import { useComplaintsStore } from "@/stores/complaints-store"
import { useFilterStore } from "@/stores/filter-store"
import ComplaintCard from "@/components/complaints/complaint-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import BackButton from "@/components/shared/back-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TOPICS = [
  { label: "All", value: null },
  { label: "Food Quality", value: "Food Quality" },
  { label: "Service", value: "Service" },
  { label: "Delivery", value: "Delivery" },
  { label: "Pricing", value: "Pricing" },
  { label: "Staff", value: "Staff" },
  { label: "Ambience", value: "Ambience" },
  { label: "Cleanliness", value: "Cleanliness" },
  { label: "Wait Time", value: "Wait Time" },
]

export default function ComplaintsPage() {
  const { reviews, total, page, pages, isLoading, topicCounts, topic, setTopic, setPage, fetchComplaints, resolveReview } = useComplaintsStore()
  const { selectedLocations } = useFilterStore()
  const [view, setView] = useState<"location" | "brand">("location")

  useEffect(() => { fetchComplaints(selectedLocations) }, [selectedLocations])

  const resolvedCount = reviews.filter((r) => r.is_resolved).length
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const maxTopicCount = Math.max(...topicCounts.map((t) => t.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/overview" />
        <h1 className="text-[24px] font-bold text-white">Complaints</h1>
        <p className="mt-1 text-[13px] text-text-secondary">Track and resolve negative feedback</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-[20px] bg-card-blue p-5">
          <p className="text-[13px] font-medium text-text-secondary">Total Complaints</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{total}</p>
          <p className="text-[12px] text-text-muted">Across all platforms</p>
        </div>
        <div className="rounded-[20px] bg-card-green p-5">
          <p className="text-[13px] font-medium text-text-secondary">Resolved</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{resolvedCount}</p>
          <p className="text-[12px] text-text-muted">{total > 0 ? Math.round((resolvedCount / total) * 100) : 0}% resolution rate</p>
        </div>
        <div className="rounded-[20px] bg-card-yellow p-5">
          <p className="text-[13px] font-medium text-text-secondary">Avg Rating</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{avgRating.toFixed(1)}</p>
          <p className="text-[12px] text-text-muted">Of negative reviews</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-[12px] bg-white/5 p-1">
          <button onClick={() => setView("location")} className={cn("rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all", view === "location" ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5")}>At Location</button>
          <button onClick={() => setView("brand")} className={cn("rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all", view === "brand" ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5")}>At Brand</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <Button key={t.label} variant={topic === t.value ? "default" : "ghost"} size="sm" onClick={() => setTopic(t.value)}>
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No complaints found" description="No negative reviews match your filters." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-[20px] bg-card p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-text">
                {view === "location" ? "Complaints by Outlet" : "Complaint Categories"}
              </h3>
              <div className="space-y-3">
                {topicCounts.length > 0 ? (view === "location" ? topicCounts.slice(0, 6) : topicCounts).map((t) => (
                  <div key={t.topic}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-text">{t.topic}</span>
                      <span className="text-[12px] font-bold text-danger">{t.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                      <div className="h-full rounded-full bg-danger transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-[13px] text-text-secondary">No data available</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {reviews.map((r) => (
              <ComplaintCard key={r.id} review={r} onResolve={resolveReview} />
            ))}
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-[13px] text-text-secondary">Page {page} of {pages}</span>
              <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-[20px] bg-card p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-text">Topic Breakdown</h3>
              <div className="space-y-3">
                {topicCounts.length > 0 ? topicCounts.map((t) => (
                  <div key={t.topic}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-text">{t.topic}</span>
                      <span className="text-[12px] font-bold text-text">{t.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                      <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
