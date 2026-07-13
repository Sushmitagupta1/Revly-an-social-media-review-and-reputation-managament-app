import KpiCard from "@/components/shared/kpi-card"

interface Props {
  total: number
  resolved: number
  avgRating: number
}

export default function ComplaintStats({ total, resolved, avgRating }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard label="Total Complaints" value={total} className="bg-surface border border-border" />
      <KpiCard label="Resolved" value={resolved} className="bg-surface border border-border" />
      <KpiCard label="Avg Rating (Complaints)" value={avgRating.toFixed(1)} className="bg-surface border border-border" />
    </div>
  )
}
