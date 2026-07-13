import { Zap, Trash2, Power } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AutomationRule } from "@/types/automation"

interface Props {
  rule: AutomationRule
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

export default function AutomationCard({ rule, onToggle, onDelete }: Props) {
  return (
    <div className={`rounded-2xl border p-5 transition-colors ${
      rule.is_active ? "border-border bg-surface" : "border-border bg-surface/50 opacity-60"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            rule.is_active ? "bg-info/20 text-info" : "bg-card-secondary text-text-secondary"
          }`}>
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{rule.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{rule.trigger.replace(/_/g, " ")}</Badge>
              <span className="text-xs text-text-muted">→</span>
              <Badge variant="secondary" className="capitalize">{rule.action.replace(/_/g, " ")}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onToggle(rule.id, !rule.is_active)}>
            <Power className={`h-4 w-4 ${rule.is_active ? "text-success" : "text-text-muted"}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(rule.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {rule.template && (
        <p className="mt-3 rounded-lg bg-card-secondary/50 p-3 text-xs text-text-secondary">{rule.template}</p>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
        <span>Executed {rule.execution_count} times</span>
      </div>
    </div>
  )
}
