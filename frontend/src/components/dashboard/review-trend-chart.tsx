import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import type { TrendPoint } from "@/types/dashboard"

const chartTabs = ["Overview", "Sentiment", "Complaints"] as const

function getDaysFromPreset(preset: string): number {
  switch (preset) {
    case "Today": return 1
    case "Yesterday": return 2
    case "Past 7 Days": return 7
    case "Past 30 Days": return 30
    case "Daily": return 7
    case "Weekly": return 28
    case "Monthly": return 90
    case "Quarterly": return 90
    default: return 7
  }
}

function filterTrendByDays(data: TrendPoint[], days: number): TrendPoint[] {
  return data.slice(-days)
}

interface Props {
  sentimentTrend: TrendPoint[]
  complaintsTrend: TrendPoint[]
}

export default function ReviewTrendChart({ sentimentTrend, complaintsTrend }: Props) {
  const { datePreset } = useFilterStore()
  const [activeTab, setActiveTab] = useState<"Overview" | "Sentiment" | "Complaints">("Overview")

  const days = getDaysFromPreset(datePreset)
  const trendData = activeTab === "Complaints"
    ? filterTrendByDays(complaintsTrend, days)
    : filterTrendByDays(sentimentTrend, days)

  const barColor = activeTab === "Complaints" ? "#F8B5AE" : activeTab === "Sentiment" ? "#CFCFD4" : "#73E2A7"

  return (
    <div className="rounded-[24px] bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text">How your reviews are trending</h3>
        <div className="flex gap-1 rounded-[12px] bg-card-secondary p-1">
          {chartTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all",
                activeTab === tab
                  ? "bg-text text-white shadow-md"
                  : "text-text-secondary hover:bg-card hover:text-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-3 text-[12px] text-text-muted">Rating trend & volume</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ECECEC" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickFormatter={(v: string) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
          />
          <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #ECECEC", fontSize: 12, background: "#FFF9F1", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
            labelFormatter={(v: any) => new Date(String(v)).toLocaleDateString()}
          />
          <Bar dataKey="count" fill={barColor} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
