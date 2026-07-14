import type { PlatformBreakdown } from "@/types/dashboard"

interface Props {
  data: PlatformBreakdown[]
}

const platformConfig: Record<string, { name: string; bg: string; stars: string }> = {
  google: { name: "Google Business Profile", bg: "bg-card-blue", stars: "★★★★★" },
  zomato: { name: "Zomato", bg: "bg-card-pink", stars: "★★★★☆" },
  swiggy: { name: "Swiggy", bg: "bg-card-orange", stars: "★★★★☆" },
  reelo: { name: "Reelo", bg: "bg-card-purple", stars: "★★★★★" },
}

export default function PlatformBreakdownCard({ data }: Props) {
  return (
    <div className="rounded-[24px] bg-card p-6">
      <h3 className="mb-4 text-[15px] font-semibold text-text">Platform breakdown</h3>
      <div className="grid grid-cols-2 gap-3">
        {data.map((platform) => {
          const config = platformConfig[platform.platform] || { name: platform.platform, bg: "bg-card-secondary", stars: "★★★★★" }
          return (
            <div key={platform.platform} className={`rounded-[16px] ${config.bg} p-4`}>
              <p className="text-[11px] font-medium text-text-secondary">{config.name}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[22px] font-bold text-text">{platform.avg_rating}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-text-muted">{config.stars}</p>
              <p className="mt-1 text-[10px] text-text-secondary">{platform.count} Reviews</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
