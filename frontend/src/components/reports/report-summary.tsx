import KpiCard from "@/components/shared/kpi-card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface Props {
  summary: {
    total_reviews: number
    average_rating: number
    by_sentiment: Record<string, number>
    by_platform: Record<string, number>
    by_rating: Record<number, number>
  }
}

const SENTIMENT_COLORS: Record<string, string> = { positive: "#22C55E", neutral: "#94A3B8", negative: "#EF4444" }

export default function ReportSummary({ summary }: Props) {
  const sentimentData = Object.entries(summary.by_sentiment).map(([name, value]) => ({ name, value }))
  const ratingData = Object.entries(summary.by_rating).map(([name, value]) => ({ name: `${name}★`, value }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Reviews" value={summary.total_reviews} className="bg-surface border border-border" />
        <KpiCard label="Average Rating" value={`${summary.average_rating}★`} className="bg-surface border border-border" />
        <KpiCard label="Positive" value={summary.by_sentiment.positive || 0} className="bg-surface border border-border" />
        <KpiCard label="Negative" value={summary.by_sentiment.negative || 0} className="bg-surface border border-border" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingData}>
              <XAxis dataKey="name" tick={{ fill: "#CBD5E1", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text">Sentiment Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                {sentimentData.map((entry) => (
                  <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || "#94A3B8"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
