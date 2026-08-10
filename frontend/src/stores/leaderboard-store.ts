import { create } from "zustand"
import type { LocationRanking } from "@/types/competitor"
import apiClient from "@/lib/api-client"

interface LeaderboardState {
  locations: LocationRanking[]
  isLoading: boolean
  fetchLeaderboard: (params?: { date_from?: string; date_to?: string; locations?: string[] }) => Promise<void>
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  locations: [], isLoading: false,
  fetchLeaderboard: async (params) => {
    set({ isLoading: true })
    const query = new URLSearchParams()
    if (params?.date_from) query.set("date_from", params.date_from)
    if (params?.date_to) query.set("date_to", params.date_to)
    if (params?.locations?.length) query.set("locations", params.locations.join(","))
    const qs = query.toString()
    const { data } = await apiClient.get(qs ? `/leaderboard?${qs}` : "/leaderboard")
    set({ locations: data.locations, isLoading: false })
  },
}))
