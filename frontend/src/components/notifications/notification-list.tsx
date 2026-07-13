import NotificationCard from "./notification-card"
import type { Notification } from "@/types/notification"

interface Props {
  notifications: Notification[]
  onMarkRead: (id: string) => void
}

export default function NotificationList({ notifications, onMarkRead }: Props) {
  return (
    <div className="grid gap-3">
      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} onMarkRead={onMarkRead} />
      ))}
    </div>
  )
}
