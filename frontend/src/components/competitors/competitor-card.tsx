import { Trash2, ExternalLink } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Competitor } from "@/types/competitor"

interface Props {
  competitor: Competitor
  onDelete: (id: string) => void
}

export default function CompetitorCard({ competitor, onDelete }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:bg-card-secondary/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-secondary text-sm font-bold text-text">
            {competitor.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{competitor.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{competitor.platform}</Badge>
              {competitor.url && (
                <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(competitor.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {competitor.avg_rating !== null && <RatingBadge rating={competitor.avg_rating} />}
        <div>
          <p className="text-xs text-text-secondary">Reviews</p>
          <p className="text-sm font-semibold text-text">{competitor.review_count}</p>
        </div>
      </div>
    </div>
  )
}
