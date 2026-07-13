import { useEffect } from "react"
import { useIntegrationStore } from "@/stores/integration-store"
import IntegrationCard from "@/components/integrations/integration-card"
import IntegrationForm from "@/components/integrations/integration-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function IntegrationsPage() {
  const { integrations, isLoading, fetchIntegrations, createIntegration, toggleConnection, deleteIntegration } = useIntegrationStore()

  useEffect(() => { fetchIntegrations() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="mt-1 text-sm text-text-secondary">Connect your review platforms</p>
      </div>

      <IntegrationForm onSubmit={createIntegration} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : integrations.length === 0 ? (
        <EmptyState title="No integrations" description="Connect your first platform above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => (
            <IntegrationCard key={i.id} integration={i} onToggle={toggleConnection} onDelete={deleteIntegration} />
          ))}
        </div>
      )}
    </div>
  )
}
