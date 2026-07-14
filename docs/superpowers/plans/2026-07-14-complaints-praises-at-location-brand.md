# Complaints & Praises: At Location / At Brand Toggle

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "At Location" / "At Brand" toggle to Complaints and Praises pages matching the dashboard's complaints-praises-section design, with real data replacing hardcoded mock topics.

**Architecture:** Backend adds location filtering + topic aggregation to complaints/praises endpoints. Frontend adds toggle UI to both pages, derives topic counts from actual review data, and styles everything with the existing Olly card system (rounded-[20px], bg-card, pastel accents).

**Tech Stack:** FastAPI, SQLAlchemy, React, Zustand, Tailwind CSS, Recharts

---

## File Map

| Action | File |
|--------|------|
| Modify | `D:\Revly\backend\app\api\v1\complaints.py` — Add `location` query param + topic aggregation |
| Modify | `D:\Revly\backend\app\api\v1\praises.py` — Add `location` query param + topic aggregation |
| Modify | `D:\Revly\backend\app\schemas\review.py` — Add `TopicCount` to response schemas |
| Modify | `D:\Revly\frontend\src\stores\complaints-store.ts` — Add `location` filter + `topicCounts` state |
| Modify | `D:\Revly\frontend\src\stores\praises-store.ts` — Add `location` filter + `topicCounts` state |
| Modify | `D:\Revly\frontend\src\app\routes\complaints.tsx` — Add toggle, 3-column layout, topic bars |
| Modify | `D:\Revly\frontend\src\app\routes\praises.tsx` — Add toggle, 3-column layout, topic bars |
| Modify | `D:\Revly\frontend\src\components\dashboard\complaints-praises-section.tsx` — Replace hardcoded topics with props |

---

### Task 1: Backend — Add location filter + topic aggregation to complaints endpoint

**Files:**
- Modify: `D:\Revly\backend\app\schemas\review.py:1-47`
- Modify: `D:\Revly\backend\app\api\v1\complaints.py:1-36`

- [ ] **Step 1: Add TopicCount schema to review schemas**

Add to `D:\Revly\backend\app\schemas\review.py` after `ReviewListResponse`:

```python
class TopicCount(BaseModel):
    topic: str
    count: int


class ComplaintListResponse(BaseModel):
    reviews: list[ReviewResponse]
    total: int
    page: int
    pages: int
    topic_counts: list[TopicCount]


class PraiseListResponse(BaseModel):
    reviews: list[ReviewResponse]
    total: int
    page: int
    pages: int
    topic_counts: list[TopicCount]
```

- [ ] **Step 2: Update complaints endpoint with location filter and topic aggregation**

Replace `D:\Revly\backend\app\api\v1\complaints.py` entirely:

```python
import json
import math
from collections import Counter

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.models.review import Review
from app.schemas.review import ComplaintListResponse, ReviewResponse, TopicCount

router = APIRouter()


def _resolve_location_ids(db, location_names: list[str]) -> list[str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    name_to_id = {r.name: str(r.id) for r in rows}
    return [name_to_id[n] for n in location_names if n in name_to_id]


TOPIC_LABELS = {
    "food_quality": "Food Quality",
    "service": "Service",
    "delivery": "Delivery",
    "pricing": "Pricing",
    "staff": "Staff",
    "ambience": "Ambience",
    "cleanliness": "Cleanliness",
    "wait_time": "Wait Time",
}


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    db: DbSession,
    _user: CurrentUser,
    topic: str | None = None,
    resolved: bool | None = None,
    location: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review).filter(Review.sentiment == "negative")

    if location:
        filter_names = [n.strip() for n in location.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                query = query.filter(Review.location_id.in_(loc_ids))

    if topic:
        query = query.filter(Review.topics.like(f'%"{topic}"%'))
    if resolved is not None:
        query = query.filter(Review.is_resolved == resolved)

    all_negative = db.query(Review).filter(Review.sentiment == "negative")
    if location:
        filter_names = [n.strip() for n in location.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                all_negative = all_negative.filter(Review.location_id.in_(loc_ids))

    topic_counter: Counter = Counter()
    for r in all_negative.all():
        if r.topics:
            raw = r.topics
            if isinstance(raw, str):
                try:
                    raw = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    raw = []
            if isinstance(raw, list):
                for t in raw:
                    label = TOPIC_LABELS.get(t, t.replace("_", " ").title())
                    topic_counter[label] += 1

    topic_counts = [
        TopicCount(topic=t, count=c)
        for t, c in topic_counter.most_common()
    ]

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return ComplaintListResponse(
        reviews=[ReviewResponse.model_validate(r) for r in reviews],
        total=total,
        page=page,
        pages=pages,
        topic_counts=topic_counts,
    )
```

