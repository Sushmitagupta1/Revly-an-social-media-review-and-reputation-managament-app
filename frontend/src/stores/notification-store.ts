import { create } from "zustand"
import type { Notification } from "@/types/notification"
import apiClient from "@/lib/api-client"

interface NotificationState {
  notifications: Notification[]
  total: number
  unread: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [], total: 0, unread: 0, isLoading: false,
  fetchNotifications: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/notifications")
    set({ notifications: data.notifications, total: data.total, unread: data.unread, isLoading: false })
  },
  markRead: async (id) => {
    await apiClient.patch(`/notifications/${id}/read`)
    get().fetchNotifications()
  },
}))
