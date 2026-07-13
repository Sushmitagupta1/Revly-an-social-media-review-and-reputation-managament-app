import { CheckCircle, AlertTriangle } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/utils"
import type { Review } from "@/types/review"

interface Props {
  review: Review
  onResolve: (id: string) => void
}

const topicLabels: Record<string, string> = {
  food_quality: "Food Quality", service: "Service", delivery: "Delivery",
  ambience: "Ambience", pricing: "Pricing", staff: "Staff", cleanliness: "Cleanliness", wait_time: "Wait Time",
}

export default function ComplaintCard({ review, onResolve }: Props) {
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
        {review.is_resolved ? (
          <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" /> Resolved</Badge>
        ) : (
          <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Open</Badge>
        )}
      </div>

      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-text line-clamp-3">{review.text}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {review.topics?.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">{topicLabels[t] || t}</Badge>
          ))}
        </div>
        {!review.is_resolved && (
          <Button variant="ghost" size="sm" className="text-success hover:text-success" onClick={() => onResolve(review.id)}>
            <CheckCircle className="mr-1 h-4 w-4" /> Resolve
          </Button>
        )}
      </div>
    </div>
  )
}
