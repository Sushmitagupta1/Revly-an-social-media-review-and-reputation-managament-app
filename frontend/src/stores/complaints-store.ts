import { create } from "zustand"
import type { Review } from "@/types/review"
import apiClient from "@/lib/api-client"

interface ComplaintsState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  topic: string | null
  resolved: boolean | null
  setTopic: (t: string | null) => void
  setResolved: (r: boolean | null) => void
  setPage: (p: number) => void
  fetchComplaints: () => Promise<void>
  resolveReview: (id: string) => Promise<void>
}

export const useComplaintsStore = create<ComplaintsState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, topic: null, resolved: null,
  setTopic: (topic) => { set({ topic, page: 1 }); get().fetchComplaints() },
  setResolved: (resolved) => { set({ resolved, page: 1 }); get().fetchComplaints() },
  setPage: (page) => { set({ page }); get().fetchComplaints() },
  fetchComplaints: async () => {
    set({ isLoading: true })
    const { topic, resolved, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (topic) params.set("topic", topic)
    if (resolved !== null) params.set("resolved", String(resolved))
    const { data } = await apiClient.get(`/complaints?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, isLoading: false })
  },
  resolveReview: async (id) => {
    await apiClient.patch(`/reviews/${id}/resolve`, { is_resolved: true })
    get().fetchComplaints()
  },
}))
