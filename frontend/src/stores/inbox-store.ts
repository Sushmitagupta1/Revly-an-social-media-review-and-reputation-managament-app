import { create } from "zustand"
import type { Review } from "@/types/review"
import apiClient from "@/lib/api-client"

interface InboxState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  priority: string | null
  setPriority: (p: string | null) => void
  setPage: (p: number) => void
  fetchInbox: () => Promise<void>
  resolveReview: (id: string) => Promise<void>
}

export const useInboxStore = create<InboxState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, priority: null,
  setPriority: (priority) => { set({ priority, page: 1 }); get().fetchInbox() },
  setPage: (page) => { set({ page }); get().fetchInbox() },
  fetchInbox: async () => {
    set({ isLoading: true })
    const { priority, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (priority) params.set("priority", priority)
    const { data } = await apiClient.get(`/inbox?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, isLoading: false })
  },
  resolveReview: async (id) => {
    await apiClient.patch(`/reviews/${id}/resolve`, { is_resolved: true })
    get().fetchInbox()
  },
}))
