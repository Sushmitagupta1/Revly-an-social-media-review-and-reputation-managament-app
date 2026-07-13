import { create } from "zustand"
import type { Integration } from "@/types/integration"
import apiClient from "@/lib/api-client"

interface IntegrationState {
  integrations: Integration[]
  total: number
  isLoading: boolean
  fetchIntegrations: () => Promise<void>
  createIntegration: (data: { platform: string; account_name: string }) => Promise<void>
  toggleConnection: (id: string, isConnected: boolean) => Promise<void>
  deleteIntegration: (id: string) => Promise<void>
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: [], total: 0, isLoading: false,
  fetchIntegrations: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/integrations")
    set({ integrations: data.integrations, total: data.total, isLoading: false })
  },
  createIntegration: async (body) => {
    await apiClient.post("/integrations", body)
    get().fetchIntegrations()
  },
  toggleConnection: async (id, isConnected) => {
    await apiClient.patch(`/integrations/${id}`, { is_connected: isConnected, status: isConnected ? "active" : "inactive" })
    get().fetchIntegrations()
  },
  deleteIntegration: async (id) => {
    await apiClient.delete(`/integrations/${id}`)
    get().fetchIntegrations()
  },
}))
