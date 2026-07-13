import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { TrendPoint } from "@/types/dashboard"

interface Props {
  data: TrendPoint[]
}

export default function SentimentChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text">Review Trend</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4361EE" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickFormatter={(v: string) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
            labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#4361EE"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
