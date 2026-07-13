import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: string | number
  trend?: { value: string; direction: "up" | "down" }
  className?: string
}

export default function KpiCard({ label, value, trend, className }: Props) {
  return (
    <div className={cn("rounded-2xl p-6", className)}>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-bold text-text">{value}</p>
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trend.direction === "up" ? "text-success" : "text-danger")}>
          {trend.direction === "up" ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  )
}
