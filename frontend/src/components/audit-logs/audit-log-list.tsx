import AuditLogCard from "./audit-log-card"
import type { AuditLog } from "@/types/audit-log"

interface Props {
  logs: AuditLog[]
}

export default function AuditLogList({ logs }: Props) {
  return (
    <div className="grid gap-3">
      {logs.map((log) => (
        <AuditLogCard key={log.id} log={log} />
      ))}
    </div>
  )
}
