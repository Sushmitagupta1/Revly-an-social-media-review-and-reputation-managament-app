import { useAuthStore } from "@/stores/auth-store"
import { LogOut } from "lucide-react"

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="flex h-16 items-center justify-end border-b border-white/10 bg-transparent px-8">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-white/80">{user?.full_name}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
          {user?.full_name?.charAt(0) || "U"}
        </div>
        <button
          onClick={logout}
          className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
