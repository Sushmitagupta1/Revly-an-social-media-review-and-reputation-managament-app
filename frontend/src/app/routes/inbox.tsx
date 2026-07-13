import { useEffect } from "react"
import { useInboxStore } from "@/stores/inbox-store"
import InboxStats from "@/components/inbox/inbox-stats"
import InboxCard from "@/components/inbox/inbox-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

const TOPICS = [
  { label: "All", value: null },
  { label: "Urgent", value: "urgent" },
]

export default function InboxPage() {
  const { reviews, total, page, pages, isLoading, priority, setPriority, setPage, fetchInbox, resolveReview } = useInboxStore()

  useEffect(() => { fetchInbox() }, [])

  const urgentCount = reviews.filter((r) => r.rating <= 2).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Inbox</h1>
        <p className="mt-1 text-sm text-text-secondary">Reviews that need your attention</p>
      </div>

      <InboxStats total={total} urgent={urgentCount} />

      <div className="flex gap-2">
        {TOPICS.map((t) => (
          <Button
            key={t.label}
            variant={priority === t.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setPriority(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="All caught up!" description="No reviews need your attention right now." />
      ) : (
        <>
          <div className="grid gap-4">
            {reviews.map((r) => (
              <InboxCard key={r.id} review={r} onResolve={resolveReview} />
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
