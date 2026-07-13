# Revly — Phase 2: Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the review feed with search/filter, AI-generated reply generation (mock), review detail view, and CSV export — the core review management experience.

**Architecture:** Backend adds Review and Reply SQLAlchemy models with CRUD endpoints. Frontend replaces the placeholder Reviews page with a full review feed, filter bar, AI reply generation, and review detail modal. Mock data seeding provides 50+ sample reviews.

**Tech Stack:** Same as Phase 1 (FastAPI, SQLAlchemy, React, Tailwind, Zustand, shadcn/ui)

---

## File Map

| File | Purpose |
|---|---|
| **Backend** | |
| `backend/app/models/review.py` | Review SQLAlchemy model |
| `backend/app/models/reply.py` | Reply SQLAlchemy model |
| `backend/app/models/__init__.py` | Update with new models |
| `backend/app/schemas/review.py` | Review Pydantic schemas |
| `backend/app/schemas/reply.py` | Reply Pydantic schemas |
| `backend/app/api/v1/reviews.py` | Review CRUD endpoints |
| `backend/app/api/v1/replies.py` | Reply CRUD endpoints |
| `backend/app/api/v1/__init__.py` | Mount new routers |
| `backend/app/seeds/reviews.py` | Mock review seed script |
| `backend/app/core/csv_export.py` | CSV export utility |
| **Frontend** | |
| `frontend/src/types/review.ts` | Review/Reply TypeScript types |
| `frontend/src/stores/review-store.ts` | Zustand review state |
| `frontend/src/lib/api.ts` | Additional API functions |
| `frontend/src/app/routes/reviews.tsx` | Reviews page (replace placeholder) |
| `frontend/src/components/reviews/review-card.tsx` | Single review card |
| `frontend/src/components/reviews/review-detail.tsx` | Review detail modal |
| `frontend/src/components/reviews/review-filters.tsx` | Filter bar |
| `frontend/src/components/reviews/ai-banner.tsx` | AI feature banner |
| `frontend/src/components/reviews/reply-editor.tsx` | Reply input |
| `frontend/src/components/reviews/reply-card.tsx` | Reply display |
| `frontend/src/components/reviews/review-stats.tsx` | Stats summary |

---

## Task 1: Backend — Review & Reply Models

**Files:**
- Create: `backend/app/models/review.py`
- Create: `backend/app/models/reply.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create `backend/app/models/review.py`**

```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    location_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    platform: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    platform_review_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reviewer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    reviewer_avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    topics: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
```

- [ ] **Step 2: Create `backend/app/models/reply.py`**

```python
import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Reply(Base, TimestampMixin):
    __tablename__ = "replies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
```

- [ ] **Step 3: Update `backend/app/models/__init__.py`**

Replace entire file with:
```python
from app.models.base import Base
from app.models.role import Role
from app.models.user import User
from app.models.review import Review
from app.models.reply import Reply

__all__ = ["Base", "Role", "User", "Review", "Reply"]
```

- [ ] **Step 4: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.models import Base, Review, Reply; print('Models OK')"`

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/ ; git commit -m "feat: add Review and Reply SQLAlchemy models"
```

---

## Task 2: Backend — Review & Reply Schemas

**Files:**
- Create: `backend/app/schemas/review.py`
- Create: `backend/app/schemas/reply.py`

- [ ] **Step 1: Create `backend/app/schemas/review.py`**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel


class ReviewResponse(BaseModel):
    id: uuid.UUID
    platform: str
    reviewer_name: str
    reviewer_avatar_url: str | None
    rating: int
    text: str | None
    sentiment: str | None
    topics: list[str] | None
    is_resolved: bool
    location_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    reviews: list[ReviewResponse]
    total: int
    page: int
    pages: int


class ReviewStatsResponse(BaseModel):
    total: int
    average_rating: float
    by_platform: dict[str, int]
    by_sentiment: dict[str, int]
    by_rating: dict[int, int]
```

- [ ] **Step 2: Create `backend/app/schemas/reply.py`**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel


class ReplyResponse(BaseModel):
    id: uuid.UUID
    review_id: uuid.UUID
    user_id: uuid.UUID | None
    text: str
    is_ai_generated: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReplyCreate(BaseModel):
    text: str


