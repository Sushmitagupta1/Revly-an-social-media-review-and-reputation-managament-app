export interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  created_at: string
}

export interface LocationListResponse {
  locations: Location[]
  total: number
}
