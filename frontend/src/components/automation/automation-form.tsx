import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { name: string; trigger: string; action: string; template?: string }) => void
}

const TRIGGERS = [
  { value: "sentiment_positive", label: "Positive Review" },
  { value: "sentiment_negative", label: "Negative Review" },
  { value: "topic_food", label: "Food Topic" },
  { value: "topic_service", label: "Service Topic" },
  { value: "topic_delivery", label: "Delivery Topic" },
  { value: "topic_urgent", label: "Urgent Topic" },
]

const ACTIONS = [
  { value: "auto_reply", label: "Auto Reply" },
  { value: "flag_urgent", label: "Flag as Urgent" },
  { value: "assign_team", label: "Assign to Team" },
]

export default function AutomationForm({ onSubmit }: Props) {
  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState("sentiment_positive")
  const [action, setAction] = useState("auto_reply")
  const [template, setTemplate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), trigger, action, template: template || undefined })
    setName("")
    setTemplate("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Create Automation Rule</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text">
          {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text">
          {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>
      <Input placeholder="Reply template (optional)" value={template} onChange={(e) => setTemplate(e.target.value)} />
      <Button type="submit" size="sm" disabled={!name.trim()}>Create Rule</Button>
    </form>
  )
}
