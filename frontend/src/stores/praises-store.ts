import { create } from "zustand"
import type { Review } from "@/types/review"
import type { TopicCount } from "@/types/dashboard"
import apiClient from "@/lib/api-client"
import { useFilterStore } from "@/stores/filter-store"

interface PraisesState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  platform: string | null
  topicCounts: TopicCount[]
  locationCounts: TopicCount[]
  setPlatform: (p: string | null) => void
  setPage: (p: number) => void
  fetchPraises: (locations?: string[], dateFrom?: string | null, dateTo?: string | null) => Promise<void>
}

export const usePraisesStore = create<PraisesState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, platform: null, topicCounts: [], locationCounts: [],
  setPlatform: (platform) => { set({ platform, page: 1 }); get().fetchPraises() },
  setPage: (page) => { set({ page }); get().fetchPraises() },
  fetchPraises: async (locations?: string[], dateFrom?: string | null, dateTo?: string | null) => {
    set({ isLoading: true })
    const { platform, page } = get()
    const fs = useFilterStore.getState()
    const useLocations = locations ?? fs.selectedLocations
    const useFrom = dateFrom === undefined ? fs.dateRange.from : dateFrom
    const useTo = dateTo === undefined ? fs.dateRange.to : dateTo
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (platform) params.set("platform", platform)
    if (useLocations && useLocations.length > 0) params.set("location", useLocations.join(","))
    if (useFrom) params.set("date_from", useFrom)
    if (useTo) params.set("date_to", useTo)
    const { data } = await apiClient.get(`/praises?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, topicCounts: data.topic_counts || [], locationCounts: data.location_counts || [], isLoading: false })
  },
}))
