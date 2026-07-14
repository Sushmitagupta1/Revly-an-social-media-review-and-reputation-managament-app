import { Settings } from "lucide-react"
import type { Integration } from "@/types/integration"

interface Props {
  integration: Integration
  config: { id: string; name: string; icon: string; color: string }
  onManage: () => void
}

export default function PlatformCard({ integration, config, onManage }: Props) {
  return (
    <div className="rounded-[20px] bg-white/5 p-6 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] text-[18px] font-bold text-white" style={{ backgroundColor: config.color }}>
            {config.icon}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">{config.name}</p>
            <p className="text-[12px] text-white/40">{integration.account_name}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-white/40">15 Locations</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#20C997]" />
            <span className="text-[11px] font-medium text-[#20C997]">Connected</span>
          </div>
          <p className="mt-1 text-[10px] text-white/30">Last Sync: 2 mins ago</p>
        </div>
        <button
          onClick={onManage}
          className="flex items-center gap-1.5 rounded-[12px] bg-white/5 px-3.5 py-2 text-[12px] font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          <Settings className="h-3.5 w-3.5" />
          Manage →
        </button>
      </div>
    </div>
  )
}
