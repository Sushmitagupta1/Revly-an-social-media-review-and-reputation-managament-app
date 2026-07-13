export interface ResolvePolicy {
  id: string
  brand_id: string
  name: string
  auto_resolve_after_reply: boolean
  sla_hours: number
  escalate_after_hours: number | null
  is_active: boolean
  created_at: string
}

export interface ResolvePolicyListResponse {
  policies: ResolvePolicy[]
  total: number
}
