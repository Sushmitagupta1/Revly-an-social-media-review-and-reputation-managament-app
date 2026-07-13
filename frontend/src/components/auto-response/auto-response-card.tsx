import { Trash2, Power } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AutoResponse } from "@/types/auto-response"

interface Props {
  response: AutoResponse
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

const sentimentColors: Record<string, string> = {
  positive: "bg-success/20 text-success",
  negative: "bg-danger/20 text-danger",
  neutral: "bg-lavender/20 text-lavender",
}

export default function AutoResponseCard({ response, onToggle, onDelete }: Props) {
  return (
    <div className={`rounded-2xl border p-4 transition-colors ${
      response.is_active ? "border-border bg-surface" : "border-border bg-surface/50 opacity-60"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${sentimentColors[response.sentiment] || "bg-card-secondary"}`}>
            <span className="text-xs font-bold uppercase">{response.sentiment.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{response.sentiment}</Badge>
              <Badge variant="secondary" className="capitalize">{response.topic}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onToggle(response.id, !response.is_active)}>
            <Power className={`h-4 w-4 ${response.is_active ? "text-success" : "text-text-muted"}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(response.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-card-secondary/50 p-3 text-xs text-text-secondary">{response.template}</p>
    </div>
  )
}
