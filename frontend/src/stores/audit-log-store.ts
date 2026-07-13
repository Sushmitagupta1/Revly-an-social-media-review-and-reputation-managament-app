import { create } from "zustand"
import type { AuditLog } from "@/types/audit-log"
import apiClient from "@/lib/api-client"

interface AuditLogState {
  logs: AuditLog[]
  total: number
  isLoading: boolean
  actionFilter: string | null
  entityFilter: string | null
  setActionFilter: (f: string | null) => void
  setEntityFilter: (f: string | null) => void
  fetchLogs: () => Promise<void>
}

export const useAuditLogStore = create<AuditLogState>((set, get) => ({
  logs: [], total: 0, isLoading: false, actionFilter: null, entityFilter: null,
  setActionFilter: (f) => { set({ actionFilter: f }); get().fetchLogs() },
  setEntityFilter: (f) => { set({ entityFilter: f }); get().fetchLogs() },
  fetchLogs: async () => {
    set({ isLoading: true })
    const { actionFilter, entityFilter } = get()
    const params = new URLSearchParams()
    if (actionFilter) params.set("action", actionFilter)
    if (entityFilter) params.set("entity_type", entityFilter)
    const qs = params.toString()
    const { data } = await apiClient.get(`/audit-logs${qs ? `?${qs}` : ""}`)
    set({ logs: data.logs, total: data.total, isLoading: false })
  },
}))
