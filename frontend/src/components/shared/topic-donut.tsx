import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { TopicCount } from "@/types/dashboard"

interface Props {
  data: TopicCount[]
  maxItems?: number
}

const COLORS = ["#12B76A", "#4361EE", "#FF8A3D", "#8B5CF6", "#F4C542", "#E53935", "#5AC8FA", "#F472B6"]

export default function TopicDonut({ data, maxItems = 6 }: Props) {
  const items = [...data].sort((a, b) => b.count - a.count).slice(0, maxItems)
  const total = items.reduce((s, t) => s + t.count, 0)

  if (items.length === 0 || total === 0) {
    return <p className="text-[13px] text-text-secondary">No data available</p>
  }

  const chartData = items.map((t) => ({ name: t.topic, value: t.count }))

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={68}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
              formatter={(value: any, name: any) => [`${value} reviews`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-bold leading-none text-text">{total}</span>
          <span className="mt-1 text-[11px] text-text-secondary">Total</span>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {items.map((t, i) => (
          <div key={t.topic} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12px] font-medium text-text">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {t.topic}
            </span>
            <span className="text-[12px] font-bold text-text">{t.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
