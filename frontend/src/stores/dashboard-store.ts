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
      const token = localStorage.getItem("access_token")
      const { data } = await apiClient.get<DashboardData>("/dashboard", {
        timeout: 10000,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      console.log("Dashboard data received:", Object.keys(data))
      set({ data, isLoading: false })
    } catch (err: any) {
      console.error("Dashboard fetch failed:", err?.message, err?.code, err?.response?.status)
      set({ isLoading: false })
    }
  },
}))
