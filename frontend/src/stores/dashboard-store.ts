import { create } from "zustand"
import type { DashboardData } from "@/types/dashboard"
import apiClient from "@/lib/api-client"

interface DashboardState {
  data: DashboardData | null
  isLoading: boolean
  fetchDashboard: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.get<DashboardData>("/dashboard")
      set({ data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))
