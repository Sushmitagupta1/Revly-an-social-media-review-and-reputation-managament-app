import { Inbox, CheckCircle } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { timeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Review } from "@/types/review"

interface Props {
  review: Review
  onResolve: (id: string) => void
}

export default function InboxCard({ review, onResolve }: Props) {
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
        {review.rating <= 2 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">
            <Inbox className="h-3 w-3" /> Urgent
          </span>
        )}
      </div>

      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-text line-clamp-2">{review.text}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {review.sentiment && (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              review.sentiment === "negative" ? "bg-danger-bg text-danger" :
              review.sentiment === "positive" ? "bg-success-bg text-success" :
              "bg-card-secondary text-text-secondary"
            }`}>
              {review.sentiment}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-success hover:text-success"
          onClick={() => onResolve(review.id)}
        >
          <CheckCircle className="mr-1 h-4 w-4" /> Resolve
        </Button>
      </div>
    </div>
  )
}