class ReplyGenerate(BaseModel):
    tone: str = "professional"


class ReplyUpdate(BaseModel):
    status: str
```

- [ ] **Step 3: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.schemas.review import ReviewResponse, ReviewListResponse; from app.schemas.reply import ReplyResponse, ReplyCreate; print('Schemas OK')"`

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/ ; git commit -m "feat: add Review and Reply Pydantic schemas"
```

---

## Task 3: Backend — Mock AI Reply Generator

**Files:**
- Create: `backend/app/core/ai_mock.py`

- [ ] **Step 1: Create `backend/app/core/ai_mock.py`**

```python
import random


def generate_reply(text: str | None, rating: int, reviewer_name: str, tone: str = "professional") -> str:
    """Generate a mock AI reply based on review rating and tone."""
    first_name = reviewer_name.split()[0] if reviewer_name else "there"

    if rating >= 4:
        positive_templates = [
            f"Thank you for the wonderful review, {first_name}! We're thrilled you had a great experience. Your feedback means the world to us, and we look forward to serving you again soon!",
            f"We really appreciate your kind words, {first_name}! It's always rewarding to know our team is delivering the quality you expect. See you next time!",
            f"Thank you so much, {first_name}! We're delighted you enjoyed your visit. Your support keeps us motivated to do our best every day.",
        ]
        return random.choice(positive_templates)

    elif rating == 3:
        neutral_templates = [
            f"Thank you for your feedback, {first_name}. We appreciate your honest review and are always looking for ways to improve. We hope to provide a better experience next time.",
            f"We value your input, {first_name}. Your comments help us identify areas to work on. We'd love the chance to make your next visit even better.",
        ]
        return random.choice(neutral_templates)

    else:
        negative_templates = [
            f"We're very sorry about your experience, {first_name}. This falls below the standards we set for ourselves. Please reach out to us directly so we can make this right.",
            f"Thank you for bringing this to our attention, {first_name}. We sincerely apologize and want to understand what went wrong. Please contact us so we can resolve this.",
            f"We're sorry to hear about your experience, {first_name}. This is not the level of service we strive for. We'd appreciate the opportunity to discuss this with you directly.",
        ]
        return random.choice(negative_templates)
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/ai_mock.py ; git commit -m "feat: add mock AI reply generator"
```

---

## Task 4: Backend — CSV Export Utility

**Files:**
- Create: `backend/app/core/csv_export.py`

- [ ] **Step 1: Create `backend/app/core/csv_export.py`**

```python
import csv
import io
from datetime import datetime

from app.models.review import Review


def export_reviews_csv(reviews: list[Review]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Platform", "Reviewer", "Rating", "Sentiment",
        "Text", "Topics", "Resolved", "Date"
    ])
    for r in reviews:
        writer.writerow([
            str(r.id),
            r.platform,
            r.reviewer_name,
            r.rating,
            r.sentiment or "",
            r.text or "",
            ",".join(r.topics) if r.topics else "",
            r.is_resolved,
            r.created_at.isoformat() if r.created_at else "",
        ])
    return output.getvalue()
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/csv_export.py ; git commit -m "feat: add CSV export utility for reviews"
```

---

## Task 5: Backend — Review & Reply Endpoints

**Files:**
- Create: `backend/app/api/v1/reviews.py`
- Create: `backend/app/api/v1/replies.py`
- Modify: `backend/app/api/v1/__init__.py`

- [ ] **Step 1: Create `backend/app/api/v1/reviews.py`**

```python
import io
import math
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.csv_export import export_reviews_csv
from app.models.review import Review
from app.schemas.review import ReviewListResponse, ReviewResponse, ReviewStatsResponse

router = APIRouter()


