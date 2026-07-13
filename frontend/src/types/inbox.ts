import type { Review } from "./review"

export interface InboxResponse {
  reviews: Review[]
  total: number
  page: number
  pages: number
}
