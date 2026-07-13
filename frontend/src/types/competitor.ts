export interface Competitor {
  id: string
  name: string
  platform: string
  avg_rating: number | null
  review_count: number
  url: string | null
  created_at: string
}

export interface CompetitorListResponse {
  competitors: Competitor[]
  total: number
}

export interface LocationRanking {
  location_id: string
  avg_rating: number
  review_count: number
  sentiment_breakdown: Record<string, number>
  positive_percentage: number
  rank: number
}

export interface LeaderboardResponse {
  locations: LocationRanking[]
}
