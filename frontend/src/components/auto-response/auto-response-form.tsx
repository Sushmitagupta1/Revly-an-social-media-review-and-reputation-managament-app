import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { sentiment: string; topic: string; template: string }) => void
}

const SENTIMENTS = ["positive", "negative", "neutral"]
const TOPICS = ["food", "service", "delivery", "ambiance", "general"]

export default function AutoResponseForm({ onSubmit }: Props) {
  const [sentiment, setSentiment] = useState("positive")
  const [topic, setTopic] = useState("food")
  const [template, setTemplate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!template.trim()) return
    onSubmit({ sentiment, topic, template: template.trim() })
    setTemplate("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Add Auto-Response Template</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text">
          {SENTIMENTS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text">
          {TOPICS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <Input placeholder="Response template" value={template} onChange={(e) => setTemplate(e.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={!template.trim()}>Add Template</Button>
    </form>
  )
}