- [ ] **Step 3: Run backend tests**

Run: `cd D:\Revly\backend && python -m pytest tests/ -x -q`
Expected: All existing tests pass (endpoint signature is backward-compatible — `location` is optional).

- [ ] **Step 4: Commit**

```bash
cd D:\Revly
git add backend/app/schemas/review.py backend/app/api/v1/complaints.py
git commit -m "feat(backend): add location filter and topic aggregation to complaints endpoint"
```

---

### Task 2: Backend — Add location filter + topic aggregation to praises endpoint

**Files:**
- Modify: `D:\Revly\backend\app\api\v1\praises.py:1-33`

- [ ] **Step 1: Update praises endpoint with location filter and topic aggregation**

Replace `D:\Revly\backend\app\api\v1\praises.py` entirely:

```python
import json
import math
from collections import Counter

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.models.review import Review
from app.schemas.review import PraiseListResponse, ReviewResponse, TopicCount

router = APIRouter()


def _resolve_location_ids(db, location_names: list[str]) -> list[str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    name_to_id = {r.name: str(r.id) for r in rows}
    return [name_to_id[n] for n in location_names if n in name_to_id]


TOPIC_LABELS = {
    "food_quality": "Food Quality",
    "service": "Service",
    "delivery": "Delivery",
    "pricing": "Pricing",
    "staff": "Staff",
    "ambience": "Ambience",
    "cleanliness": "Cleanliness",
    "wait_time": "Wait Time",
}


@router.get("", response_model=PraiseListResponse)
def list_praises(
    db: DbSession,
    _user: CurrentUser,
    platform: str | None = None,
    location: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review).filter(Review.sentiment == "positive")

    if platform:
        query = query.filter(Review.platform == platform)
    if location:
        filter_names = [n.strip() for n in location.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                query = query.filter(Review.location_id.in_(loc_ids))

    all_positive = db.query(Review).filter(Review.sentiment == "positive")
    if location:
        filter_names = [n.strip() for n in location.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                all_positive = all_positive.filter(Review.location_id.in_(loc_ids))

    topic_counter: Counter = Counter()
    for r in all_positive.all():
        if r.topics:
            raw = r.topics
            if isinstance(raw, str):
                try:
                    raw = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    raw = []
            if isinstance(raw, list):
                for t in raw:
                    label = TOPIC_LABELS.get(t, t.replace("_", " ").title())
                    topic_counter[label] += 1

    topic_counts = [
        TopicCount(topic=t, count=c)
        for t, c in topic_counter.most_common()
    ]

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return PraiseListResponse(
        reviews=[ReviewResponse.model_validate(r) for r in reviews],
        total=total,
        page=page,
        pages=pages,
        topic_counts=topic_counts,
    )
```

- [ ] **Step 2: Run backend tests**

Run: `cd D:\Revly\backend && python -m pytest tests/ -x -q`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
cd D:\Revly
git add backend/app/api/v1/praises.py
git commit -m "feat(backend): add location filter and topic aggregation to praises endpoint"
```

---

### Task 3: Frontend stores — Add location filter + topic counts

**Files:**
- Modify: `D:\Revly\frontend\src\stores\complaints-store.ts:1-38`
- Modify: `D:\Revly\frontend\src\stores\praises-store.ts:1-29`

- [ ] **Step 1: Update complaints store**

Replace `D:\Revly\frontend\src\stores\complaints-store.ts` entirely:

```typescript
import { create } from "zustand"
import type { Review } from "@/types/review"
import type { TopicCount } from "@/types/dashboard"
import apiClient from "@/lib/api-client"

interface ComplaintsState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  topic: string | null
  resolved: boolean | null
  topicCounts: TopicCount[]
  setTopic: (t: string | null) => void
  setResolved: (r: boolean | null) => void
  setPage: (p: number) => void
  fetchComplaints: (locations?: string[]) => Promise<void>
  resolveReview: (id: string) => Promise<void>
}

