import { NavLink, Outlet } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"
import { User, MapPin, Users, Zap, Plug, CheckCircle } from "lucide-react"

const links = [
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/locations", label: "Locations", icon: MapPin },
  { to: "/account/team", label: "Team", icon: Users },
  { to: "/account/auto-response", label: "Auto Response", icon: Zap },
  { to: "/account/platform-integration", label: "Platform Integration", icon: Plug },
  { to: "/account/resolve", label: "Resolve", icon: CheckCircle },
]

export default function AccountLayout() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex gap-8 p-8">
      <nav className="w-56 shrink-0 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[14px] px-4 py-3 text-[13px] font-medium transition-all",
                isActive
                  ? "bg-accent text-white shadow-[0_0_25px_rgba(255,106,43,0.3)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="mt-4 flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-[13px] font-medium text-danger/70 transition-all hover:bg-danger/10 hover:text-danger"
        >
          Log out
        </button>
      </nav>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
