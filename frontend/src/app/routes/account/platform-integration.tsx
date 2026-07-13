import { useEffect } from "react"
import { useIntegrationStore } from "@/stores/integration-store"
import PlatformCard from "@/components/platform-integration/platform-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function PlatformIntegrationPage() {
  const { integrations, isLoading, fetchIntegrations } = useIntegrationStore()

  useEffect(() => { fetchIntegrations() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Integration</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your connected review platform accounts</p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : integrations.length === 0 ? (
        <EmptyState title="No platforms connected" description="Connect platforms from the Integrations page." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.filter((i) => i.is_connected).map((i) => (
            <PlatformCard key={i.id} integration={i} onSync={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}
