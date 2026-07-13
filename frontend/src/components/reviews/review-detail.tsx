import { useState } from "react"
import { X, Sparkles, RefreshCw } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import ReplyCard from "./reply-card"
import ReplyEditor from "./reply-editor"
import { useReviewStore } from "@/stores/review-store"
import type { Review, Reply } from "@/types/review"
import { timeAgo } from "@/lib/utils"

interface Props {
  review: Review
  onClose: () => void
}

export default function ReviewDetail({ review, onClose }: Props) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [aiReply, setAiReply] = useState<Reply | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { generateReply, createReply, approveReply, sendReply, deleteReply } = useReviewStore()

  const handleGenerate = async (tone?: string) => {
    setIsGenerating(true)
    try {
      const reply = await generateReply(review.id, tone)
      setAiReply(reply)
      setReplies((prev) => [reply, ...prev])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApprove = async (replyId: string) => {
    await approveReply(replyId)
    setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, status: "approved" } : r))
  }

  const handleSend = async (replyId: string) => {
    await sendReply(replyId)
    setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, status: "sent" } : r))
  }

  const handleDelete = async (replyId: string) => {
    await deleteReply(replyId)
    setReplies((prev) => prev.filter((r) => r.id !== replyId))
  }

  const handleManualReply = async (text: string) => {
    const reply = await createReply(review.id, text)
    setReplies((prev) => [...prev, reply])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Review from {review.reviewer_name}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <RatingBadge rating={review.rating} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text">{review.reviewer_name}</span>
              <span className="text-text-muted">·</span>
              <span className="text-xs capitalize text-text-secondary">{review.platform}</span>
              <span className="text-text-muted">·</span>
              <span className="text-xs text-text-muted">{timeAgo(review.created_at)}</span>
            </div>
          </div>
        </div>

        {review.text && (
          <div className="rounded-xl bg-card-secondary p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">{review.text}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {review.sentiment && (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              review.sentiment === "positive" ? "bg-success-bg text-success" :
              review.sentiment === "negative" ? "bg-danger-bg text-danger" :
              "bg-card-secondary text-text-secondary"
            }`}>
              {review.sentiment}
            </span>
          )}
          {review.topics?.map((t) => (
            <span key={t} className="rounded-full bg-card-blue px-3 py-1 text-xs text-text-secondary">
              {t.replace("_", " ")}
            </span>
          ))}
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">AI Reply</h3>
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="flex items-center gap-1 rounded-lg bg-info/10 px-3 py-1.5 text-xs font-medium text-info hover:bg-info/20 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {aiReply ? "Regenerate" : "Generate Reply"}
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                onApprove={handleApprove}
                onSend={handleSend}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <ReplyEditor onSubmit={handleManualReply} />
        </div>
      </div>
    </div>
  )
}
