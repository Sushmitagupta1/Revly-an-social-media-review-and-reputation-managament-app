import { useEffect } from "react"
import { useLeaderboardStore } from "@/stores/leaderboard-store"
import LeaderboardTable from "@/components/leaderboard/leaderboard-table"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function LocationLeaderboardPage() {
  const { locations, isLoading, fetchLeaderboard } = useLeaderboardStore()

  useEffect(() => { fetchLeaderboard() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Location Leaderboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Compare performance across all locations</p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : locations.length === 0 ? (
        <EmptyState title="No location data" description="Reviews need location IDs to appear here." />
      ) : (
        <LeaderboardTable locations={locations} />
      )}
    </div>
  )
}
