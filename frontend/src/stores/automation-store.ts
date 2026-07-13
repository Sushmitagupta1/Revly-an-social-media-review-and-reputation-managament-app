import { create } from "zustand"
import type { AutomationRule } from "@/types/automation"
import apiClient from "@/lib/api-client"

interface AutomationState {
  rules: AutomationRule[]
  total: number
  isLoading: boolean
  fetchRules: () => Promise<void>
  createRule: (data: { name: string; trigger: string; action: string; template?: string }) => Promise<void>
  toggleRule: (id: string, isActive: boolean) => Promise<void>
  deleteRule: (id: string) => Promise<void>
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
  rules: [], total: 0, isLoading: false,
  fetchRules: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/automation")
    set({ rules: data.rules, total: data.total, isLoading: false })
  },
  createRule: async (body) => {
    await apiClient.post("/automation", body)
    get().fetchRules()
  },
  toggleRule: async (id, isActive) => {
    await apiClient.patch(`/automation/${id}`, { is_active: isActive })
    get().fetchRules()
  },
  deleteRule: async (id) => {
    await apiClient.delete(`/automation/${id}`)
    get().fetchRules()
  },
}))
