import { useAuthStore } from "@/stores/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Header() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-sidebar/50 px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">{user?.full_name}</span>
        <Avatar>
          <AvatarFallback className="bg-info text-white">
            {user?.full_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
