import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { PlatformBreakdown } from "@/types/dashboard"

interface Props {
  data: PlatformBreakdown[]
}

const COLORS = ["#4361EE", "#E53935", "#8B5CF6", "#12B76A", "#FF8A3D"]

export default function PlatformChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text">By Platform</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="count"
            nameKey="platform"
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
            formatter={(value: any, name: any) => [`${value} reviews`, name]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-text-secondary capitalize">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
