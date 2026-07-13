import KpiCard from "@/components/shared/kpi-card"

interface Props {
  total: number
  avgRating: number
}

export default function PraiseStats({ total, avgRating }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <KpiCard label="Total Praises" value={total} className="bg-surface border border-border" />
      <KpiCard label="Avg Rating (Praises)" value={avgRating.toFixed(1)} className="bg-surface border border-border" />
    </div>
  )
}
