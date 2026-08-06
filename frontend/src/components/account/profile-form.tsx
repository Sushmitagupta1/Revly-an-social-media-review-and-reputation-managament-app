import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import apiClient from "@/lib/api-client"

export default function ProfileForm() {
  const { user, fetchUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "")
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await apiClient.patch("/users/me", { full_name: fullName, avatar_url: avatarUrl || null })
    await fetchUser()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Email</label>
        <Input value={user.email} disabled className="opacity-60" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Full Name</label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Avatar URL</label>
        <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Role</label>
        <Input value={user.role_name || "User"} disabled className="opacity-60" />
      </div>
      <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
    </form>
  )
}
