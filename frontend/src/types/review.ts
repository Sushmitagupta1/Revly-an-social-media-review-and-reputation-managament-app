export type OrderDish =
  | { name: string; quantity: number; unit_cost?: number; total_cost?: number }
  | { title: string; rating: string }

export interface OrderDetails {
  order_id: string
  ordered_at: string | null
  state: string | null
  delivery_mode: string | null
  payment_method: string | null
  customer_name: string | null
  dishes: OrderDish[]
  total: number | null
}

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
  location_name: string | null
  order_id: string | null
  order_details: OrderDetails | null
  reply_count: number
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
