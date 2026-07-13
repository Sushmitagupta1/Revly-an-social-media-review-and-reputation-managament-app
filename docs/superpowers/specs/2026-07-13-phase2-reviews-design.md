# Revly — Phase 2: Reviews Design Spec

> **Goal:** Build the review feed with search/filter, AI-generated reply generation (mock AI), and review download — the core value proposition of Revly.

---

## 1. New Database Tables

### reviews

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL,
    location_id UUID,
    platform VARCHAR(50) NOT NULL,          -- 'google', 'zomato', 'reelo'
    platform_review_id VARCHAR(255),         -- external ID from platform
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_avatar_url VARCHAR(512),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    sentiment VARCHAR(20),                   -- 'positive', 'negative', 'neutral'
    topics JSONB DEFAULT '[]',               -- ["food_quality", "service", "delivery"]
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### replies

```sql
CREATE TABLE replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),       -- null if AI-generated
    text TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft',      -- 'draft', 'approved', 'sent'
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. API Endpoints

### Reviews

```
GET  /api/v1/reviews
  Query: ?search=food&platform=google&rating=1&sentiment=negative&page=1&limit=20
  Response: { reviews: ReviewResponse[], total: number, page: number, pages: number }

GET  /api/v1/reviews/:id
  Response: ReviewResponse (full review with replies)

GET  /api/v1/reviews/stats
  Response: { total, average_rating, by_platform, by_sentiment, by_rating }
```

### Replies

```
POST /api/v1/reviews/:id/replies/generate
  Body: { tone?: "professional" | "friendly" | "apologetic" }
  Response: { reply: ReplyResponse }         -- AI-generated draft

POST /api/v1/reviews/:id/replies
  Body: { text: string }
  Response: { reply: ReplyResponse }         -- manual reply

PATCH /api/v1/replies/:id
  Body: { status: "approved" | "sent" }
  Response: { reply: ReplyResponse }

DELETE /api/v1/replies/:id
  Response: { message: "Deleted" }
```

### Export

```
GET  /api/v1/reviews/export
  Query: ?format=csv&platform=google&rating=1
  Response: CSV file download
```

---

## 3. Frontend Pages

### Reviews List (`/reviews`)

Layout matching the Olly design:

```
┌─────────────────────────────────────────────────┐
│  [Search reviews...]              [Download]    │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐  │
│  │  🤖 Set up Revly's auto response –       │  │
│  │  Respond to all reviews in 30 mins        │  │
│  │  [Set up now →]                           │  │
│  └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Filters: [Platform ▼] [Rating ▼] [Sentiment ▼]│
├─────────────────────────────────────────────────┤
│  ⭐⭐⭐⭐⭐  Google  John Smith  2 hours ago     │
│  "Food was amazing, delivery was slow..."       │
│  📍 Upper Crust Vastrapur                       │
│  [Generate a Reply]              Read review →  │
├─────────────────────────────────────────────────┤
│  ⭐       Zomato   Jane Doe   1 day ago         │
│  "Terrible experience. Cold food..."            │
│  📍 Upper Crust Bopal                           │
│  [Generate a Reply]              Read review →  │
├─────────────────────────────────────────────────┤
│  ...more reviews (infinite scroll or pagination)│
└─────────────────────────────────────────────────┘
```

### Review Detail (modal or inline expand)

When clicking "Read review →" or "Generate a Reply":

```
┌─────────────────────────────────────────────────┐
│  Review from John Smith                          │
│  ⭐⭐⭐⭐⭐  Google  ·  2 hours ago               │
│  📍 Upper Crust Vastrapur                       │
│                                                 │
│  "Food was amazing, delivery was slow though.    │
│   The pizza was fresh and hot but it took        │
│   45 minutes to arrive. Will order again         │
│   but hope delivery improves."                   │
│                                                 │
│  Sentiment: Positive                             │
│  Topics: Food Quality, Delivery                  │
│                                                 │
│  ── AI Generated Reply ──                        │
│  "Thank you for the wonderful review, John!      │
│   We're thrilled you loved the pizza. We're      │
│   working on improving delivery times. See        │
│   you again soon! 🍕"                            │
│                                                 │
│  [Approve & Send]  [Edit]  [Regenerate]          │
├─────────────────────────────────────────────────┤
│  ── Or write your own ──                         │
│  [Type your reply...]            [Send Reply]    │
└─────────────────────────────────────────────────┘
```

---

## 4. Mock Data Seeding

Create a seed script that populates 50-100 mock reviews across platforms:
- Mix of ratings (heavy on 4-5 stars, some 1-2)
- Various sentiments (positive, negative, neutral)
- Different topics (food quality, service, delivery, ambience, pricing)
- Multiple locations
- Different platforms (Google, Zomato, Reelo)
- Recent timestamps (last 30 days)

---

## 5. AI Reply Generation (Mock)

For Phase 2, AI reply generation is mocked:
- Input: review text + rating + tone preference
- Output: A templated reply based on rating and sentiment
- Phase 4 will replace with real Gemini AI

Mock logic:
- 5-star: "Thank you for the wonderful review, {name}! We're glad you enjoyed..."
- 4-star: "Thanks for the feedback, {name}! We appreciate..."
- 3-star: "Thank you for your review, {name}. We're sorry to hear..."
- 1-2 star: "We're very sorry about your experience, {name}. This doesn't meet our standards..."

---

## 6. Component Map

| Component | Path | Purpose |
|---|---|---|
| ReviewFeedPage | `app/routes/reviews.tsx` | Main reviews list page |
| ReviewCard | `components/reviews/review-card.tsx` | Single review display |
| ReviewDetail | `components/reviews/review-detail.tsx` | Expanded review + reply |
| ReviewFilters | `components/reviews/review-filters.tsx` | Platform/rating/sentiment filter bar |
| AiBanner | `components/reviews/ai-banner.tsx` | AI auto-response promotion banner |
| ReplyEditor | `components/reviews/reply-editor.tsx` | Reply text input + send |
| ReplyCard | `components/reviews/reply-card.tsx` | Display existing reply |
| ReviewStats | `components/reviews/review-stats.tsx` | Stats bar (total, avg, breakdown) |
| DownloadButton | `components/reviews/download-button.tsx` | CSV export trigger |

---

## 7. State Management

Add to Zustand stores:

```typescript
// stores/review-store.ts
interface ReviewState {
  reviews: Review[]
  total: number
  page: number
  isLoading: boolean
  filters: {
    search: string
    platform: string | null
    rating: number | null
    sentiment: string | null
  }
  setFilters: (filters: Partial<ReviewState['filters']>) => void
  fetchReviews: () => Promise<void>
  generateReply: (reviewId: string, tone: string) => Promise<Reply>
  approveReply: (replyId: string) => Promise<void>
  sendReply: (replyId: string) => Promise<void>
}
```

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Review list load time | < 500ms |
| AI reply generation | < 3s (mock), < 5s (real) |
| Search debounce | 300ms |
| Pagination | 20 per page |
| CSV export | < 5s for 1000 reviews |
