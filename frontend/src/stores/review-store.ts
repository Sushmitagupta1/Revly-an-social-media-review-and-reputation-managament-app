import { create } from "zustand"
import type { Review, ReviewListResponse, ReviewStats, Reply } from "@/types/review"
import apiClient from "@/lib/api-client"

interface ReviewState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  stats: ReviewStats | null
  isLoading: boolean
  filters: {
    search: string
    platform: string | null
    rating: number | null
    sentiment: string | null
  }
  setFilters: (filters: Partial<ReviewState["filters"]>) => void
  setPage: (page: number) => void
  fetchReviews: () => Promise<void>
  fetchStats: () => Promise<void>
  generateReply: (reviewId: string, tone?: string) => Promise<Reply>
  createReply: (reviewId: string, text: string) => Promise<Reply>
  approveReply: (replyId: string) => Promise<void>
  sendReply: (replyId: string) => Promise<void>
  deleteReply: (replyId: string) => Promise<void>
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  total: 0,
  page: 1,
  pages: 1,
  stats: null,
  isLoading: false,
  filters: { search: "", platform: null, rating: null, sentiment: null },

  setFilters: (filters) => {
    set((s) => ({ filters: { ...s.filters, ...filters }, page: 1 }))
    get().fetchReviews()
  },

  setPage: (page) => {
    set({ page })
    get().fetchReviews()
  },

  fetchReviews: async () => {
    set({ isLoading: true })
    const { filters, page } = get()
    const params = new URLSearchParams()
    if (filters.search) params.set("search", filters.search)
    if (filters.platform) params.set("platform", filters.platform)
    if (filters.rating) params.set("rating", String(filters.rating))
    if (filters.sentiment) params.set("sentiment", filters.sentiment)
    params.set("page", String(page))
    params.set("limit", "20")

    const { data } = await apiClient.get<ReviewListResponse>(`/reviews?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, isLoading: false })
  },

  fetchStats: async () => {
    const { data } = await apiClient.get<ReviewStats>("/reviews/stats")
    set({ stats: data })
  },

  generateReply: async (reviewId, tone = "professional") => {
    const { data } = await apiClient.post<Reply>(`/reviews/${reviewId}/replies/generate`, { tone })
    return data
  },

  createReply: async (reviewId, text) => {
    const { data } = await apiClient.post<Reply>(`/reviews/${reviewId}/replies`, { text })
    return data
  },

  approveReply: async (replyId) => {
    await apiClient.patch(`/replies/${replyId}`, { status: "approved" })
  },

  sendReply: async (replyId) => {
    await apiClient.patch(`/replies/${replyId}`, { status: "sent" })
  },

  deleteReply: async (replyId) => {
    await apiClient.delete(`/replies/${replyId}`)
  },
}))
