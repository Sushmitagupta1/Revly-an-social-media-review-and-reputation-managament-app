import { Trash2, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Integration } from "@/types/integration"

interface Props {
  integration: Integration
  onToggle: (id: string, isConnected: boolean) => void
  onDelete: (id: string) => void
}

const platformColors: Record<string, string> = {
  google: "bg-info/20 text-info",
  zomato: "bg-terracotta/20 text-terracotta",
  swiggy: "bg-warning/20 text-warning",
  reelo: "bg-lavender/20 text-lavender",
}

const platformLogos: Record<string, string> = {
  google: "G", zomato: "Z", swiggy: "S", reelo: "R",
}

export default function IntegrationCard({ integration, onToggle, onDelete }: Props) {
  const colorClass = platformColors[integration.platform] || "bg-card-secondary text-text-secondary"

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${colorClass}`}>
            {platformLogos[integration.platform] || integration.platform.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{integration.account_name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{integration.platform}</Badge>
              <Badge variant={integration.status === "active" ? "default" : integration.status === "error" ? "destructive" : "secondary"}>
                {integration.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onToggle(integration.id, !integration.is_connected)}>
            {integration.is_connected ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-text-muted" />
            )}
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(integration.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {integration.last_synced && (
        <p className="mt-3 text-xs text-text-muted">Last synced: {integration.last_synced}</p>
      )}
    </div>
  )
}
