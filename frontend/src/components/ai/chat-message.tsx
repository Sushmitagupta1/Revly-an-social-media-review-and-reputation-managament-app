import { Bot, User } from "lucide-react"
import type { ChatMessage as ChatMessageType } from "@/types/chat"
import { timeAgo } from "@/lib/utils"

interface Props {
  message: ChatMessageType
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info/20">
          <Bot className="h-4 w-4 text-info" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-info text-white"
            : "bg-card text-text"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={`mt-1 text-[10px] ${isUser ? "text-white/60" : "text-text-muted"}`}>
          {timeAgo(message.created_at)}
        </p>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-secondary">
          <User className="h-4 w-4 text-text-secondary" />
        </div>
      )}
    </div>
  )
}
