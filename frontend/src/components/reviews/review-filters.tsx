import { useReviewStore } from "@/stores/review-store"
import { cn } from "@/lib/utils"

const platforms = [
  { value: null, label: "All Platforms" },
  { value: "google", label: "Google" },
  { value: "zomato", label: "Zomato" },
  { value: "reelo", label: "Reelo" },
]

const ratings = [
  { value: null, label: "All Ratings" },
  { value: 5, label: "5 Star" },
  { value: 4, label: "4 Star" },
  { value: 3, label: "3 Star" },
  { value: 2, label: "2 Star" },
  { value: 1, label: "1 Star" },
]

const sentiments = [
  { value: null, label: "All" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "neutral", label: "Neutral" },
]

export default function ReviewFilters() {
  const { filters, setFilters } = useReviewStore()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.platform || ""}
        onChange={(e) => setFilters({ platform: e.target.value || null })}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      >
        {platforms.map((p) => (
          <option key={p.value || "all"} value={p.value || ""}>{p.label}</option>
        ))}
      </select>

      <select
        value={filters.rating || ""}
        onChange={(e) => setFilters({ rating: e.target.value ? Number(e.target.value) : null })}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      >
        {ratings.map((r) => (
          <option key={r.value || "all"} value={r.value || ""}>{r.label}</option>
        ))}
      </select>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
        {sentiments.map((s) => (
          <button
            key={s.value || "all"}
            onClick={() => setFilters({ sentiment: s.value })}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              filters.sentiment === s.value
                ? "bg-info text-white"
                : "text-text-secondary hover:bg-card-secondary"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
