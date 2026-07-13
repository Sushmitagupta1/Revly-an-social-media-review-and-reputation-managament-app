import ProfileForm from "@/components/account/profile-form"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your account settings</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <ProfileForm />
      </div>
    </div>
  )
}
