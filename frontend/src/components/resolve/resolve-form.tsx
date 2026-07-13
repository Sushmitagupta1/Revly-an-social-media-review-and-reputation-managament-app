import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { name: string; auto_resolve_after_reply?: boolean; sla_hours?: number; escalate_after_hours?: number }) => void
}

export default function ResolveForm({ onSubmit }: Props) {
  const [name, setName] = useState("")
  const [sla, setSla] = useState("48")
  const [escalate, setEscalate] = useState("")
  const [autoResolve, setAutoResolve] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      sla_hours: parseInt(sla) || 48,
      escalate_after_hours: escalate ? parseInt(escalate) : undefined,
      auto_resolve_after_reply: autoResolve,
    })
    setName("")
    setEscalate("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Add Resolve Policy</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Input placeholder="Policy name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" min="1" placeholder="SLA (hours)" value={sla} onChange={(e) => setSla(e.target.value)} />
        <Input type="number" min="1" placeholder="Escalate after (hours)" value={escalate} onChange={(e) => setEscalate(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={autoResolve} onChange={(e) => setAutoResolve(e.target.checked)} className="rounded" />
          Auto-resolve
        </label>
      </div>
      <Button type="submit" size="sm" disabled={!name.trim()}>Add Policy</Button>
    </form>
  )
}
