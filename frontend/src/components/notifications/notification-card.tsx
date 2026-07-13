import { CheckCircle, AlertTriangle, Star, Info } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/types/notification"

interface Props {
  notification: Notification
  onMarkRead: (id: string) => void
}

const typeIcons: Record<string, typeof Star> = {
  review: Star, complaint: AlertTriangle, system: Info,
}

export default function NotificationCard({ notification, onMarkRead }: Props) {
  const Icon = typeIcons[notification.type] || Info

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${
      notification.is_read ? "border-border bg-surface/50" : "border-info/30 bg-surface"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
          notification.is_read ? "bg-card-secondary" : "bg-info/20"
        }`}>
          <Icon className={`h-4 w-4 ${notification.is_read ? "text-text-secondary" : "text-info"}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-text">{notification.title}</h4>
          <p className="mt-0.5 text-xs text-text-secondary">{notification.message}</p>
          <p className="mt-1 text-xs text-text-muted">{timeAgo(notification.created_at)}</p>
        </div>
        {!notification.is_read && (
          <Button variant="ghost" size="sm" onClick={() => onMarkRead(notification.id)}>
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
