import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { RatingDistribution } from "@/types/dashboard"

interface Props {
  data: RatingDistribution[]
}

const COLORS = ["#E53935", "#FF8A3D", "#F4C542", "#5AC8FA", "#12B76A"]

export default function RatingChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text">Rating Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="rating"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickFormatter={(v: number) => `${v}★`}
          />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
            formatter={(value: any) => [`${value} reviews`, "Count"]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
