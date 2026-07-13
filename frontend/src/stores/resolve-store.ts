import { create } from "zustand"
import type { ResolvePolicy } from "@/types/resolve"
import apiClient from "@/lib/api-client"

interface ResolveState {
  policies: ResolvePolicy[]
  total: number
  isLoading: boolean
  fetchPolicies: () => Promise<void>
  createPolicy: (data: { name: string; auto_resolve_after_reply?: boolean; sla_hours?: number; escalate_after_hours?: number }) => Promise<void>
  togglePolicy: (id: string, isActive: boolean) => Promise<void>
  deletePolicy: (id: string) => Promise<void>
}

export const useResolveStore = create<ResolveState>((set, get) => ({
  policies: [], total: 0, isLoading: false,
  fetchPolicies: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/resolve")
    set({ policies: data.policies, total: data.total, isLoading: false })
  },
  createPolicy: async (body) => {
    await apiClient.post("/resolve", body)
    get().fetchPolicies()
  },
  togglePolicy: async (id, isActive) => {
    await apiClient.patch(`/resolve/${id}`, { is_active: isActive })
    get().fetchPolicies()
  },
  deletePolicy: async (id) => {
    await apiClient.delete(`/resolve/${id}`)
    get().fetchPolicies()
  },
}))
