import { create } from "zustand"
import type { Review } from "@/types/review"
import type { TopicCount } from "@/types/dashboard"
import apiClient from "@/lib/api-client"

interface PraisesState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  platform: string | null
  topicCounts: TopicCount[]
  setPlatform: (p: string | null) => void
  setPage: (p: number) => void
  fetchPraises: (locations?: string[]) => Promise<void>
}

export const usePraisesStore = create<PraisesState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, platform: null, topicCounts: [],
  setPlatform: (platform) => { set({ platform, page: 1 }); get().fetchPraises() },
  setPage: (page) => { set({ page }); get().fetchPraises() },
  fetchPraises: async (locations?: string[]) => {
    set({ isLoading: true })
    const { platform, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (platform) params.set("platform", platform)
    if (locations && locations.length > 0) params.set("location", locations.join(","))
    const { data } = await apiClient.get(`/praises?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, topicCounts: data.topic_counts || [], isLoading: false })
  },
}))
