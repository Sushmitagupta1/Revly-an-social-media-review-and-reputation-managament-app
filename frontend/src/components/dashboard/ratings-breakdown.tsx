import type { RatingDistribution } from "@/types/dashboard"

interface Props {
  data: RatingDistribution[]
  totalReviews: number
}

const starConfig = [
  { label: "5 Star", color: "#2FA86A" },
  { label: "4 Star", color: "#6BA8FF" },
  { label: "3 Star", color: "#F5D567" },
  { label: "2 Star", color: "#FFAF66" },
  { label: "1 Star", color: "#F56C6C" },
]

export default function RatingsBreakdown({ data, totalReviews }: Props) {
  const reversed = [...data].reverse()

  return (
    <div className="rounded-[24px] bg-card p-6">
      <h3 className="mb-4 text-[15px] font-semibold text-text">Ratings Breakdown</h3>
      <div className="space-y-3">
        {reversed.map((item, index) => {
          const percentage = totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0
          return (
            <div key={item.rating} className="flex items-center gap-3">
              <span className="w-10 text-[12px] font-medium text-text-secondary">{starConfig[index]?.label}</span>
              <div className="flex-1">
                <div className="relative h-2.5 overflow-hidden rounded-full bg-card-secondary">
                  <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: starConfig[index]?.color }} />
                </div>
              </div>
              <span className="w-16 text-right text-[12px] font-medium text-text">
                {item.count} ({percentage}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
