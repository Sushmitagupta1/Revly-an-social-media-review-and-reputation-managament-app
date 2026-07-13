import { useEffect } from "react"
import { usePraisesStore } from "@/stores/praises-store"
import PraiseStats from "@/components/praises/praise-stats"
import PraiseCard from "@/components/praises/praise-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

const PLATFORMS = [
  { label: "All", value: null },
  { label: "Google", value: "google" },
  { label: "Zomato", value: "zomato" },
  { label: "Reelo", value: "reelo" },
]

export default function PraisesPage() {
  const { reviews, total, page, pages, isLoading, platform, setPlatform, setPage, fetchPraises } = usePraisesStore()

  useEffect(() => { fetchPraises() }, [])

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Praises</h1>
        <p className="mt-1 text-sm text-text-secondary">Celebrate your best reviews and testimonials</p>
      </div>

      <PraiseStats total={total} avgRating={avgRating} />

      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <Button key={p.label} variant={platform === p.value ? "default" : "ghost"} size="sm" onClick={() => setPlatform(p.value)}>
            {p.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No praises found" description="No positive reviews match your filters." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <PraiseCard key={r.id} review={r} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-text-secondary">Page {page} of {pages}</span>
            <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  )
}
