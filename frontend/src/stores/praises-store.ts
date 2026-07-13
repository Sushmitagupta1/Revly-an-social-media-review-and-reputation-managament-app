import { create } from "zustand"
import type { Review } from "@/types/review"
import apiClient from "@/lib/api-client"

interface PraisesState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  platform: string | null
  setPlatform: (p: string | null) => void
  setPage: (p: number) => void
  fetchPraises: () => Promise<void>
}

export const usePraisesStore = create<PraisesState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, platform: null,
  setPlatform: (platform) => { set({ platform, page: 1 }); get().fetchPraises() },
  setPage: (page) => { set({ page }); get().fetchPraises() },
  fetchPraises: async () => {
    set({ isLoading: true })
    const { platform, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (platform) params.set("platform", platform)
    const { data } = await apiClient.get(`/praises?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, isLoading: false })
  },
}))
