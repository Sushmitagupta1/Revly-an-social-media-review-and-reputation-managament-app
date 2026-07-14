import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, MapPin, Star, Settings, X, Zap } from "lucide-react"

const quickNav = [
  { to: "/overview", label: "Dashboard", icon: LayoutDashboard },
  { to: "/location-leaderboard", label: "Leaderboard", icon: MapPin },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/account", label: "Account", icon: Settings },
]

export default function OneTapOpener() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {open && (
        <div className="mb-3 space-y-2">
          {quickNav.map((item) => (
            <button
              key={item.to}
              onClick={() => {
                navigate(item.to)
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#FFF9F1] px-5 py-3 text-sm font-medium text-text shadow-lg shadow-black/10 transition-all hover:scale-105 border border-[#F0E6D8]"
            >
              <item.icon className="h-4 w-4 text-accent" />
              {item.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_0_30px_rgba(255,106,43,0.4)] transition-all hover:scale-110"
      >
        {open ? <X className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
      </button>
    </div>
  )
}
