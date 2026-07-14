import { useEffect, useState } from "react"
import { useLeaderboardStore } from "@/stores/leaderboard-store"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

const sortOptions = ["Top Performing", "Most Improved"] as const

export default function LocationLeaderboardPage() {
  const { locations, isLoading, fetchLeaderboard } = useLeaderboardStore()
  const [sortBy, setSortBy] = useState<"Top Performing" | "Most Improved">("Top Performing")

  useEffect(() => { fetchLeaderboard() }, [])

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
  }

  if (locations.length === 0) {
    return <EmptyState title="No location data" description="Reviews need location IDs to appear here." />
  }

  const sorted = [...locations].sort((a, b) =>
    sortBy === "Top Performing" ? a.rank - b.rank : b.positive_percentage - a.positive_percentage
  )

  const topPerformer = [...locations].sort((a, b) => a.rank - b.rank)[0]
  const mostImproved = [...locations].sort((a, b) => b.positive_percentage - a.positive_percentage)[0]
  const maxReviews = Math.max(...locations.map((l) => l.review_count), 1)

  function getRatingBg(rating: number) {
    if (rating >= 4.5) return "bg-card-blue"
    if (rating >= 4.0) return "bg-card-green"
    if (rating >= 3.5) return "bg-card-yellow"
    return "bg-card-pink"
  }

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-[24px] font-bold text-white">Location Leaderboard</h1>
        <p className="mt-1 text-[13px] text-white/50">Compare outlet performance</p>
      </div>

      {topPerformer && mostImproved && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] bg-card-blue p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-accent" />
                  <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">Top Performer</span>
                </div>
                <p className="text-[18px] font-bold text-text">{topPerformer.location_id}</p>
                <p className="mt-0.5 text-[12px] text-text-secondary">Leading on reviews this week</p>
              </div>
              <div className="text-right">
                <p className="text-[28px] font-bold text-text">{topPerformer.avg_rating.toFixed(1)}</p>
                <p className="text-[11px] text-success font-medium">↑ {topPerformer.positive_percentage}%</p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-card-yellow p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">Most Improved</span>
                </div>
                <p className="text-[18px] font-bold text-text">{mostImproved.location_id}</p>
                <p className="mt-0.5 text-[12px] text-text-secondary">Biggest positive change</p>
              </div>
              <div className="text-right">
                <p className="text-[28px] font-bold text-text">{mostImproved.positive_percentage}%</p>
                <p className="text-[11px] text-success font-medium">↑ Positive</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 rounded-[12px] bg-white/5 p-1 w-fit">
        {sortOptions.map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={cn(
              "rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all",
              sortBy === option
                ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((loc, index) => {
          const isTop = loc.rank === 1
          const percentage = Math.round((loc.review_count / maxReviews) * 100)

          return (
            <div
              key={loc.location_id}
              className={cn(
                "rounded-[18px] bg-card p-4 transition-all hover:shadow-lg hover:shadow-black/5",
                isTop && "ring-2 ring-accent/20"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-card-blue text-[14px] font-bold text-text">
                  {index < 3 ? ["🥇", "🥈", "🥉"][index] : `#${loc.rank}`}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[14px] font-semibold text-text truncate">{loc.location_id}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-xl px-2.5 py-0.5 text-[11px] font-semibold", getRatingBg(loc.avg_rating))}>
                        {loc.avg_rating.toFixed(1)}
                      </span>
                      <span className="text-[11px] font-medium text-text-secondary">{loc.review_count} Reviews</span>
                    </div>
                  </div>

                  <div className="relative h-2 overflow-hidden rounded-full bg-card-secondary">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#4A74FF] to-[#7CB7FF] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center">
                    {loc.positive_percentage >= 50 ? (
                      <TrendingUp className="h-3 w-3 text-[#18A874]" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-[#E04F5F]" />
                    )}
                    <span className={cn(
                      "ml-1 text-[11px] font-medium",
                      loc.positive_percentage >= 50 ? "text-[#18A874]" : "text-[#E04F5F]"
                    )}>
                      {loc.positive_percentage >= 50 ? "↑" : "↓"} {loc.positive_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