export const useComplaintsStore = create<ComplaintsState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, topic: null, resolved: null, topicCounts: [],
  setTopic: (topic) => { set({ topic, page: 1 }); get().fetchComplaints() },
  setResolved: (resolved) => { set({ resolved, page: 1 }); get().fetchComplaints() },
  setPage: (page) => { set({ page }); get().fetchComplaints() },
  fetchComplaints: async (locations?: string[]) => {
    set({ isLoading: true })
    const { topic, resolved, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (topic) params.set("topic", topic)
    if (resolved !== null) params.set("resolved", String(resolved))
    if (locations && locations.length > 0) params.set("location", locations.join(","))
    const { data } = await apiClient.get(`/complaints?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, topicCounts: data.topic_counts || [], isLoading: false })
  },
  resolveReview: async (id) => {
    await apiClient.patch(`/reviews/${id}/resolve`, { is_resolved: true })
    get().fetchComplaints()
  },
}))
```

- [ ] **Step 2: Update praises store**

Replace `D:\Revly\frontend\src\stores\praises-store.ts` entirely:

```typescript
import { create } from "zustand"
import type { Review } from "@/types/review"
import type { TopicCount } from "@/types/dashboard"
import apiClient from "@/lib/api-client"

interface PraisesState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  platform: string | null
  topicCounts: TopicCount[]
  setPlatform: (p: string | null) => void
  setPage: (p: number) => void
  fetchPraises: (locations?: string[]) => Promise<void>
}

export const usePraisesStore = create<PraisesState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, platform: null, topicCounts: [],
  setPlatform: (platform) => { set({ platform, page: 1 }); get().fetchPraises() },
  setPage: (page) => { set({ page }); get().fetchPraises() },
  fetchPraises: async (locations?: string[]) => {
    set({ isLoading: true })
    const { platform, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (platform) params.set("platform", platform)
    if (locations && locations.length > 0) params.set("location", locations.join(","))
    const { data } = await apiClient.get(`/praises?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, topicCounts: data.topic_counts || [], isLoading: false })
  },
}))
```

- [ ] **Step 3: Add TopicCount to dashboard types**

Read `D:\Revly\frontend\src\types\dashboard.ts`. Add after the `PraiseLocation` interface (around line 27):

```typescript
export interface TopicCount {
  topic: string
  count: number
}
```

- [ ] **Step 4: Commit**

```bash
cd D:\Revly
git add frontend/src/stores/complaints-store.ts frontend/src/stores/praises-store.ts frontend/src/types/dashboard.ts
git commit -m "feat(frontend): update stores with location filter and topic counts"
```

---

### Task 4: Complaints page — Add At Location / At Brand toggle with Olly-style cards

**Files:**
- Modify: `D:\Revly\frontend\src\app\routes\complaints.tsx:1-75`

- [ ] **Step 1: Rewrite complaints page**

Replace `D:\Revly\frontend\src\app\routes\complaints.tsx` entirely:

```tsx
import { useEffect, useMemo, useState } from "react"
import { useComplaintsStore } from "@/stores/complaints-store"
import { useFilterStore } from "@/stores/filter-store"
import ComplaintCard from "@/components/complaints/complaint-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import BackButton from "@/components/shared/back-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

const TOPICS = [
  { label: "All", value: null },
  { label: "Food Quality", value: "Food Quality" },
  { label: "Service", value: "Service" },
  { label: "Delivery", value: "Delivery" },
  { label: "Pricing", value: "Pricing" },
  { label: "Staff", value: "Staff" },
  { label: "Ambience", value: "Ambience" },
  { label: "Cleanliness", value: "Cleanliness" },
  { label: "Wait Time", value: "Wait Time" },
]