@router.get("/stats", response_model=ReviewStatsResponse)
def get_review_stats(db: Annotated[Session, Depends(get_db)]):
    total = db.query(func.count(Review.id)).scalar() or 0
    avg = db.query(func.avg(Review.rating)).scalar() or 0

    platform_rows = db.query(Review.platform, func.count(Review.id)).group_by(Review.platform).all()
    by_platform = {p: c for p, c in platform_rows}

    sentiment_rows = db.query(Review.sentiment, func.count(Review.id)).group_by(Review.sentiment).all()
    by_sentiment = {s: c for s, c in sentiment_rows if s}

    rating_rows = db.query(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
    by_rating = {r: c for r, c in rating_rows}

    return ReviewStatsResponse(
        total=total,
        average_rating=round(float(avg), 1),
        by_platform=by_platform,
        by_sentiment=by_sentiment,
        by_rating=by_rating,
    )


@router.get("", response_model=ReviewListResponse)
def list_reviews(
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    platform: str | None = None,
    rating: int | None = None,
    sentiment: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review)

    if search:
        query = query.filter(Review.text.ilike(f"%{search}%"))
    if platform:
        query = query.filter(Review.platform == platform)
    if rating:
        query = query.filter(Review.rating == rating)
    if sentiment:
        query = query.filter(Review.sentiment == sentiment)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return ReviewListResponse(
        reviews=[ReviewResponse.model_validate(r) for r in reviews],
        total=total,
        page=page,
        pages=pages,
    )


@router.get("/export")
def export_reviews(
    db: Annotated[Session, Depends(get_db)],
    platform: str | None = None,
    rating: int | None = None,
):
    query = db.query(Review)
    if platform:
        query = query.filter(Review.platform == platform)
    if rating:
        query = query.filter(Review.rating == rating)

    reviews = query.order_by(Review.created_at.desc()).all()
    csv_content = export_reviews_csv(reviews)

    return StreamingResponse(
        io.BytesIO(csv_content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reviews.csv"},
    )
```

- [ ] **Step 2: Create `backend/app/api/v1/replies.py`**

```python
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, CurrentUser
from app.core.ai_mock import generate_reply
from app.models.reply import Reply
from app.models.review import Review
from app.schemas.reply import ReplyCreate, ReplyGenerate, ReplyResponse, ReplyUpdate

router = APIRouter()


@router.post("/reviews/{review_id}/replies/generate", response_model=ReplyResponse)
def generate_ai_reply(
    review_id: str,
    body: ReplyGenerate,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    import uuid
    review = db.query(Review).filter(Review.id == uuid.UUID(review_id)).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    reply_text = generate_reply(
        text=review.text,
        rating=review.rating,
        reviewer_name=review.reviewer_name,
        tone=body.tone,
    )

    reply = Reply(
        review_id=review.id,
        user_id=user.id,
        text=reply_text,
        is_ai_generated=True,
        status="draft",
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return ReplyResponse.model_validate(reply)


@router.post("/reviews/{review_id}/replies", response_model=ReplyResponse)
def create_reply(
    review_id: str,
    body: ReplyCreate,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    import uuid
    review = db.query(Review).filter(Review.id == uuid.UUID(review_id)).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    reply = Reply(
        review_id=review.id,
        user_id=user.id,
        text=body.text,
        is_ai_generated=False,
        status="draft",
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return ReplyResponse.model_validate(reply)


@router.patch("/replies/{reply_id}", response_model=ReplyResponse)
def update_reply(
    reply_id: str,
    body: ReplyUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    import uuid
    reply = db.query(Reply).filter(Reply.id == uuid.UUID(reply_id)).first()
    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")

    reply.status = body.status
    db.commit()
    db.refresh(reply)
    return ReplyResponse.model_validate(reply)


@router.delete("/replies/{reply_id}")
def delete_reply(
    reply_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    import uuid
    reply = db.query(Reply).filter(Reply.id == uuid.UUID(reply_id)).first()
    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")

    db.delete(reply)
    db.commit()
    return {"message": "Deleted"}
```

- [ ] **Step 3: Update `backend/app/api/v1/__init__.py`**

Replace entire file with:
```python
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.replies import router as replies_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
router.include_router(replies_router, prefix="", tags=["replies"])
```

- [ ] **Step 4: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.api.v1 import router; print('API OK')"`

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/ ; git commit -m "feat: add review and reply API endpoints"
```

---

## Task 6: Backend — Mock Data Seed Script

**Files:**
- Create: `backend/app/seeds/__init__.py`
- Create: `backend/app/seeds/reviews.py`

- [ ] **Step 1: Create seed script**

```python
import uuid
import random
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.review import Review


BRAND_ID = uuid.uuid4()
LOCATIONS = [uuid.uuid4() for _ in range(5)]

REVIEWERS = [
    "John Smith", "Jane Doe", "Alex Johnson", "Sarah Williams", "Mike Brown",
    "Emily Davis", "Chris Wilson", "Lisa Anderson", "David Martinez", "Anna Taylor",
    "James Thomas", "Maria Garcia", "Robert Lee", "Jennifer White", "Michael Clark",
    "Patricia Harris", "Daniel Lewis", "Nancy Robinson", "Matthew Walker", "Linda Hall",
]

PLATFORMS = ["google", "zomato", "reelo"]

POSITIVE_REVIEWS = [
    "Absolutely love this place! The food is always fresh and the service is excellent.",
    "Best bakery in town. Their croissants are to die for!",
    "Amazing quality ingredients. You can taste the difference.",
    "Friendly staff, great ambiance, and the coffee is perfect.",
    "My go-to spot for breakfast. Never disappointed.",
    "The pasta here is incredible. Highly recommend!",
    "Consistent quality every single visit. That's why I keep coming back.",
    "Perfect spot for a casual dinner. Food was outstanding.",
    "The dessert menu is phenomenal. Try the tiramisu!",
    "Great portion sizes and reasonable prices. What more could you ask for?",
]

NEGATIVE_REVIEWS = [
    "The delivery took forever. Food arrived cold and soggy.",
    "Way too expensive for the portion sizes. Not worth it.",
    "Staff was rude and inattentive. Won't be coming back.",
    "Food quality has gone downhill recently. Very disappointing.",
    "Waited 30 minutes even though the restaurant was empty.",
    "The food was bland and tasteless. Expected much better.",
    "Order was wrong and they refused to fix it. Terrible service.",
    "Found a hair in my food. Absolutely disgusting.",
    "Overpriced and underwhelming. There are better options nearby.",
    "The hygiene standards here are questionable at best.",
]

NEUTRAL_REVIEWS = [
    "It was okay. Nothing special but not bad either.",
    "Food was decent but the wait was a bit long.",
    "Average experience. The food was fine but the service could be better.",
    "Not bad for a quick meal. Nothing to write home about though.",
    "The ambiance is nice but the food doesn't quite match the price.",
]

SENTIMENTS = {"positive": POSITIVE_REVIEWS, "negative": NEGATIVE_REVIEWS, "neutral": NEUTRAL_REVIEWS}
RATING_MAP = {"positive": (4, 5), "negative": (1, 2), "neutral": (3, 3)}
TOPICS = ["food_quality", "service", "delivery", "ambience", "pricing", "staff", "cleanliness", "wait_time"]


def seed_reviews():
    db = SessionLocal()
    try:
        existing = db.query(Review).count()
        if existing > 0:
            print(f"Already {existing} reviews seeded. Skipping.")
            return

        reviews = []
        for _ in range(75):
            sentiment = random.choices(["positive", "negative", "neutral"], weights=[60, 25, 15])[0]
            rating = random.randint(*RATING_MAP[sentiment])
            text = random.choice(SENTIMENTS[sentiment])
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)

            review = Review(
                brand_id=BRAND_ID,
                location_id=random.choice(LOCATIONS),
                platform=random.choice(PLATFORMS),
                platform_review_id=f"mock_{random.randint(10000, 99999)}",
                reviewer_name=random.choice(REVIEWERS),
                rating=rating,
                text=text,
                sentiment=sentiment,
                topics=random.sample(TOPICS, k=random.randint(1, 3)),
                created_at=datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago),
            )
            reviews.append(review)

        db.add_all(reviews)
        db.commit()
        print(f"Seeded {len(reviews)} reviews.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_reviews()
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/seeds/ ; git commit -m "feat: add mock review seed script (75 reviews)"
```

---

## Task 7: Backend — Alembic Migration for New Tables

**Files:**
- Modify: `backend/alembic/env.py` (if needed)

- [ ] **Step 1: Generate migration**

Run: `cd D:\Revly\backend ; alembic revision --autogenerate -m "add reviews and replies tables"`

- [ ] **Step 2: Commit**

```bash
git add backend/alembic/ ; git commit -m "feat: add migration for reviews and replies tables"
```

---

## Task 8: Frontend — Review Types & Store

**Files:**
- Create: `frontend/src/types/review.ts`
- Create: `frontend/src/stores/review-store.ts`
- Create: `frontend/src/lib/api.ts`

- [ ] **Step 1: Create `frontend/src/types/review.ts`**

```typescript
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
```

- [ ] **Step 2: Create `frontend/src/stores/review-store.ts`**

```typescript
import { create } from "zustand"
import type { Review, ReviewListResponse, ReviewStats, Reply } from "@/types/review"
import apiClient from "@/lib/api-client"

interface ReviewState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  stats: ReviewStats | null
  isLoading: boolean
  filters: {
    search: string
    platform: string | null
    rating: number | null
    sentiment: string | null
  }
  setFilters: (filters: Partial<ReviewState["filters"]>) => void
  setPage: (page: number) => void
  fetchReviews: () => Promise<void>
  fetchStats: () => Promise<void>
  generateReply: (reviewId: string, tone?: string) => Promise<Reply>
  createReply: (reviewId: string, text: string) => Promise<Reply>
  approveReply: (replyId: string) => Promise<void>
  sendReply: (replyId: string) => Promise<void>
  deleteReply: (replyId: string) => Promise<void>
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  total: 0,
  page: 1,
  pages: 1,
  stats: null,
  isLoading: false,
  filters: { search: "", platform: null, rating: null, sentiment: null },

  setFilters: (filters) => {
    set((s) => ({ filters: { ...s.filters, ...filters }, page: 1 }))
    get().fetchReviews()
  },

  setPage: (page) => {
    set({ page })
    get().fetchReviews()
  },

  fetchReviews: async () => {
    set({ isLoading: true })
    const { filters, page } = get()
    const params = new URLSearchParams()
    if (filters.search) params.set("search", filters.search)
    if (filters.platform) params.set("platform", filters.platform)
    if (filters.rating) params.set("rating", String(filters.rating))
    if (filters.sentiment) params.set("sentiment", filters.sentiment)
    params.set("page", String(page))
    params.set("limit", "20")

    const { data } = await apiClient.get<ReviewListResponse>(`/reviews?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, isLoading: false })
  },

  fetchStats: async () => {
    const { data } = await apiClient.get<ReviewStats>("/reviews/stats")
    set({ stats: data })
  },

  generateReply: async (reviewId, tone = "professional") => {
    const { data } = await apiClient.post<Reply>(`/reviews/${reviewId}/replies/generate`, { tone })
    return data
  },

  createReply: async (reviewId, text) => {
    const { data } = await apiClient.post<Reply>(`/reviews/${reviewId}/replies`, { text })
    return data
  },

  approveReply: async (replyId) => {
    await apiClient.patch(`/replies/${replyId}`, { status: "approved" })
  },

  sendReply: async (replyId) => {
    await apiClient.patch(`/replies/${replyId}`, { status: "sent" })
  },

  deleteReply: async (replyId) => {
    await apiClient.delete(`/replies/${replyId}`)
  },
}))
```

- [ ] **Step 3: Create `frontend/src/lib/api.ts`**

```typescript
import apiClient from "./api-client"

export async function downloadReviewsCsv(platform?: string, rating?: number) {
  const params = new URLSearchParams()
  if (platform) params.set("platform", platform)
  if (rating) params.set("rating", String(rating))

  const response = await apiClient.get(`/reviews/export?${params}`, {
    responseType: "blob",
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", "reviews.csv")
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/review.ts frontend/src/stores/review-store.ts frontend/src/lib/api.ts ; git commit -m "feat: add review types, store, and API utilities"
```

---

## Task 9: Frontend — Review Components

**Files:**
- Create: `frontend/src/components/reviews/ai-banner.tsx`
- Create: `frontend/src/components/reviews/review-card.tsx`
- Create: `frontend/src/components/reviews/review-filters.tsx`
- Create: `frontend/src/components/reviews/reply-editor.tsx`
- Create: `frontend/src/components/reviews/reply-card.tsx`
- Create: `frontend/src/components/reviews/review-detail.tsx`
- Create: `frontend/src/components/reviews/review-stats.tsx`

- [ ] **Step 1: Create `ai-banner.tsx`**

```tsx
import { Sparkles } from "lucide-react"

export default function AiBanner() {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-primary p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/20">
          <Sparkles className="h-5 w-5 text-info" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Set up Revly's auto response</p>
          <p className="text-xs text-text-secondary">Respond to all reviews in 30 mins</p>
        </div>
      </div>
      <button className="rounded-lg bg-info px-4 py-2 text-xs font-medium text-white hover:bg-info/90">
        Set up now →
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `review-card.tsx`**

```tsx
import { ExternalLink } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { timeAgo } from "@/lib/utils"
import type { Review } from "@/types/review"

const platformColors: Record<string, string> = {
  google: "bg-blue-500",
  zomato: "bg-red-500",
  reelo: "bg-purple-500",
}

interface Props {
  review: Review
  onClick: () => void
}

export default function ReviewCard({ review, onClick }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:bg-card-secondary/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <RatingBadge rating={review.rating} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary capitalize">{review.platform}</span>
              <span className="text-text-muted">·</span>
              <span className="text-sm font-medium text-text">{review.reviewer_name}</span>
            </div>
            <p className="text-xs text-text-muted">{timeAgo(review.created_at)}</p>
          </div>
        </div>
        <span className={`flex h-2 w-2 rounded-full ${platformColors[review.platform] || "bg-gray-400"}`} />
      </div>

      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-text line-clamp-3">{review.text}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {review.location_id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card-secondary px-2 py-0.5 text-xs text-text-secondary">
              📍 Location
            </span>
          )}
          {review.sentiment && (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              review.sentiment === "positive" ? "bg-success-bg text-success" :
              review.sentiment === "negative" ? "bg-danger-bg text-danger" :
              "bg-card-secondary text-text-secondary"
            }`}>
              {review.sentiment}
            </span>
          )}
        </div>
        <button
          onClick={onClick}
          className="flex items-center gap-1 text-xs font-medium text-info hover:underline"
        >
          Read review <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `review-filters.tsx`**

```tsx
import { useReviewStore } from "@/stores/review-store"
import { cn } from "@/lib/utils"

const platforms = [
  { value: null, label: "All Platforms" },
  { value: "google", label: "Google" },
  { value: "zomato", label: "Zomato" },
  { value: "reelo", label: "Reelo" },
]

const ratings = [
  { value: null, label: "All Ratings" },
  { value: 5, label: "5 Star" },
  { value: 4, label: "4 Star" },
  { value: 3, label: "3 Star" },
  { value: 2, label: "2 Star" },
  { value: 1, label: "1 Star" },
]

const sentiments = [
  { value: null, label: "All" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "neutral", label: "Neutral" },
]

export default function ReviewFilters() {
  const { filters, setFilters } = useReviewStore()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.platform || ""}
        onChange={(e) => setFilters({ platform: e.target.value || null })}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      >
        {platforms.map((p) => (
          <option key={p.value || "all"} value={p.value || ""}>{p.label}</option>
        ))}
      </select>

      <select
        value={filters.rating || ""}
        onChange={(e) => setFilters({ rating: e.target.value ? Number(e.target.value) : null })}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      >
        {ratings.map((r) => (
          <option key={r.value || "all"} value={r.value || ""}>{r.label}</option>
        ))}
      </select>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
        {sentiments.map((s) => (
          <button
            key={s.value || "all"}
            onClick={() => setFilters({ sentiment: s.value })}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              filters.sentiment === s.value
                ? "bg-info text-white"
                : "text-text-secondary hover:bg-card-secondary"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `reply-card.tsx`**

```tsx
import { Bot, User, Check, Send, Trash2 } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import type { Reply } from "@/types/review"

interface Props {
  reply: Reply
  onApprove?: (id: string) => void
  onSend?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ReplyCard({ reply, onApprove, onSend, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card-secondary/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        {reply.is_ai_generated ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-info/20">
            <Bot className="h-3 w-3 text-info" />
          </span>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
            <User className="h-3 w-3 text-success" />
          </span>
        )}
        <span className="text-xs font-medium text-text-secondary">
          {reply.is_ai_generated ? "AI Generated" : "You"}
        </span>
        <span className="text-text-muted">·</span>
        <span className="text-xs text-text-muted">{timeAgo(reply.created_at)}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
          reply.status === "sent" ? "bg-success-bg text-success" :
          reply.status === "approved" ? "bg-info-bg text-info" :
          "bg-card-secondary text-text-secondary"
        }`}>
          {reply.status}
        </span>
      </div>

      <p className="text-sm text-text leading-relaxed">{reply.text}</p>

      {reply.status === "draft" && (
        <div className="mt-3 flex items-center gap-2">
          {onApprove && (
            <button
              onClick={() => onApprove(reply.id)}
              className="flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/20"
            >
              <Check className="h-3 w-3" /> Approve
            </button>
          )}
          {onSend && (
            <button
              onClick={() => onSend(reply.id)}
              className="flex items-center gap-1 rounded-lg bg-info/10 px-3 py-1.5 text-xs font-medium text-info hover:bg-info/20"
            >
              <Send className="h-3 w-3" /> Send
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(reply.id)}
              className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `reply-editor.tsx`**

```tsx
import { useState } from "react"
import { Send } from "lucide-react"

interface Props {
  onSubmit: (text: string) => void
  isLoading?: boolean
}

export default function ReplyEditor({ onSubmit, isLoading }: Props) {
  const [text, setText] = useState("")

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim())
      setText("")
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-2 text-xs font-medium text-text-secondary">Write your reply</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your reply here..."
        className="w-full rounded-lg border border-border bg-card-secondary p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-info"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="flex items-center gap-2 rounded-lg bg-info px-4 py-2 text-sm font-medium text-white hover:bg-info/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {isLoading ? "Sending..." : "Send Reply"}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `review-detail.tsx`**

```tsx
import { useState, useEffect } from "react"
import { X, Sparkles, RefreshCw } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import ReplyCard from "./reply-card"
import ReplyEditor from "./reply-editor"
import { useReviewStore } from "@/stores/review-store"
import type { Review, Reply } from "@/types/review"
import { timeAgo } from "@/lib/utils"

interface Props {
  review: Review
  onClose: () => void
}

export default function ReviewDetail({ review, onClose }: Props) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [aiReply, setAiReply] = useState<Reply | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { generateReply, createReply, approveReply, sendReply, deleteReply } = useReviewStore()

  const handleGenerate = async (tone?: string) => {
    setIsGenerating(true)
    try {
      const reply = await generateReply(review.id, tone)
      setAiReply(reply)
      setReplies((prev) => [reply, ...prev])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApprove = async (replyId: string) => {
    await approveReply(replyId)
    setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, status: "approved" } : r))
  }

  const handleSend = async (replyId: string) => {
    setIsSending(true)
    try {
      await sendReply(replyId)
      setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, status: "sent" } : r))
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (replyId: string) => {
    await deleteReply(replyId)
    setReplies((prev) => prev.filter((r) => r.id !== replyId))
  }

  const handleManualReply = async (text: string) => {
    const reply = await createReply(review.id, text)
    setReplies((prev) => [...prev, reply])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Review from {review.reviewer_name}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <RatingBadge rating={review.rating} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text">{review.reviewer_name}</span>
              <span className="text-text-muted">·</span>
              <span className="text-xs capitalize text-text-secondary">{review.platform}</span>
              <span className="text-text-muted">·</span>
              <span className="text-xs text-text-muted">{timeAgo(review.created_at)}</span>
            </div>
          </div>
        </div>

        {review.text && (
          <div className="rounded-xl bg-card-secondary p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">{review.text}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {review.sentiment && (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              review.sentiment === "positive" ? "bg-success-bg text-success" :
              review.sentiment === "negative" ? "bg-danger-bg text-danger" :
              "bg-card-secondary text-text-secondary"
            }`}>
              {review.sentiment}
            </span>
          )}
          {review.topics?.map((t) => (
            <span key={t} className="rounded-full bg-card-blue px-3 py-1 text-xs text-text-secondary">
              {t.replace("_", " ")}
            </span>
          ))}
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">AI Reply</h3>
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="flex items-center gap-1 rounded-lg bg-info/10 px-3 py-1.5 text-xs font-medium text-info hover:bg-info/20 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {aiReply ? "Regenerate" : "Generate Reply"}
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                onApprove={handleApprove}
                onSend={handleSend}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <ReplyEditor onSubmit={handleManualReply} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create `review-stats.tsx`**

```tsx
import type { ReviewStats as ReviewStatsType } from "@/types/review"
import { formatNumber } from "@/lib/utils"

interface Props {
  stats: ReviewStatsType | null
}

export default function ReviewStats({ stats }: Props) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl bg-card-blue p-4">
        <p className="text-xs text-text-secondary">Total Reviews</p>
        <p className="text-2xl font-bold text-text">{formatNumber(stats.total)}</p>
      </div>
      <div className="rounded-xl bg-card-green p-4">
        <p className="text-xs text-text-secondary">Average Rating</p>
        <p className="text-2xl font-bold text-text">⭐ {stats.average_rating}</p>
      </div>
      <div className="rounded-xl bg-card p-4">
        <p className="text-xs text-text-secondary">By Sentiment</p>
        <div className="mt-1 flex gap-2">
          {Object.entries(stats.by_sentiment).map(([s, c]) => (
            <span key={s} className={`text-xs font-medium ${
              s === "positive" ? "text-success" : s === "negative" ? "text-danger" : "text-text-secondary"
            }`}>
              {s}: {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/reviews/ ; git commit -m "feat: add review components (card, detail, filters, reply)"
```

---

## Task 10: Frontend — Reviews Page

**Files:**
- Modify: `frontend/src/app/routes/reviews.tsx`

- [ ] **Step 1: Replace `frontend/src/app/routes/reviews.tsx`**

```tsx
import { useEffect, useState, useCallback } from "react"
import { Search, Download } from "lucide-react"
import { useReviewStore } from "@/stores/review-store"
import { downloadReviewsCsv } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AiBanner from "@/components/reviews/ai-banner"
import ReviewFilters from "@/components/reviews/review-filters"
import ReviewCard from "@/components/reviews/review-card"
import ReviewDetail from "@/components/reviews/review-detail"
import ReviewStats from "@/components/reviews/review-stats"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import type { Review } from "@/types/review"

export default function ReviewsPage() {
  const {
    reviews, total, page, pages, stats, isLoading,
    filters, setFilters, setPage, fetchReviews, fetchStats,
  } = useReviewStore()
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [])

  const handleSearch = useCallback(() => {
    setFilters({ search: searchInput })
  }, [searchInput, setFilters])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage and respond to customer reviews</p>
      </div>

      <ReviewStats stats={stats} />

      <AiBanner />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search reviews..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => downloadReviewsCsv(filters.platform || undefined, filters.rating || undefined)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Download
        </Button>
      </div>

      <ReviewFilters />

      {isLoading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews found" description="Try adjusting your filters" />
      ) : (
        <>
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onClick={() => setSelectedReview(review)}
              />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Page {page} of {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {selectedReview && (
        <ReviewDetail
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/routes/reviews.tsx ; git commit -m "feat: implement Reviews page with feed, filters, and AI reply"
```

---

## Task 11: Backend — Run Tests

- [ ] **Step 1: Run backend tests**

Run: `cd D:\Revly\backend ; python -m pytest tests/ -v`
Expected: All tests pass (existing + no new tests needed for Phase 2 endpoints)

- [ ] **Step 2: Commit any fixes if needed**

---

## Task 12: Final Verification

- [ ] **Step 1: Frontend build**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: Build succeeds

- [ ] **Step 2: Backend import**

Run: `cd D:\Revly\backend ; python -c "from app.api.v1 import router; print('OK')"`
Expected: OK

- [ ] **Step 3: Git log**

Run: `git log --oneline`
Expected: All Phase 2 commits present

- [ ] **Step 4: Final commit**

```bash
git add -A ; git commit -m "chore: Phase 2 Reviews complete"
```

---

## Phase 2 Complete

After this plan is executed, Revly has:

1. **Review feed** with search, platform/rating/sentiment filters
2. **Review detail modal** with full review info, sentiment, topics
3. **AI-generated replies** (mock) with approve/send/delete workflow
4. **Manual reply** editor
5. **CSV export** of reviews
6. **75 seeded mock reviews** across platforms
7. **Stats summary** (total, average, by sentiment)
8. All existing Phase 1 features still working
