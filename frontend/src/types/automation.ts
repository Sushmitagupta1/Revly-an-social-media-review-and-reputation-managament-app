export interface AutomationRule {
  id: string
  brand_id: string
  name: string
  trigger: string
  action: string
  template: string | null
  is_active: boolean
  execution_count: number
  created_at: string
}

export interface AutomationRuleListResponse {
  rules: AutomationRule[]
  total: number
}
