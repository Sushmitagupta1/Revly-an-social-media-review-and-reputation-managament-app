export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread: number
}
