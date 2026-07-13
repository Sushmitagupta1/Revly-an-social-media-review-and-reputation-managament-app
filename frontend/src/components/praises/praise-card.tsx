import { Star } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { timeAgo } from "@/lib/utils"
import type { Review } from "@/types/review"

interface Props {
  review: Review
}

export default function PraiseCard({ review }: Props) {
  return (
    <div className="rounded-2xl border border-success/20 bg-surface p-5 transition-colors hover:bg-success/5">
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
        <Star className="h-4 w-4 fill-warning text-warning" />
      </div>

      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-text line-clamp-3">{review.text}</p>
      )}

      <div className="mt-3 flex gap-1">
        {review.topics?.map((t) => (
          <span key={t} className="inline-flex rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success capitalize">
            {t.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  )
}
