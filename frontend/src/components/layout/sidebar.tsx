import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useFilterStore } from "@/stores/filter-store"
import DateFilter from "@/components/layout/date-filter"
import LocationFilter from "@/components/layout/location-filter"
import { Building2, LayoutDashboard, MapPin, Star, Settings } from "lucide-react"

const navLinks = [
  { to: "/overview", label: "Dashboard", icon: LayoutDashboard },
  { to: "/location-leaderboard", label: "Location Leaderboard", icon: MapPin },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/account", label: "Account", icon: Settings },
]

export default function Sidebar() {
  const { selectedBrand } = useFilterStore()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col bg-sidebar">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-3">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Revly" className="h-20 w-auto rounded-2xl object-contain" />
          </div>
        </div>

        <div className="space-y-2.5">
          <button className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10 border border-white/5">
            <Building2 className="h-4 w-4 text-accent" />
            <div className="flex-1 min-w-0">
              <span className="text-white/40 text-[10px] uppercase tracking-wider">Brand</span>
              <div className="font-medium truncate">{selectedBrand}</div>
            </div>
          </button>
          <LocationFilter />
          <DateFilter />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/account"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-accent text-white shadow-[0_0_25px_rgba(255,106,43,0.4)]"
                  : "text-[#AAB6D5] hover:bg-white/5 hover:text-white"
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
