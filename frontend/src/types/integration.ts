export interface Integration {
  id: string
  brand_id: string
  platform: string
  account_name: string
  status: string
  last_synced: string | null
  is_connected: boolean
  created_at: string
}

export interface IntegrationListResponse {
  integrations: Integration[]
  total: number
}
