import { MapPin, TrendingUp, TrendingDown } from "lucide-react"
import type { LocationSummary as LocationSummaryType } from "@/types/dashboard"

interface Props {
  title: string
  locations: LocationSummaryType[]
  variant: "top" | "bottom"
}

export default function LocationSummary({ title, locations, variant }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        {variant === "top" ? (
          <TrendingUp className="h-4 w-4 text-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-danger" />
        )}
        <h3 className="text-sm font-semibold text-text">{title}</h3>
      </div>
      <div className="space-y-3">
        {locations.length === 0 ? (
          <p className="text-xs text-text-muted">No data yet</p>
        ) : (
          locations.map((loc) => (
            <div key={loc.location_id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-text-muted" />
                <span className="text-xs font-medium text-text">{loc.location_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">{loc.review_count} reviews</span>
                <span className={`text-xs font-bold ${
                  loc.average_rating >= 4 ? "text-success" :
                  loc.average_rating >= 3 ? "text-warning" :
                  "text-danger"
                }`}>
                  ⭐ {loc.average_rating}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
