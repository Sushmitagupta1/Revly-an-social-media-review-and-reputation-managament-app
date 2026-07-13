import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const links = [
  { to: "/account/profile", label: "Profile" },
  { to: "/account/locations", label: "Locations" },
  { to: "/account/team", label: "Team" },
  { to: "/account/auto-response", label: "Auto Response" },
  { to: "/account/platform-integration", label: "Platform Integration" },
  { to: "/account/resolve", label: "Resolve" },
]

export default function AccountLayout() {
  return (
    <div className="flex gap-6">
      <nav className="w-56 shrink-0 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
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
        <button className="mt-4 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger-bg">
          Log out
        </button>
      </nav>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
