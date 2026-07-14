import { useState } from "react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import type { ComplaintLocation, PraiseLocation, TopicCount } from "@/types/dashboard"

interface ComplaintsPraisesProps {
  complaintsCount: number
  praisesCount: number
  complaintsByLocation: ComplaintLocation[]
  praisesByLocation: PraiseLocation[]
  complaintTopics: TopicCount[]
  praiseTopics: TopicCount[]
}

export default function ComplaintsPraisesSection({
  complaintsCount,
  praisesCount,
  complaintsByLocation,
  praisesByLocation,
  complaintTopics,
  praiseTopics,
}: ComplaintsPraisesProps) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ComplaintsCard count={complaintsCount} locations={complaintsByLocation} topics={complaintTopics} />
      <PraisesCard count={praisesCount} locations={praisesByLocation} topics={praiseTopics} />
    </div>
  )
}

function ComplaintsCard({ count, locations, topics }: { count: number; locations: ComplaintLocation[]; topics: TopicCount[] }) {
  const [view, setView] = useState<"location" | "brand">("location")
  const navigate = useNavigate()
  const maxCount = Math.max(...locations.map((l) => l.count), 1)

  return (
    <div className="rounded-[24px] bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text">Complaints</h3>
        <div className="flex gap-1 rounded-[12px] bg-card-secondary p-1">
          <button onClick={() => setView("location")} className={cn("rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all", view === "location" ? "bg-text text-white shadow-md" : "text-text-secondary hover:bg-card hover:text-text")}>At Location</button>
          <button onClick={() => setView("brand")} className={cn("rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all", view === "brand" ? "bg-text text-white shadow-md" : "text-text-secondary hover:bg-card hover:text-text")}>At Brand</button>
        </div>
      </div>

      <div className="mb-4 rounded-[14px] bg-card-blue p-3">
        <p className="text-[12px] text-text-secondary">
          <span className="font-semibold text-text">AI Insight:</span>{" "}
          Pricing and food quality account for 63% of all customer complaints this week.
        </p>
      </div>

      <div className="mb-4">
        <span className="text-[36px] font-bold text-text">{count}</span>
        <p className="text-[12px] text-text-muted">Total Complaints</p>
      </div>

      <div className="space-y-3">
        {view === "location"
          ? locations.slice(0, 4).map((loc) => (
              <div key={loc.location_id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-text">{loc.location_name}</span>
                  <span className="text-[12px] font-bold text-danger">{loc.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                  <div className="h-full rounded-full bg-danger transition-all duration-500" style={{ width: `${(loc.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))
          : topics.length > 0 ? topics.slice(0, 5).map((t) => {
              const maxTopic = Math.max(...topics.map((x) => x.count), 1)
              return (
                <div key={t.topic}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-text">{t.topic}</span>
                    <span className="text-[12px] font-bold text-danger">{t.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                    <div className="h-full rounded-full bg-danger transition-all duration-500" style={{ width: `${(t.count / maxTopic) * 100}%` }} />
                  </div>
                </div>
              )
            }) : (
              <p className="text-[12px] text-text-secondary">No topic data available</p>
            )}
      </div>
      <button onClick={() => navigate("/complaints")} className="mt-4 text-[12px] font-medium text-accent hover:underline">View all Complaints →</button>
    </div>
  )
}

function PraisesCard({ count, locations, topics }: { count: number; locations: PraiseLocation[]; topics: TopicCount[] }) {
  const [view, setView] = useState<"location" | "brand">("location")
  const navigate = useNavigate()
  const maxCount = Math.max(...locations.map((l) => l.count), 1)

  return (
    <div className="rounded-[24px] bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text">Praises</h3>
        <div className="flex gap-1 rounded-[12px] bg-card-secondary p-1">
          <button onClick={() => setView("location")} className={cn("rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all", view === "location" ? "bg-text text-white shadow-md" : "text-text-secondary hover:bg-card hover:text-text")}>At Location</button>
          <button onClick={() => setView("brand")} className={cn("rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all", view === "brand" ? "bg-text text-white shadow-md" : "text-text-secondary hover:bg-card hover:text-text")}>At Brand</button>
        </div>
      </div>

      <div className="mb-4 rounded-[14px] bg-card-green p-3">
        <p className="text-[12px] text-text-secondary">
          <span className="font-semibold text-text">AI Insight:</span>{" "}
          Customers most frequently praise food quality and staff friendliness across all platforms.
        </p>
      </div>

      <div className="mb-4">
        <span className="text-[36px] font-bold text-text">{count}</span>
        <p className="text-[12px] text-text-muted">Total Praises</p>
      </div>

      <div className="space-y-3">
        {view === "location"
          ? locations.slice(0, 4).map((loc) => (
              <div key={loc.location_id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-text">{loc.location_name}</span>
                  <span className="text-[12px] font-bold text-success">{loc.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                  <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(loc.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))
          : topics.length > 0 ? topics.slice(0, 5).map((t) => {
              const maxTopic = Math.max(...topics.map((x) => x.count), 1)
              return (
                <div key={t.topic}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-text">{t.topic}</span>
                    <span className="text-[12px] font-bold text-success">{t.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                    <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(t.count / maxTopic) * 100}%` }} />
                  </div>
                </div>
              )
            }) : (
              <p className="text-[12px] text-text-secondary">No topic data available</p>
            )}
      </div>
      <button onClick={() => navigate("/praises")} className="mt-4 text-[12px] font-medium text-accent hover:underline">View all Praises →</button>
    </div>
  )
}
