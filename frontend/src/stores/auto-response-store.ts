import { create } from "zustand"
import type { AutoResponse } from "@/types/auto-response"
import apiClient from "@/lib/api-client"

interface AutoResponseState {
  responses: AutoResponse[]
  total: number
  isLoading: boolean
  fetchResponses: () => Promise<void>
  createResponse: (data: { sentiment: string; topic: string; template: string }) => Promise<void>
  updateResponse: (id: string, data: { template?: string; is_active?: boolean }) => Promise<void>
  deleteResponse: (id: string) => Promise<void>
}

export const useAutoResponseStore = create<AutoResponseState>((set, get) => ({
  responses: [], total: 0, isLoading: false,
  fetchResponses: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/auto-responses")
    set({ responses: data.responses, total: data.total, isLoading: false })
  },
  createResponse: async (body) => {
    await apiClient.post("/auto-responses", body)
    get().fetchResponses()
  },
  updateResponse: async (id, body) => {
    await apiClient.patch(`/auto-responses/${id}`, body)
    get().fetchResponses()
  },
  deleteResponse: async (id) => {
    await apiClient.delete(`/auto-responses/${id}`)
    get().fetchResponses()
  },
}))
