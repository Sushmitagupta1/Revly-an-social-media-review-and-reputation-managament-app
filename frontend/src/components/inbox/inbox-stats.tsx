import KpiCard from "@/components/shared/kpi-card"

interface Props {
  total: number
  urgent: number
}

export default function InboxStats({ total, urgent }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard label="Needs Reply" value={total} className="bg-surface border border-border" />
      <KpiCard label="Urgent (1-2★)" value={urgent} className="bg-surface border border-border" />
      <KpiCard label="Response Rate" value={total > 0 ? `${Math.round((1 - total / 75) * 100)}%` : "100%"} className="bg-surface border border-border" />
    </div>
  )
}
