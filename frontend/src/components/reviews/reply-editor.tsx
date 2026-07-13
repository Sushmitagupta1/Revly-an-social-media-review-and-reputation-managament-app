import { useState } from "react"
import { Send } from "lucide-react"

interface Props {
  onSubmit: (text: string) => void
  isLoading?: boolean
}

export default function ReplyEditor({ onSubmit, isLoading }: Props) {
  const [text, setText] = useState("")

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim())
      setText("")
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-2 text-xs font-medium text-text-secondary">Write your reply</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your reply here..."
        className="w-full rounded-lg border border-border bg-card-secondary p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-info"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="flex items-center gap-2 rounded-lg bg-info px-4 py-2 text-sm font-medium text-white hover:bg-info/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {isLoading ? "Sending..." : "Send Reply"}
        </button>
      </div>
    </div>
  )
}
