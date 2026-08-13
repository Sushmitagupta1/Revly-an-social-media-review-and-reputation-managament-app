import { useState } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { useReviewStore } from "@/stores/review-store"
import { cn } from "@/lib/utils"

const platforms = [
  { value: null, label: "All Platforms" },
  { value: "google", label: "Google" },
  { value: "zomato", label: "Zomato" },
  { value: "swiggy", label: "Swiggy" },
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

const durationOptions = [
  { label: "Today", getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { from: start.toISOString(), to: now.toISOString() }
  }},
  { label: "Yesterday", getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { from: start.toISOString(), to: end.toISOString() }
  }},
  { label: "Past 7 Days", getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { from: start.toISOString(), to: now.toISOString() }
  }},
  { label: "Past 30 Days", getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { from: start.toISOString(), to: now.toISOString() }
  }},
  { label: "All Time", getRange: () => ({ from: null, to: null }) },
]

export default function ReviewFilters() {
  const { filters, setFilters } = useReviewStore()
  const [durationOpen, setDurationOpen] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState("All Time")
  const [dateFrom, setDateFrom] = useState(filters.date_from || "")
  const [dateTo, setDateTo] = useState(filters.date_to || "")
  const [localPlatform, setLocalPlatform] = useState(filters.platform || "")
  const [localRating, setLocalRating] = useState(filters.rating || "")
  const [localSentiment, setLocalSentiment] = useState(filters.sentiment || "")

  const handleDurationSelect = (label: string, range: { from: string | null; to: string | null }) => {
    setSelectedDuration(label)
    setDurationOpen(false)
    setDateFrom(range.from ? range.from.split("T")[0] : "")
    setDateTo(range.to ? range.to.split("T")[0] : "")
  }

  const handleApply = () => {
    setFilters({
      platform: localPlatform || null,
      rating: localRating ? Number(localRating) : null,
      sentiment: localSentiment || null,
      date_from: dateFrom || null,
      date_to: dateTo ? dateTo + "T23:59:59" : null,
    })
  }

  const hasActiveFilters = filters.date_from || filters.date_to || filters.platform || filters.rating || filters.sentiment

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={localPlatform}
          onChange={(e) => setLocalPlatform(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
        >
          {platforms.map((p) => (
            <option key={p.value || "all"} value={p.value || ""}>{p.label}</option>
          ))}
        </select>

        <select
          value={localRating}
          onChange={(e) => setLocalRating(e.target.value)}
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
              onClick={() => setLocalSentiment(s.value || "")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                localSentiment === (s.value || "")
                  ? "bg-info text-white"
                  : "text-text-secondary hover:bg-card-secondary"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setDurationOpen(!durationOpen)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text hover:bg-card-secondary transition-colors"
          >
            <Calendar className="h-4 w-4 text-text-muted" />
            <span>{selectedDuration}</span>
            <ChevronDown className={cn("h-3 w-3 text-text-muted transition-transform", durationOpen && "rotate-180")} />
          </button>
          {durationOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-xl border border-border bg-surface shadow-xl">
              {durationOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleDurationSelect(opt.label, opt.getRange())}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                    selectedDuration === opt.label
                      ? "bg-accent/10 text-accent"
                      : "text-text hover:bg-card-secondary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <div className="border-t border-border p-3 space-y-2">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Custom From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setSelectedDuration("Custom") }}
                    className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Custom To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setSelectedDuration("Custom") }}
                    className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-text"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleApply}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors shadow-[0_0_15px_rgba(255,106,43,0.2)]"
        >
          Apply
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSelectedDuration("All Time")
              setDateFrom("")
              setDateTo("")
              setLocalPlatform("")
              setLocalRating("")
              setLocalSentiment("")
              setFilters({
                platform: null,
                rating: null,
                sentiment: null,
                date_from: null,
                date_to: null,
              })
            }}
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  )
}
