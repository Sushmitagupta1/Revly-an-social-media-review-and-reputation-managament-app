import { CheckCircle, AlertTriangle, Clock, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Integration } from "@/types/integration"

interface Props {
  integration: Integration
  onSync: (id: string) => void
}

const statusIcons: Record<string, typeof CheckCircle> = {
  active: CheckCircle, inactive: Clock, error: AlertTriangle,
}

const statusColors: Record<string, string> = {
  active: "text-success", inactive: "text-text-muted", error: "text-danger",
}

export default function PlatformCard({ integration, onSync }: Props) {
  const Icon = statusIcons[integration.status] || Clock
  const colorClass = statusColors[integration.status] || "text-text-secondary"

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          <div>
            <h3 className="text-sm font-semibold text-text capitalize">{integration.platform}</h3>
            <p className="text-xs text-text-secondary">{integration.account_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={integration.is_connected ? "default" : "secondary"}>
            {integration.is_connected ? "Connected" : "Disconnected"}
          </Badge>
          {integration.is_connected && (
            <Button variant="ghost" size="sm" onClick={() => onSync(integration.id)}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {integration.last_synced && (
        <p className="mt-3 text-xs text-text-muted">Last synced: {integration.last_synced}</p>
      )}
    </div>
  )
}
