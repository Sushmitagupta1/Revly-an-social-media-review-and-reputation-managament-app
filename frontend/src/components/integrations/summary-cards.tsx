import { Plug, MapPin, Clock, ShieldCheck } from "lucide-react"

interface Props {
  connectedCount: number
  totalLocations: number
  lastSync: string
}

export default function SummaryCards({ connectedCount, totalLocations, lastSync }: Props) {
  const cards = [
    { label: "Connected Platforms", value: `${connectedCount} / 6`, icon: Plug, color: "#4A74FF" },
    { label: "Connected Locations", value: totalLocations, icon: MapPin, color: "#20C997" },
    { label: "Last Sync", value: lastSync, icon: Clock, color: "#F59E0B" },
    { label: "Connection Health", value: "Healthy", icon: ShieldCheck, color: "#20C997", dot: true },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-[20px] bg-white/5 p-6 border border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-white/50">{card.label}</p>
            <card.icon className="h-4 w-4" style={{ color: card.color }} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {card.dot && <span className="h-2.5 w-2.5 rounded-full bg-[#20C997]" />}
            <p className="text-[22px] font-bold text-white">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
