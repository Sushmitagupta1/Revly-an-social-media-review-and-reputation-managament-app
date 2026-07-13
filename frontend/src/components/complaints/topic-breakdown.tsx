import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Props {
  data: { topic: string; count: number }[]
}

const COLORS = ["#EF4444", "#F97316", "#EAB308", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"]

export default function TopicBreakdown({ data }: Props) {
  if (data.length === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold text-text">Complaints by Topic</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 12 }} />
          <YAxis type="category" dataKey="topic" tick={{ fill: "#CBD5E1", fontSize: 12 }} width={80} />
          <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
