import { useState } from "react"
import { Send } from "lucide-react"

interface Props {
  onSend: (message: string) => void
  isLoading?: boolean
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [text, setText] = useState("")

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim())
      setText("")
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        placeholder="Ask Revly anything about your reviews..."
        className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
        disabled={isLoading}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || isLoading}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-info text-white hover:bg-info/90 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
