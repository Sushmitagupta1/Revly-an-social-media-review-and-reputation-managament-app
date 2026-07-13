export interface KpiData {
  total_reviews: number
  average_rating: number
  response_rate: number
  avg_response_hours: number
}

export interface TrendPoint {
  date: string
  count: number
  avg_rating: number
}

export interface RatingDistribution {
  rating: number
  count: number
}

export interface PlatformBreakdown {
  platform: string
  count: number
  avg_rating: number
}

export interface SentimentBreakdown {
  positive: number
  negative: number
  neutral: number
}

export interface LocationSummary {
  location_id: string
  location_name: string
  review_count: number
  average_rating: number
}

export interface RecentReview {
  id: string
  reviewer_name: string
  platform: string
  rating: number
  text: string | null
  sentiment: string | null
  created_at: string
}

export interface DashboardData {
  kpis: KpiData
  sentiment_trend: TrendPoint[]
  rating_distribution: RatingDistribution[]
  platform_breakdown: PlatformBreakdown[]
  sentiment_breakdown: SentimentBreakdown
  nps_score: number
  recent_reviews: RecentReview[]
  top_locations: LocationSummary[]
  bottom_locations: LocationSummary[]
}
