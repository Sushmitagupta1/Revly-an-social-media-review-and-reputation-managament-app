import { useEffect } from "react"
import { useAutoResponseStore } from "@/stores/auto-response-store"
import AutoResponseCard from "@/components/auto-response/auto-response-card"
import AutoResponseForm from "@/components/auto-response/auto-response-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function AutoResponsePage() {
  const { responses, isLoading, fetchResponses, createResponse, updateResponse, deleteResponse } = useAutoResponseStore()

  useEffect(() => { fetchResponses() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Auto-Response Templates</h1>
        <p className="mt-1 text-sm text-text-secondary">Configure automated responses by sentiment and topic</p>
      </div>

      <AutoResponseForm onSubmit={createResponse} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : responses.length === 0 ? (
        <EmptyState title="No auto-response templates" description="Add your first template above." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {responses.map((r) => (
            <AutoResponseCard
              key={r.id}
              response={r}
              onToggle={(id, isActive) => updateResponse(id, { is_active: isActive })}
              onDelete={deleteResponse}
            />
          ))}
        </div>
      )}
    </div>
  )
}
