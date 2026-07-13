import { useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"
import NotificationList from "@/components/notifications/notification-list"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"

export default function NotificationsPage() {
  const { notifications, unread, isLoading, fetchNotifications, markRead } = useNotificationStore()

  useEffect(() => { fetchNotifications() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-text-secondary">Stay updated on your reputation</p>
        </div>
        {unread > 0 && <Badge variant="default">{unread} unread</Badge>}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" />
      ) : (
        <NotificationList notifications={notifications} onMarkRead={markRead} />
      )}
    </div>
  )
}
