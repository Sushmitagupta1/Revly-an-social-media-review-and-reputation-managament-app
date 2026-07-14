import { useEffect } from "react"
import { useResolveStore } from "@/stores/resolve-store"
import ResolveCard from "@/components/resolve/resolve-card"
import ResolveForm from "@/components/resolve/resolve-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import BackButton from "@/components/shared/back-button"

export default function ResolvePage() {
  const { policies, isLoading, fetchPolicies, createPolicy, togglePolicy, deletePolicy } = useResolveStore()

  useEffect(() => { fetchPolicies() }, [])

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/account" />
        <h1 className="text-2xl font-bold text-white">Resolve Policies</h1>
        <p className="mt-1 text-sm text-text-secondary">Configure how and when reviews are resolved</p>
      </div>

      <ResolveForm onSubmit={createPolicy} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : policies.length === 0 ? (
        <EmptyState title="No resolve policies" description="Add your first policy above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {policies.map((p) => (
            <ResolveCard key={p.id} policy={p} onToggle={togglePolicy} onDelete={deletePolicy} />
          ))}
        </div>
      )}
    </div>
  )
}