export default function ComplaintsPage() {
  const { reviews, total, page, pages, isLoading, topicCounts, topic, setTopic, setPage, fetchComplaints, resolveReview } = useComplaintsStore()
  const { selectedLocations } = useFilterStore()
  const [view, setView] = useState<"location" | "brand">("location")
  const [search, setSearch] = useState("")

  useEffect(() => { fetchComplaints(selectedLocations) }, [selectedLocations])

  const resolvedCount = reviews.filter((r) => r.is_resolved).length
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return topicCounts
    const q = search.toLowerCase()
    return topicCounts.filter((t) => t.topic.toLowerCase().includes(q))
  }, [topicCounts, search])

  const maxTopicCount = Math.max(...topicCounts.map((t) => t.count), 1)
  const maxReviewCount = Math.max(...reviews.length, 1)

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/overview" />
        <h1 className="text-[24px] font-bold text-white">Complaints</h1>
        <p className="mt-1 text-[13px] text-text-secondary">Track and resolve negative feedback</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-[20px] bg-card-blue p-5">
          <p className="text-[13px] font-medium text-text-secondary">Total Complaints</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{total}</p>
          <p className="text-[12px] text-text-muted">Across all platforms</p>
        </div>
        <div className="rounded-[20px] bg-card-green p-5">
          <p className="text-[13px] font-medium text-text-secondary">Resolved</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{resolvedCount}</p>
          <p className="text-[12px] text-text-muted">{total > 0 ? Math.round((resolvedCount / total) * 100) : 0}% resolution rate</p>
        </div>
        <div className="rounded-[20px] bg-card-yellow p-5">
          <p className="text-[13px] font-medium text-text-secondary">Avg Rating</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{avgRating.toFixed(1)}</p>
          <p className="text-[12px] text-text-muted">Of negative reviews</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-[12px] bg-white/5 p-1">
          <button onClick={() => setView("location")} className={cn("rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all", view === "location" ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5")}>At Location</button>
          <button onClick={() => setView("brand")} className={cn("rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all", view === "brand" ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5")}>At Brand</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <Button key={t.label} variant={topic === t.value ? "default" : "ghost"} size="sm" onClick={() => setTopic(t.value)}>
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No complaints found" description="No negative reviews match your filters." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {view === "location" ? (
            <div className="lg:col-span-1">
              <div className="rounded-[20px] bg-card p-5">
                <h3 className="mb-4 text-[15px] font-semibold text-text">Complaints by Outlet</h3>
                <div className="space-y-3">
                  {topicCounts.length > 0 ? topicCounts.slice(0, 6).map((t) => (
                    <div key={t.topic}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-text">{t.topic}</span>
                        <span className="text-[12px] font-bold text-danger">{t.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                        <div className="h-full rounded-full bg-danger transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                      </div>
                    </div>
                  )) : (
                    <p className="text-[13px] text-text-secondary">No topic data available</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1">
              <div className="rounded-[20px] bg-card p-5">
                <h3 className="mb-4 text-[15px] font-semibold text-text">Complaint Categories</h3>
                <div className="space-y-3">
                  {topicCounts.length > 0 ? topicCounts.map((t) => (
                    <div key={t.topic}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-text">{t.topic}</span>
                        <span className="text-[12px] font-bold text-danger">{t.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                        <div className="h-full rounded-full bg-danger transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                      </div>
                    </div>
                  )) : (
                    <p className="text-[13px] text-text-secondary">No category data available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="lg:col-span-2 space-y-4">
            {reviews.map((r) => (
              <ComplaintCard key={r.id} review={r} onResolve={resolveReview} />
            ))}
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-[13px] text-text-secondary">Page {page} of {pages}</span>
              <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-[20px] bg-card p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-text">Topic Breakdown</h3>
              <div className="space-y-3">
                {topicCounts.length > 0 ? topicCounts.map((t) => (
                  <div key={t.topic}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-text">{t.topic}</span>
                      <span className="text-[12px] font-bold text-text">{t.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                      <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd D:\Revly\frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
cd D:\Revly
git add frontend/src/app/routes/complaints.tsx
git commit -m "feat(frontend): add At Location/At Brand toggle to complaints page with Olly-style cards"
```

---

### Task 5: Praises page — Add At Location / At Brand toggle with Olly-style cards

**Files:**
- Modify: `D:\Revly\frontend\src\app\routes\praises.tsx:1-62`

- [ ] **Step 1: Rewrite praises page**

Replace `D:\Revly\frontend\src\app\routes\praises.tsx` entirely:

```tsx
import { useEffect, useMemo, useState } from "react"
import { usePraisesStore } from "@/stores/praises-store"
import { useFilterStore } from "@/stores/filter-store"
import PraiseCard from "@/components/praises/praise-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import BackButton from "@/components/shared/back-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"

const PLATFORMS = [
  { label: "All", value: null },
  { label: "Google", value: "google" },
  { label: "Zomato", value: "zomato" },
  { label: "Reelo", value: "reelo" },
]

export default function PraisesPage() {
  const { reviews, total, page, pages, isLoading, topicCounts, platform, setPlatform, setPage, fetchPraises } = usePraisesStore()
  const { selectedLocations } = useFilterStore()
  const [view, setView] = useState<"location" | "brand">("location")

  useEffect(() => { fetchPraises(selectedLocations) }, [selectedLocations])

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const maxTopicCount = Math.max(...topicCounts.map((t) => t.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/overview" />
        <h1 className="text-[24px] font-bold text-white">Praises</h1>
        <p className="mt-1 text-[13px] text-text-secondary">Celebrate your best reviews and testimonials</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-[20px] bg-card-green p-5">
          <p className="text-[13px] font-medium text-text-secondary">Total Praises</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{total}</p>
          <p className="text-[12px] text-text-muted">Across all platforms</p>
        </div>
        <div className="rounded-[20px] bg-card-blue p-5">
          <p className="text-[13px] font-medium text-text-secondary">Avg Rating</p>
          <p className="mt-1.5 text-[36px] font-bold text-text">{avgRating.toFixed(1)}</p>
          <p className="text-[12px] text-text-muted">Of positive reviews</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-[12px] bg-white/5 p-1">
          <button onClick={() => setView("location")} className={cn("rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all", view === "location" ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5")}>At Location</button>
          <button onClick={() => setView("brand")} className={cn("rounded-[12px] px-4 py-2 text-[12px] font-medium transition-all", view === "brand" ? "bg-accent text-white shadow-[0_0_20px_rgba(255,106,43,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5")}>At Brand</button>
        </div>
        <div className="flex gap-2">
          {PLATFORMS.map((p) => (
            <Button key={p.label} variant={platform === p.value ? "default" : "ghost"} size="sm" onClick={() => setPlatform(p.value)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No praises found" description="No positive reviews match your filters." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {view === "location" ? (
            <div className="lg:col-span-1">
              <div className="rounded-[20px] bg-card p-5">
                <h3 className="mb-4 text-[15px] font-semibold text-text">Praises by Outlet</h3>
                <div className="space-y-3">
                  {topicCounts.length > 0 ? topicCounts.slice(0, 6).map((t) => (
                    <div key={t.topic}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-text">{t.topic}</span>
                        <span className="text-[12px] font-bold text-success">{t.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                      </div>
                    </div>
                  )) : (
                    <p className="text-[13px] text-text-secondary">No topic data available</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1">
              <div className="rounded-[20px] bg-card p-5">
                <h3 className="mb-4 text-[15px] font-semibold text-text">Praise Categories</h3>
                <div className="space-y-3">
                  {topicCounts.length > 0 ? topicCounts.map((t) => (
                    <div key={t.topic}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-text">{t.topic}</span>
                        <span className="text-[12px] font-bold text-success">{t.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                      </div>
                    </div>
                  )) : (
                    <p className="text-[13px] text-text-secondary">No category data available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="lg:col-span-2 space-y-4">
            {reviews.map((r) => (
              <PraiseCard key={r.id} review={r} />
            ))}
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-[13px] text-text-secondary">Page {page} of {pages}</span>
              <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-[20px] bg-card p-5">
              <h3 className="mb-4 text-[15px] font-semibold text-text">Topic Breakdown</h3>
              <div className="space-y-3">
                {topicCounts.length > 0 ? topicCounts.map((t) => (
                  <div key={t.topic}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-text">{t.topic}</span>
                      <span className="text-[12px] font-bold text-text">{t.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                      <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${(t.count / maxTopicCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd D:\Revly\frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
cd D:\Revly
git add frontend/src/app/routes/praises.tsx
git commit -m "feat(frontend): add At Location/At Brand toggle to praises page with Olly-style cards"
```

---

### Task 6: Update dashboard complaints-praises-section to use real topic data

**Files:**
- Modify: `D:\Revly\frontend\src\components\dashboard\complaints-praises-section.tsx:1-161`

- [ ] **Step 1: Replace hardcoded topics with props**

Replace `D:\Revly\frontend\src\components\dashboard\complaints-praises-section.tsx` entirely:

```tsx
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import type { ComplaintLocation, PraiseLocation, TopicCount } from "@/types/dashboard"

interface ComplaintsPraisesProps {
  complaintsCount: number
  praisesCount: number
  complaintsByLocation: ComplaintLocation[]
  praisesByLocation: PraiseLocation[]
  complaintTopics: TopicCount[]
  praiseTopics: TopicCount[]
}

export default function ComplaintsPraisesSection({
  complaintsCount,
  praisesCount,
  complaintsByLocation,
  praisesByLocation,
  complaintTopics,
  praiseTopics,
}: ComplaintsPraisesProps) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ComplaintsCard count={complaintsCount} locations={complaintsByLocation} topics={complaintTopics} />
      <PraisesCard count={praisesCount} locations={praisesByLocation} topics={praiseTopics} />
    </div>
  )
}

function ComplaintsCard({ count, locations, topics }: { count: number; locations: ComplaintLocation[]; topics: TopicCount[] }) {
  const [view, setView] = useState<"location" | "brand">("location")
  const navigate = useNavigate()
  const maxCount = Math.max(...locations.map((l) => l.count), 1)

  return (
    <div className="rounded-[24px] bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text">Complaints</h3>
        <div className="flex gap-1 rounded-[12px] bg-card-secondary p-1">
          <button onClick={() => setView("location")} className={cn("rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all", view === "location" ? "bg-text text-white shadow-md" : "text-text-secondary hover:bg-card hover:text-text")}>At Location</button>
          <button onClick={() => setView("brand")} className={cn("rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all", view === "brand" ? "bg-text text-white shadow-md" : "text-text-secondary hover:bg-card hover:text-text")}>At Brand</button>
        </div>
      </div>

      <div className="mb-4 rounded-[14px] bg-card-blue p-3">
        <p className="text-[12px] text-text-secondary">
          <span className="font-semibold text-text">AI Insight:</span>{" "}
          Pricing and food quality account for 63% of all customer complaints this week.
        </p>
      </div>

      <div className="mb-4">
        <span className="text-[36px] font-bold text-text">{count}</span>
        <p className="text-[12px] text-text-muted">Total Complaints</p>
      </div>

      <div className="space-y-3">
        {view === "location"
          ? locations.slice(0, 4).map((loc) => (
              <div key={loc.location_id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-text">{loc.location_name}</span>
                  <span className="text-[12px] font-bold text-danger">{loc.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                  <div className="h-full rounded-full bg-danger transition-all duration-500" style={{ width: `${(loc.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))
          : topics.length > 0 ? topics.slice(0, 5).map((t) => {
              const maxTopic = Math.max(...topics.map((x) => x.count), 1)
              return (
                <div key={t.topic}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-text">{t.topic}</span>
                    <span className="text-[12px] font-bold text-danger">{t.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                    <div className="h-full rounded-full bg-danger transition-all duration-500" style={{ width: `${(t.count / maxTopic) * 100}%` }} />
                  </div>
                </div>
              )
            }) : (
              <p className="text-[12px] text-text-secondary">No topic data available</p>
            )}
      </div>
      <button onClick={() => navigate("/complaints")} className="mt-4 text-[12px] font-medium text-accent hover:underline">View all Complaints →</button>
    </div>
  )
}

function PraisesCard({ count, locations, topics }: { count: number; locations: PraiseLocation[]; topics: TopicCount[] }) {
  const [view, setView] = useState<"location" | "brand">("location")
  const navigate = useNavigate()
  const maxCount = Math.max(...locations.map((l) => l.count), 1)

  return (
    <div className="rounded-[24px] bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text">Praises</h3>
        <div className="flex gap-1 rounded-[12px] bg-card-secondary p-1">
          <button onClick={() => setView("location")} className={cn("rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all", view === "location" ? "bg-text text-white shadow-md" : "text-text-secondary hover:bg-card hover:text-text")}>At Location</button>
          <button onClick={() => setView("brand")} className={cn("rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all", view === "brand" ? "bg-text text-white shadow-md" : "text-text-secondary hover:bg-card hover:text-text")}>At Brand</button>
        </div>
      </div>

      <div className="mb-4 rounded-[14px] bg-card-green p-3">
        <p className="text-[12px] text-text-secondary">
          <span className="font-semibold text-text">AI Insight:</span>{" "}
          Customers most frequently praise food quality and staff friendliness across all platforms.
        </p>
      </div>

      <div className="mb-4">
        <span className="text-[36px] font-bold text-text">{count}</span>
        <p className="text-[12px] text-text-muted">Total Praises</p>
      </div>

      <div className="space-y-3">
        {view === "location"
          ? locations.slice(0, 4).map((loc) => (
              <div key={loc.location_id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-text">{loc.location_name}</span>
                  <span className="text-[12px] font-bold text-success">{loc.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                  <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(loc.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))
          : topics.length > 0 ? topics.slice(0, 5).map((t) => {
              const maxTopic = Math.max(...topics.map((x) => x.count), 1)
              return (
                <div key={t.topic}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-text">{t.topic}</span>
                    <span className="text-[12px] font-bold text-success">{t.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
                    <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(t.count / maxTopic) * 100}%` }} />
                  </div>
                </div>
              )
            }) : (
              <p className="text-[12px] text-text-secondary">No topic data available</p>
            )}
      </div>
      <button onClick={() => navigate("/praises")} className="mt-4 text-[12px] font-medium text-accent hover:underline">View all Praises →</button>
    </div>
  )
}
```

- [ ] **Step 2: Update dashboard overview to fetch and pass topic data**

Read `D:\Revly\frontend\src\app\routes\overview.tsx` to understand how it passes props to `ComplaintsPraisesSection`. Then update the component call to include `complaintTopics` and `praiseTopics` props.

The dashboard endpoint already returns complaint/praise data. We need to add topic aggregation to the dashboard endpoint OR compute topics client-side from `recent_reviews`. The simpler approach: add topic aggregation to the backend dashboard endpoint.

**Backend dashboard update** — Add to `D:\Revly\backend\app\api\v1\dashboard.py` after the `praises_trend` computation (before `return DashboardResponse`):

```python
    # ── Complaint topics ──
    complaint_query = base_query.filter(Review.sentiment == "negative")
    topic_counter_complaints: dict[str, int] = {}
    for r in complaint_query.all():
        if r.topics:
            raw = r.topics
            if isinstance(raw, str):
                try:
                    import json
                    raw = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    raw = []
            if isinstance(raw, list):
                for t in raw:
                    label = {"food_quality": "Food Quality", "service": "Service", "delivery": "Delivery", "pricing": "Pricing", "staff": "Staff", "ambience": "Ambience", "cleanliness": "Cleanliness", "wait_time": "Wait Time"}.get(t, t.replace("_", " ").title())
                    topic_counter_complaints[label] = topic_counter_complaints.get(label, 0) + 1
    complaint_topics = [{"topic": t, "count": c} for t, c in sorted(topic_counter_complaints.items(), key=lambda x: x[1], reverse=True)]

    # ── Praise topics ──
    praise_query = base_query.filter(Review.sentiment == "positive")
    topic_counter_praises: dict[str, int] = {}
    for r in praise_query.all():
        if r.topics:
            raw = r.topics
            if isinstance(raw, str):
                try:
                    import json
                    raw = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    raw = []
            if isinstance(raw, list):
                for t in raw:
                    label = {"food_quality": "Food Quality", "service": "Service", "delivery": "Delivery", "pricing": "Pricing", "staff": "Staff", "ambience": "Ambience", "cleanliness": "Cleanliness", "wait_time": "Wait Time"}.get(t, t.replace("_", " ").title())
                    topic_counter_praises[label] = topic_counter_praises.get(label, 0) + 1
    praise_topics = [{"topic": t, "count": c} for t, c in sorted(topic_counter_praises.items(), key=lambda x: x[1], reverse=True)]
```

Then add `complaint_topics` and `praise_topics` to the `DashboardResponse` schema in `D:\Revly\backend\app\schemas\dashboard.py`.

**Frontend dashboard update** — Pass the new props in `D:\Revly\frontend\src\app\routes\overview.tsx`:

```tsx
<ComplaintsPraisesSection
  complaintsCount={data.complaints_count}
  praisesCount={data.praises_count}
  complaintsByLocation={data.complaints_by_location}
  praisesByLocation={data.praises_by_location}
  complaintTopics={data.complaint_topics}
  praiseTopics={data.praise_topics}
/>
```

- [ ] **Step 3: Verify frontend builds**

Run: `cd D:\Revly\frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Run all backend tests**

Run: `cd D:\Revly\backend && python -m pytest tests/ -x -q`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd D:\Revly
git add frontend/src/components/dashboard/complaints-praises-section.tsx frontend/src/app/routes/overview.tsx backend/app/api/v1/dashboard.py backend/app/schemas/dashboard.py
git commit -m "feat(dashboard): replace hardcoded complaint/praise topics with real aggregated data"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full frontend build check**

Run: `cd D:\Revly\frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Full backend test suite**

Run: `cd D:\Revly\backend && python -m pytest tests/ -v`
Expected: All tests pass.

- [ ] **Step 3: Final commit if any fixes needed**

```bash
cd D:\Revly
git add -A
git commit -m "fix: address build/type issues from complaints-praises redesign"
```
