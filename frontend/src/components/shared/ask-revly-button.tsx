import { useState } from "react"
import { X, Send, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "ai"
  content: string
}

export default function AskRevlyButton() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your recent reviews, customers are happiest with food quality and staff friendliness. The main areas for improvement are pricing perception and delivery times.",
        "Your sentiment trend shows a 12% improvement in positive reviews over the past week. The Swiggy platform has the highest average rating at 4.2 stars.",
        "I recommend focusing on the Vastrapur location - it has the most complaints but also shows the most potential for improvement with targeted service training.",
        "Across all platforms, 63% of negative reviews mention pricing. Consider reviewing your menu pricing strategy or adding value propositions in your responses.",
      ]
      const aiMsg = responses[Math.floor(Math.random() * responses.length)]
      setMessages((prev) => [...prev, { role: "ai", content: aiMsg }])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[14px] bg-accent px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-105"
      >
        <Sparkles className="h-4 w-4" />
        Ask Revly
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex h-[600px] w-full max-w-lg flex-col rounded-[28px] bg-sidebar shadow-2xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <span className="text-[16px] font-semibold text-white">Ask Revly</span>
                  <p className="text-[11px] text-white/40">AI-powered review insights</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-2xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <Sparkles className="h-8 w-8 text-accent" />
                  </div>
                  <p className="text-[16px] font-semibold text-white">What would you like to know?</p>
                  <p className="mt-1 text-[13px] text-white/40">Ask about your reviews, ratings, or customer sentiment</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["How are my reviews this week?", "Which location needs attention?", "What do customers complain about?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="rounded-2xl bg-white/5 px-4 py-2 text-[12px] text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-5 py-3 text-[14px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-accent text-white"
                        : "bg-white/10 text-white/80"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span className="text-[13px] text-white/50">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="flex items-center gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about your reviews..."
                  className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-5 py-3 text-[14px] text-white placeholder-white/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
