export interface AutoResponse {
  id: string
  brand_id: string
  sentiment: string
  topic: string
  template: string
  is_active: boolean
  created_at: string
}

export interface AutoResponseListResponse {
  responses: AutoResponse[]
  total: number
}
