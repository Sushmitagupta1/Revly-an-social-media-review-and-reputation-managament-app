import { useEffect } from "react"
import { useAuditLogStore } from "@/stores/audit-log-store"
import AuditLogList from "@/components/audit-logs/audit-log-list"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"

const ACTIONS = ["", "reply_sent", "review_resolved", "location_added", "competitor_tracked", "settings_updated", "integration_connected", "auto_reply_triggered"]
const ENTITIES = ["", "reply", "review", "location", "competitor", "settings", "integration", "automation"]

export default function AuditLogsPage() {
  const { logs, total, isLoading, actionFilter, entityFilter, setActionFilter, setEntityFilter, fetchLogs } = useAuditLogStore()

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="mt-1 text-sm text-text-secondary">Track all activity across your account</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={actionFilter || ""}
          onChange={(e) => setActionFilter(e.target.value || null)}
          className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text"
        >
          <option value="">All actions</option>
          {ACTIONS.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={entityFilter || ""}
          onChange={(e) => setEntityFilter(e.target.value || null)}
          className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text"
        >
          <option value="">All entities</option>
          {ENTITIES.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <Badge variant="secondary">{total} entries</Badge>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs" description="Activity will appear here as actions are taken." />
      ) : (
        <AuditLogList logs={logs} />
      )}
    </div>
  )
}
