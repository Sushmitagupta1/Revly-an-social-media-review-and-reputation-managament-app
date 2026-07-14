import { useEffect, useRef } from "react"
import { Trash2 } from "lucide-react"
import { useChatStore } from "@/stores/chat-store"
import ChatMessage from "@/components/ai/chat-message"
import ChatInput from "@/components/ai/chat-input"
import SuggestedQuestions from "@/components/ai/suggested-questions"
import LoadingSpinner from "@/components/shared/loading-spinner"
import BackButton from "@/components/shared/back-button"

export default function AskRevlyPage() {
  const { messages, suggestions, isLoading, fetchHistory, sendMessage, clearHistory } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <BackButton to="/overview" />
          <h1 className="text-2xl font-bold text-white">Ask Revly</h1>
          <p className="mt-1 text-sm text-text-secondary">AI-powered insights about your reviews</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-card-secondary"
          >
            <Trash2 className="h-3 w-3" /> Clear chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface p-6">
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-info/10">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="text-lg font-semibold text-text">Hi, I'm Revly</h2>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              Ask me anything about your customer reviews, sentiment trends, or location performance.
            </p>
            <div className="mt-6">
              <SuggestedQuestions
                suggestions={suggestions.length > 0 ? suggestions : [
                  "What are the most common complaints this week?",
                  "How is our sentiment trending?",
                  "Which location needs attention?",
                  "Draft a reply to my latest review",
                ]}
                onSelect={sendMessage}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/20">
                  <LoadingSpinner />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mt-4">
        {suggestions.length > 0 && messages.length > 0 && (
          <div className="mb-3">
            <SuggestedQuestions suggestions={suggestions} onSelect={sendMessage} />
          </div>
        )}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
