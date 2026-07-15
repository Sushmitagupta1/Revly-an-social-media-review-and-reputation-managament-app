import { useEffect, useState } from "react"
import { usePraisesStore } from "@/stores/praises-store"
import { useFilterStore } from "@/stores/filter-store"
import PraiseCard from "@/components/praises/praise-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import BackButton from "@/components/shared/back-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PLATFORMS = [
  { label: "All", value: null },
  { label: "Google", value: "google" },
  { label: "Zomato", value: "zomato" },
  { label: "Reelo", value: "reelo" },
]

export default function PraisesPage() {
  const { reviews, total, page, pages, isLoading, topicCounts, platform, setPlatform, setPage, fetchPraises } = usePraisesStore()
  const { selectedLocations } = useFilterStore()
  const [view, setView] = useState<"location" | "brand">("location")

  useEffect(() => { fetchPraises(selectedLocations) }, [selectedLocations])

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const maxTopicCount = Math.max(...topicCounts.map((t) => t.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/overview" />
        <h1 className="text-[24px] font-bold text-white">Praises</h1>
        <p className="mt-1 text-[13px] text-text-secondary">Celebrate your best reviews and testimonials</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-[20px] bg-card-green p-5">
          <p className="text-[13px] font-medium text-text-secondary">Total Praises</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{total}</p>
          <p className="text-[12px] text-text-muted">Across all platforms</p>
        </div>
        <div className="rounded-[20px] bg-card-blue p-5">
          <p className="text-[13px] font-medium text-text-secondary">Avg Rating</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{avgRating.toFixed(1)}</p>
          <p className="text-[12px] text-text-muted">Of positive reviews</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-[12px] bg-white/5 p-1">
          <button onClick={() => setView("location")} className={cn("rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all", view === "location" ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5")}>At Location</button>
          <button onClick={() => setView("brand")} className={cn("rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all", view === "brand" ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5")}>At Brand</button>
        </div>
        <div className="flex gap-2">
          {PLATFORMS.map((p) => (
            <Button key={p.label} variant={platform === p.value ? "default" : "ghost"} size="sm" onClick={() => setPlatform(p.value)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No praises found" description="No positive reviews match your filters." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-[20px] bg-card p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-text">
                {view === "location" ? "Praises by Outlet" : "Praise Categories"}
              </h3>
              <div className="space-y-3">
                {topicCounts.length > 0 ? (view === "location" ? topicCounts.slice(0, 6) : topicCounts).map((t) => (
                  <div key={t.topic}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-text">{t.topic}</span>
                      <span className="text-[12px] font-bold text-success">{t.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                      <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
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
              <PraiseCard key={r.id} review={r} />
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
                      <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                    </div>
                  </div>
                )) : <p className="text-[13px] text-text-secondary">No data available</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
