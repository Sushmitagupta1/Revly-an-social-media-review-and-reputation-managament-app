import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useFilterStore } from "@/stores/filter-store"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"

const navLinks = [
  { to: "/overview", label: "Dashboard" },
  { to: "/location-leaderboard", label: "Location Leaderboard" },
  { to: "/reviews", label: "Reviews" },
  { to: "/inbox", label: "Inbox" },
  { to: "/complaints", label: "Complaints" },
  { to: "/praises", label: "Praises" },
  { to: "/ask-revly", label: "Ask Revly" },
  { to: "/competitors", label: "Competitors" },
  { to: "/reports", label: "Reports" },
  { to: "/automation", label: "Automation" },
  { to: "/notifications", label: "Notifications" },
  { to: "/integrations", label: "Integrations" },
  { to: "/audit-logs", label: "Audit Logs" },
  { to: "/account", label: "Account" },
]

export default function Sidebar() {
  const { selectedBrand, datePreset } = useFilterStore()
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col bg-sidebar">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">R</div>
          <span className="text-lg font-bold text-white">Revly</span>
        </div>

        <div className="space-y-2">
          <button className="w-full rounded-lg bg-sidebar-hover/30 px-3 py-2 text-left text-sm text-white">
            <span className="text-text-muted text-xs">Brand</span>
            <div className="font-medium">{selectedBrand}</div>
          </button>
          <button className="w-full rounded-lg bg-sidebar-hover/30 px-3 py-2 text-left text-sm text-white">
            <span className="text-text-muted text-xs">Time</span>
            <div className="font-medium">{datePreset}</div>
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/account"}
            className={({ isActive }) =>
              cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-hover text-white"
                  : "text-text-secondary hover:bg-sidebar-hover/50 hover:text-white"
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <div className="rounded-xl bg-accent/20 p-4">
          <p className="text-xs font-medium text-accent">Upgrade to Revly Pro</p>
          <p className="mt-1 text-xs text-text-secondary">Unlock AI insights</p>
        </div>
        <Button variant="ghost" className="mt-2 w-full text-text-secondary" onClick={logout}>
          Log out
        </Button>
      </div>
    </aside>
  )
}
