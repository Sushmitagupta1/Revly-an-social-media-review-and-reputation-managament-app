import { Trash2, Power, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ResolvePolicy } from "@/types/resolve"

interface Props {
  policy: ResolvePolicy
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

export default function ResolveCard({ policy, onToggle, onDelete }: Props) {
  return (
    <div className={`rounded-2xl border p-5 transition-colors ${
      policy.is_active ? "border-border bg-surface" : "border-border bg-surface/50 opacity-60"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">{policy.name}</h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>SLA: {policy.sla_hours}h</span>
            </div>
            {policy.escalate_after_hours && (
              <span>Escalate: {policy.escalate_after_hours}h</span>
            )}
            {policy.auto_resolve_after_reply && (
              <Badge variant="secondary">Auto-resolve</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onToggle(policy.id, !policy.is_active)}>
            <Power className={`h-4 w-4 ${policy.is_active ? "text-success" : "text-text-muted"}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(policy.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
