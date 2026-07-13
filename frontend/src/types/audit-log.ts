export interface AuditLog {
  id: string
  brand_id: string
  user_id: string
  user_name: string
  action: string
  entity_type: string
  entity_id: string | null
  details: string | null
  created_at: string
}

export interface AuditLogListResponse {
  logs: AuditLog[]
  total: number
}
