import { ExternalLink } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { timeAgo } from "@/lib/utils"
import type { Review } from "@/types/review"

const platformColors: Record<string, string> = {
  google: "bg-blue-500",
  zomato: "bg-red-500",
  reelo: "bg-purple-500",
}

interface Props {
  review: Review
  onClick: () => void
}

export default function ReviewCard({ review, onClick }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:bg-card-secondary/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <RatingBadge rating={review.rating} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary capitalize">{review.platform}</span>
              <span className="text-text-muted">·</span>
              <span className="text-sm font-medium text-text">{review.reviewer_name}</span>
            </div>
            <p className="text-xs text-text-muted">{timeAgo(review.created_at)}</p>
          </div>
        </div>
        <span className={`flex h-2 w-2 rounded-full ${platformColors[review.platform] || "bg-gray-400"}`} />
      </div>

      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-text line-clamp-3">{review.text}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {review.location_id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card-secondary px-2 py-0.5 text-xs text-text-secondary">
              📍 Location
            </span>
          )}
          {review.sentiment && (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              review.sentiment === "positive" ? "bg-success-bg text-success" :
              review.sentiment === "negative" ? "bg-danger-bg text-danger" :
              "bg-card-secondary text-text-secondary"
            }`}>
              {review.sentiment}
            </span>
          )}
        </div>
        <button
          onClick={onClick}
          className="flex items-center gap-1 text-xs font-medium text-info hover:underline"
        >
          Read review <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
