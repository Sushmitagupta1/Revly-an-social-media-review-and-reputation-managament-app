import type { KpiData } from "@/types/dashboard"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Props {
  kpis: KpiData
  complaintsCount: number
}

export default function DashboardKpis({ kpis, complaintsCount }: Props) {
  const cards = [
    { label: "Avg Rating", value: kpis.average_rating.toFixed(1), icon: "⭐", bg: "bg-card-blue", trend: "up" as const, change: "+0.3" },
    { label: "Reviews Collected", value: kpis.total_reviews, icon: "📝", bg: "bg-card-green", trend: "up" as const, change: "+12%" },
    { label: "Negative Reviews", value: complaintsCount, icon: "🔴", bg: "bg-card-pink", trend: "down" as const, change: "-2" },
    { label: "Response Rate", value: `${Math.round(kpis.response_rate)}%`, icon: "💬", bg: "bg-card-yellow", trend: "up" as const, change: "+5%" },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((kpi) => (
        <div key={kpi.label} className={`rounded-[20px] ${kpi.bg} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-medium text-text-secondary">{kpi.label}</p>
              <p className="mt-1.5 text-[36px] font-bold leading-none text-text">{kpi.value}</p>
            </div>
            <span className="text-xl">{kpi.icon}</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {kpi.trend === "up" ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-danger" />
            )}
            <span className={`text-[12px] font-medium ${kpi.trend === "up" ? "text-success" : "text-danger"}`}>
              {kpi.change}
            </span>
            <span className="text-[12px] text-text-muted">vs last period</span>
          </div>
        </div>
      ))}
    </div>
  )
}
