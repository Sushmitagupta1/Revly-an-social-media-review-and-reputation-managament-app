import { useEffect, useState, useCallback } from "react"
import { Search, Download } from "lucide-react"
import { useReviewStore } from "@/stores/review-store"
import { downloadReviewsCsv } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ReviewFilters from "@/components/reviews/review-filters"
import ReviewCard from "@/components/reviews/review-card"
import ReviewDetail from "@/components/reviews/review-detail"
import ReviewStats from "@/components/reviews/review-stats"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import AskRevlyButton from "@/components/shared/ask-revly-button"
import type { Review } from "@/types/review"

export default function ReviewsPage() {
  const {
    reviews, page, pages, stats, isLoading,
    filters, setFilters, setPage, fetchReviews, fetchStats,
  } = useReviewStore()
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [])

  const handleSearch = useCallback(() => {
    setFilters({ search: searchInput })
  }, [searchInput, setFilters])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage and respond to customer reviews</p>
        </div>
        <AskRevlyButton />
      </div>

      <ReviewStats stats={stats} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search reviews..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => downloadReviewsCsv(filters.platform || undefined, filters.rating || undefined)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Download
        </Button>
      </div>

      <ReviewFilters />

      {isLoading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews found" description="Try adjusting your filters" />
      ) : (
        <>
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onClick={() => setSelectedReview(review)}
              />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Page {page} of {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {selectedReview && (
        <ReviewDetail
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  )
}
