export interface Review {
  id: string
  platform: string
  reviewer_name: string
  reviewer_avatar_url: string | null
  rating: number
  text: string | null
  sentiment: string | null
  topics: string[] | null
  is_resolved: boolean
  location_id: string | null
  created_at: string
}

export interface Reply {
  id: string
  review_id: string
  user_id: string | null
  text: string
  is_ai_generated: boolean
  status: string
  created_at: string
}

export interface ReviewStats {
  total: number
  average_rating: number
  by_platform: Record<string, number>
  by_sentiment: Record<string, number>
  by_rating: Record<number, number>
}

export interface ReviewListResponse {
  reviews: Review[]
  total: number
  page: number
  pages: number
}
