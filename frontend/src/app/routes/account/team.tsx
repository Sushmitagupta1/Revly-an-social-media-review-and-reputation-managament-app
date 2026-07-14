import TeamList from "@/components/account/team-list"
import BackButton from "@/components/shared/back-button"

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/account" />
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your team members</p>
      </div>
      <TeamList />
    </div>
  )
}
