import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"

interface TeamMember {
  id: string
  email: string
  full_name: string
  role_name: string | null
  is_active: boolean
}

export default function TeamList() {
  const [members, setMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    apiClient.get("/users/me").then(({ data }) => {
      setMembers([{ ...data, role_name: data.role_name || "Admin", is_active: true }])
    })
  }, [])

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card-secondary text-sm font-bold text-text">
              {m.full_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-text">{m.full_name}</p>
              <p className="text-xs text-text-secondary">{m.email}</p>
            </div>
          </div>
          <Badge variant={m.is_active ? "success" : "secondary"}>{m.role_name || "Member"}</Badge>
        </div>
      ))}
    </div>
  )
}
