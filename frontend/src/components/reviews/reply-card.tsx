import { Bot, User, Check, Send, Trash2 } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import type { Reply } from "@/types/review"

interface Props {
  reply: Reply
  onApprove?: (id: string) => void
  onSend?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ReplyCard({ reply, onApprove, onSend, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card-secondary/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        {reply.is_ai_generated ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-info/20">
            <Bot className="h-3 w-3 text-info" />
          </span>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
            <User className="h-3 w-3 text-success" />
          </span>
        )}
        <span className="text-xs font-medium text-text-secondary">
          {reply.is_ai_generated ? "AI Generated" : "You"}
        </span>
        <span className="text-text-muted">·</span>
        <span className="text-xs text-text-muted">{timeAgo(reply.created_at)}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
          reply.status === "sent" ? "bg-success-bg text-success" :
          reply.status === "approved" ? "bg-info-bg text-info" :
          "bg-card-secondary text-text-secondary"
        }`}>
          {reply.status}
        </span>
      </div>

      <p className="text-sm text-text leading-relaxed">{reply.text}</p>

      {reply.status === "draft" && (
        <div className="mt-3 flex items-center gap-2">
          {onApprove && (
            <button
              onClick={() => onApprove(reply.id)}
              className="flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/20"
            >
              <Check className="h-3 w-3" /> Approve
            </button>
          )}
          {onSend && (
            <button
              onClick={() => onSend(reply.id)}
              className="flex items-center gap-1 rounded-lg bg-info/10 px-3 py-1.5 text-xs font-medium text-info hover:bg-info/20"
            >
              <Send className="h-3 w-3" /> Send
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(reply.id)}
              className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
