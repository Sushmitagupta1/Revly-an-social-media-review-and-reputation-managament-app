import { useEffect, useMemo } from "react"
import { useComplaintsStore } from "@/stores/complaints-store"
import ComplaintStats from "@/components/complaints/complaint-stats"
import ComplaintCard from "@/components/complaints/complaint-card"
import TopicBreakdown from "@/components/complaints/topic-breakdown"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

const TOPICS = [
  { label: "All", value: null },
  { label: "Food Quality", value: "food_quality" },
  { label: "Service", value: "service" },
  { label: "Delivery", value: "delivery" },
  { label: "Pricing", value: "pricing" },
  { label: "Staff", value: "staff" },
]

export default function ComplaintsPage() {
  const { reviews, total, page, pages, isLoading, topic, setTopic, setPage, fetchComplaints, resolveReview } = useComplaintsStore()

  useEffect(() => { fetchComplaints() }, [])

  const resolvedCount = reviews.filter((r) => r.is_resolved).length
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const topicData = useMemo(() => {
    const counts: Record<string, number> = {}
    reviews.forEach((r) => r.topics?.forEach((t) => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count)
  }, [reviews])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Complaints</h1>
        <p className="mt-1 text-sm text-text-secondary">Track and resolve negative feedback</p>
      </div>

      <ComplaintStats total={total} resolved={resolvedCount} avgRating={avgRating} />

      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <Button key={t.label} variant={topic === t.value ? "default" : "ghost"} size="sm" onClick={() => setTopic(t.value)}>
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No complaints found" description="No negative reviews match your filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-4">
              {reviews.map((r) => (
                <ComplaintCard key={r.id} review={r} onResolve={resolveReview} />
              ))}
            </div>
            <TopicBreakdown data={topicData} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-text-secondary">Page {page} of {pages}</span>
            <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  )
}
