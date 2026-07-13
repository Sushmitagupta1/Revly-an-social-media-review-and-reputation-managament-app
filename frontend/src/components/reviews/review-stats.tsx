import type { ReviewStats as ReviewStatsType } from "@/types/review"
import { formatNumber } from "@/lib/utils"

interface Props {
  stats: ReviewStatsType | null
}

export default function ReviewStats({ stats }: Props) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl bg-card-blue p-4">
        <p className="text-xs text-text-secondary">Total Reviews</p>
        <p className="text-2xl font-bold text-text">{formatNumber(stats.total)}</p>
      </div>
      <div className="rounded-xl bg-card-green p-4">
        <p className="text-xs text-text-secondary">Average Rating</p>
        <p className="text-2xl font-bold text-text">⭐ {stats.average_rating}</p>
      </div>
      <div className="rounded-xl bg-card p-4">
        <p className="text-xs text-text-secondary">By Sentiment</p>
        <div className="mt-1 flex gap-2">
          {Object.entries(stats.by_sentiment).map(([s, c]) => (
            <span key={s} className={`text-xs font-medium ${
              s === "positive" ? "text-success" : s === "negative" ? "text-danger" : "text-text-secondary"
            }`}>
              {s}: {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
