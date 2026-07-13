import { create } from "zustand"
import apiClient from "@/lib/api-client"

interface ReportSummary {
  total_reviews: number
  average_rating: number
  by_sentiment: Record<string, number>
  by_platform: Record<string, number>
  by_rating: Record<number, number>
}

interface ReportState {
  summary: ReportSummary | null
  isLoading: boolean
  fetchSummary: () => Promise<void>
  exportCsv: () => Promise<void>
}

export const useReportStore = create<ReportState>((set) => ({
  summary: null, isLoading: false,
  fetchSummary: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/reports/summary")
    set({ summary: data, isLoading: false })
  },
  exportCsv: async () => {
    const { data } = await apiClient.get("/reports/export", { responseType: "blob" })
    const url = window.URL.createObjectURL(new Blob([data]))
    const a = document.createElement("a")
    a.href = url
    a.download = "report.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  },
}))
