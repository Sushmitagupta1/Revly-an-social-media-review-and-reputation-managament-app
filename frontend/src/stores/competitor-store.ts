import { create } from "zustand"
import type { Competitor } from "@/types/competitor"
import apiClient from "@/lib/api-client"

interface CompetitorState {
  competitors: Competitor[]
  total: number
  isLoading: boolean
  fetchCompetitors: () => Promise<void>
  createCompetitor: (data: { name: string; platform: string; avg_rating?: number; review_count?: number }) => Promise<void>
  deleteCompetitor: (id: string) => Promise<void>
}

export const useCompetitorStore = create<CompetitorState>((set, get) => ({
  competitors: [], total: 0, isLoading: false,
  fetchCompetitors: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/competitors")
    set({ competitors: data.competitors, total: data.total, isLoading: false })
  },
  createCompetitor: async (body) => {
    await apiClient.post("/competitors", body)
    get().fetchCompetitors()
  },
  deleteCompetitor: async (id) => {
    await apiClient.delete(`/competitors/${id}`)
    get().fetchCompetitors()
  },
}))
