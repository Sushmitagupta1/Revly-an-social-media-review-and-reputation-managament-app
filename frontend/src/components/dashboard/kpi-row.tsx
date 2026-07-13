import KpiCard from "@/components/shared/kpi-card"
import type { KpiData } from "@/types/dashboard"

interface Props {
  kpis: KpiData
}

export default function KpiRow({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Total Reviews"
        value={kpis.total_reviews.toLocaleString()}
        className="bg-card"
      />
      <KpiCard
        label="Average Rating"
        value={`⭐ ${kpis.average_rating}`}
        className="bg-card-green"
      />
      <KpiCard
        label="Response Rate"
        value={`${kpis.response_rate}%`}
        className="bg-card-blue"
      />
      <KpiCard
        label="Avg Response Time"
        value={`${kpis.avg_response_hours}h`}
        className="bg-card-yellow"
      />
    </div>
  )
}
