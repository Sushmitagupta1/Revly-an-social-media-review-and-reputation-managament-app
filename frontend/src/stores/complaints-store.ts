import { create } from "zustand"
import type { Review } from "@/types/review"
import type { TopicCount } from "@/types/dashboard"
import apiClient from "@/lib/api-client"
import { useFilterStore } from "@/stores/filter-store"

interface ComplaintsState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  topic: string | null
  resolved: boolean | null
  topicCounts: TopicCount[]
  locationCounts: TopicCount[]
  setTopic: (t: string | null) => void
  setResolved: (r: boolean | null) => void
  setPage: (p: number) => void
  fetchComplaints: (locations?: string[], dateFrom?: string | null, dateTo?: string | null) => Promise<void>
  resolveReview: (id: string) => Promise<void>
}

export const useComplaintsStore = create<ComplaintsState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, topic: null, resolved: null, topicCounts: [], locationCounts: [],
  setTopic: (topic) => { set({ topic, page: 1 }); get().fetchComplaints() },
  setResolved: (resolved) => { set({ resolved, page: 1 }); get().fetchComplaints() },
  setPage: (page) => { set({ page }); get().fetchComplaints() },
  fetchComplaints: async (locations?: string[], dateFrom?: string | null, dateTo?: string | null) => {
    set({ isLoading: true })
    const { topic, resolved, page } = get()
    const fs = useFilterStore.getState()
    const useLocations = locations ?? fs.selectedLocations
    const useFrom = dateFrom === undefined ? fs.dateRange.from : dateFrom
    const useTo = dateTo === undefined ? fs.dateRange.to : dateTo
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (topic) params.set("topic", topic)
    if (resolved !== null) params.set("resolved", String(resolved))
    if (useLocations && useLocations.length > 0) params.set("location", useLocations.join(","))
    if (useFrom) params.set("date_from", useFrom)
    if (useTo) params.set("date_to", useTo)
    const { data } = await apiClient.get(`/complaints?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, topicCounts: data.topic_counts || [], locationCounts: data.location_counts || [], isLoading: false })
  },
  resolveReview: async (id) => {
    await apiClient.patch(`/reviews/${id}/resolve`, { is_resolved: true })
    get().fetchComplaints()
  },
}))
