import { useState } from "react"
import { ArrowLeft, RefreshCw, Unplug, MapPin, Activity, Zap, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Integration } from "@/types/integration"

interface Props {
  integration: Integration | undefined
  onBack: () => void
}

const platformConfig: Record<string, { name: string; color: string; icon: string }> = {
  google: { name: "Google Business", color: "#4A74FF", icon: "G" },
  zomato: { name: "Zomato", color: "#E04F5F", icon: "Z" },
  swiggy: { name: "Swiggy", color: "#FF8C00", icon: "S" },
  reelo: { name: "Reelo", color: "#8B5CF6", icon: "R" },
}

const mockLocations = [
  { id: "1", name: "Upper Crust Vastrapur", connected: true },
  { id: "2", name: "Upper Crust Vijay Cross", connected: true },
  { id: "3", name: "Sindhu Bhavan", connected: true },
  { id: "4", name: "Prahlad Nagar", connected: true },
  { id: "5", name: "New Outlet", connected: false },
]

export default function ManagePlatform({ integration, onBack }: Props) {
  const [autoSync, setAutoSync] = useState(true)
  const [locations, setLocations] = useState(mockLocations)
  const platform = integration?.platform || "google"
  const config = platformConfig[platform] || { name: platform, color: "#6B7280", icon: "?" }

  const toggleLocation = (id: string) => {
    setLocations((prev) => prev.map((l) => l.id === id ? { ...l, connected: !l.connected } : l))
  }

  const syncStats = [
    { label: "Today's Reviews", value: "46", icon: Activity, color: "#4A74FF" },
    { label: "Negative Reviews", value: "6", icon: Activity, color: "#E04F5F" },
    { label: "Pending Responses", value: "3", icon: Activity, color: "#F59E0B" },
    { label: "Average Rating", value: "4.5", icon: Activity, color: "#20C997" },
  ]

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="rounded-2xl p-2.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] text-[22px] font-bold text-white" style={{ backgroundColor: config.color }}>
            {config.icon}
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-white">{config.name}</h1>
            <p className="text-[13px] text-white/50">{integration?.account_name || "graphics@uppercrust.com"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-[20px] bg-white/5 p-6 border border-white/5">
            <h3 className="mb-4 text-[15px] font-semibold text-white">Connection Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/50">Status</span>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#20C997]" />
                  <span className="text-[13px] font-medium text-[#20C997]">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/50">Last Sync</span>
                <span className="text-[13px] text-white">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/50">Sync Health</span>
                <span className="text-[13px] text-[#20C997]">Healthy</span>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white/5 p-6 border border-white/5">
            <h3 className="mb-4 text-[15px] font-semibold text-white">Connected Locations</h3>
            <div className="space-y-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => toggleLocation(loc.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-all border",
                    loc.connected ? "bg-accent/10 border-accent/30" : "bg-white/5 border-white/5"
                  )}
                >
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-md border-2 transition-all",
                    loc.connected ? "border-accent bg-accent" : "border-white/30"
                  )}>
                    {loc.connected && <span className="text-[8px] text-white">✓</span>}
                  </div>
                  <MapPin className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[13px] font-medium text-white">{loc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[20px] bg-white/5 p-6 border border-white/5">
            <h3 className="mb-4 text-[15px] font-semibold text-white">Sync Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              {syncStats.map((stat) => (
                <div key={stat.label} className="rounded-[14px] bg-white/5 p-4">
                  <p className="text-[11px] text-white/40">{stat.label}</p>
                  <p className="mt-1 text-[22px] font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] bg-white/5 p-6 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-white">Auto Sync</h3>
                <p className="mt-0.5 text-[12px] text-white/40">Every 15 minutes</p>
              </div>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-all",
                  autoSync ? "bg-[#20C997]" : "bg-white/20"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all shadow-md",
                  autoSync ? "left-[22px]" : "left-0.5"
                )} />
              </button>
            </div>
          </div>

          <div className="rounded-[20px] bg-white/5 p-6 border border-white/5">
            <h3 className="mb-4 text-[15px] font-semibold text-white">Actions</h3>
            <div className="space-y-2">
              <button className="flex w-full items-center gap-3 rounded-[14px] bg-accent/10 px-5 py-3.5 text-left text-[13px] font-medium text-accent transition-all hover:bg-accent/20">
                <RefreshCw className="h-4 w-4" />
                Sync Now
              </button>
              <button className="flex w-full items-center gap-3 rounded-[14px] bg-white/5 px-5 py-3.5 text-left text-[13px] font-medium text-white/70 transition-all hover:bg-white/10">
                <Zap className="h-4 w-4" />
                Reconnect
              </button>
              <button className="flex w-full items-center gap-3 rounded-[14px] bg-white/5 px-5 py-3.5 text-left text-[13px] font-medium text-white/70 transition-all hover:bg-white/10">
                <Settings className="h-4 w-4" />
                Connect New Account
              </button>
              <button className="flex w-full items-center gap-3 rounded-[14px] bg-danger/10 px-5 py-3.5 text-left text-[13px] font-medium text-danger transition-all hover:bg-danger/20">
                <Unplug className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
