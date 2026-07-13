import { create } from "zustand"
import type { LocationRanking } from "@/types/competitor"
import apiClient from "@/lib/api-client"

interface LeaderboardState {
  locations: LocationRanking[]
  isLoading: boolean
  fetchLeaderboard: () => Promise<void>
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  locations: [], isLoading: false,
  fetchLeaderboard: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/leaderboard")
    set({ locations: data.locations, isLoading: false })
  },
}))
