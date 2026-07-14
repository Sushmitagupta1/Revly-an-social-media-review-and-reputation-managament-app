import { useEffect } from "react"
import { useCompetitorStore } from "@/stores/competitor-store"
import CompetitorCard from "@/components/competitors/competitor-card"
import CompetitorForm from "@/components/competitors/competitor-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import BackButton from "@/components/shared/back-button"

export default function CompetitorsPage() {
  const { competitors, isLoading, fetchCompetitors, createCompetitor, deleteCompetitor } = useCompetitorStore()

  useEffect(() => { fetchCompetitors() }, [])

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/overview" />
        <h1 className="text-2xl font-bold text-white">Competitors</h1>
        <p className="mt-1 text-sm text-text-secondary">Track and compare competitor performance</p>
      </div>

      <CompetitorForm onSubmit={createCompetitor} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : competitors.length === 0 ? (
        <EmptyState title="No competitors tracked" description="Add your first competitor above to start comparing." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitors.map((c) => (
            <CompetitorCard key={c.id} competitor={c} onDelete={deleteCompetitor} />
          ))}
        </div>
      )}
    </div>
  )
}
