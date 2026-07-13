import RatingBadge from "@/components/shared/rating-badge"
import { timeAgo } from "@/lib/utils"
import type { RecentReview } from "@/types/dashboard"

interface Props {
  reviews: RecentReview[]
}

export default function RecentReviews({ reviews }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text">Recent Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="flex items-start gap-3">
            <RatingBadge rating={review.rating} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">{review.reviewer_name}</span>
                <span className="text-text-muted">·</span>
                <span className="text-xs capitalize text-text-secondary">{review.platform}</span>
                <span className="text-text-muted">·</span>
                <span className="text-xs text-text-muted">{timeAgo(review.created_at)}</span>
              </div>
              {review.text && (
                <p className="mt-1 text-xs text-text-secondary line-clamp-2">{review.text}</p>
              )}
              {review.sentiment && (
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  review.sentiment === "positive" ? "bg-success-bg text-success" :
                  review.sentiment === "negative" ? "bg-danger-bg text-danger" :
                  "bg-card-secondary text-text-secondary"
                }`}>
                  {review.sentiment}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
