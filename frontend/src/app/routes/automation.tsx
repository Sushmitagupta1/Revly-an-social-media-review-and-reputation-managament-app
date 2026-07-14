import { useEffect } from "react"
import { useAutomationStore } from "@/stores/automation-store"
import AutomationCard from "@/components/automation/automation-card"
import AutomationForm from "@/components/automation/automation-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import BackButton from "@/components/shared/back-button"

export default function AutomationPage() {
  const { rules, isLoading, fetchRules, createRule, toggleRule, deleteRule } = useAutomationStore()

  useEffect(() => { fetchRules() }, [])

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/overview" />
        <h1 className="text-2xl font-bold text-white">Automation</h1>
        <p className="mt-1 text-sm text-text-secondary">Set up rules to automate your review management</p>
      </div>

      <AutomationForm onSubmit={createRule} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : rules.length === 0 ? (
        <EmptyState title="No automation rules" description="Create your first rule above to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rules.map((rule) => (
            <AutomationCard key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
          ))}
        </div>
      )}
    </div>
  )
}
