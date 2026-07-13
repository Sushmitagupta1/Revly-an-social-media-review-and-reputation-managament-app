import { TrendingUp, TrendingDown } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import type { LocationRanking } from "@/types/competitor"

interface Props {
  locations: LocationRanking[]
}

const rankIcons: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

export default function LeaderboardTable({ locations }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Rank</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Location</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Rating</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Reviews</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Positive %</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.location_id} className="border-b border-border/50 transition-colors hover:bg-card-secondary/30">
              <td className="px-5 py-4">
                <span className="text-lg">{rankIcons[loc.rank] || `#${loc.rank}`}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm font-medium text-text">📍 {loc.location_id.slice(0, 8)}...</span>
              </td>
              <td className="px-5 py-4 text-center">
                <RatingBadge rating={loc.avg_rating} size="sm" />
              </td>
              <td className="px-5 py-4 text-center">
                <span className="text-sm font-medium text-text">{loc.review_count}</span>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  {loc.positive_percentage >= 60 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  )}
                  <span className={`text-sm font-medium ${loc.positive_percentage >= 60 ? "text-success" : "text-danger"}`}>
                    {loc.positive_percentage}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
