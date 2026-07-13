import { Shield, Star, MapPin, Users, Settings, Link, Zap } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import type { AuditLog } from "@/types/audit-log"

interface Props {
  log: AuditLog
}

const actionIcons: Record<string, typeof Shield> = {
  reply_sent: Star,
  review_resolved: Shield,
  location_added: MapPin,
  competitor_tracked: Users,
  settings_updated: Settings,
  integration_connected: Link,
  auto_reply_triggered: Zap,
}

const actionColors: Record<string, string> = {
  reply_sent: "bg-success/20 text-success",
  review_resolved: "bg-info/20 text-info",
  location_added: "bg-lavender/20 text-lavender",
  competitor_tracked: "bg-terracotta/20 text-terracotta",
  settings_updated: "bg-warning/20 text-warning",
  integration_connected: "bg-success/20 text-success",
  auto_reply_triggered: "bg-info/20 text-info",
}

export default function AuditLogCard({ log }: Props) {
  const Icon = actionIcons[log.action] || Shield
  const colorClass = actionColors[log.action] || "bg-card-secondary text-text-secondary"

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-text">{log.details || log.action}</h4>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
            <span className="font-medium text-text">{log.user_name}</span>
            <span>·</span>
            <span className="capitalize">{log.entity_type}</span>
            <span>·</span>
            <span>{timeAgo(log.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
