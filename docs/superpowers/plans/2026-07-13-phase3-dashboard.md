# Revly — Phase 3: Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dashboard (Overview) page with KPIs, charts, sentiment trends, rating distribution, platform breakdown, recent reviews feed, NPS gauge, and location summary — matching the Olly bento-grid design.

**Architecture:** Backend adds a `/dashboard` endpoint that aggregates review data into a single response (KPIs, time-series, breakdowns). Frontend replaces the placeholder Overview page with a bento-grid layout using Recharts for charts, the existing KPI card component, and new chart/gauge components.

**Tech Stack:** Same as before (FastAPI, SQLAlchemy, React, Tailwind, Zustand, Recharts, shadcn/ui)

---

## File Map

| File | Purpose |
|---|---|
| **Backend** | |
| `backend/app/api/v1/dashboard.py` | Dashboard aggregation endpoint |
| `backend/app/schemas/dashboard.py` | Dashboard response Pydantic schema |
| `backend/app/api/v1/__init__.py` | Mount dashboard router |
| **Frontend** | |
| `frontend/src/types/dashboard.ts` | Dashboard TypeScript types |
| `frontend/src/stores/dashboard-store.ts` | Zustand dashboard state |
| `frontend/src/components/dashboard/kpi-row.tsx` | Row of 4 KPI cards |
| `frontend/src/components/dashboard/sentiment-chart.tsx` | Sentiment trend line chart |
| `frontend/src/components/dashboard/rating-chart.tsx` | Rating distribution bar chart |
| `frontend/src/components/dashboard/platform-chart.tsx` | Platform breakdown donut chart |
| `frontend/src/components/dashboard/nps-gauge.tsx` | NPS score circular gauge |
| `frontend/src/components/dashboard/recent-reviews.tsx` | Latest reviews feed |
| `frontend/src/components/dashboard/location-summary.tsx` | Top/bottom locations list |
| `frontend/src/app/routes/overview.tsx` | Dashboard page (replace placeholder) |

---

## Task 1: Backend — Dashboard Schema

**Files:**
- Create: `backend/app/schemas/dashboard.py`

- [ ] **Step 1: Create `backend/app/schemas/dashboard.py`**

```python
from pydantic import BaseModel


class KpiResponse(BaseModel):
    total_reviews: int
    average_rating: float
    response_rate: float
    avg_response_hours: float


class TrendPoint(BaseModel):
    date: str
    count: int
    avg_rating: float


class RatingDistribution(BaseModel):
    rating: int
    count: int


class PlatformBreakdown(BaseModel):
    platform: str
    count: int
    avg_rating: float


class SentimentBreakdown(BaseModel):
    positive: int
    negative: int
    neutral: int


class LocationSummary(BaseModel):
    location_id: str
    location_name: str
    review_count: int
    average_rating: float


class RecentReview(BaseModel):
    id: str
    reviewer_name: str
    platform: str
    rating: int
    text: str | None
    sentiment: str | None
    created_at: str

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    kpis: KpiResponse
    sentiment_trend: list[TrendPoint]
    rating_distribution: list[RatingDistribution]
    platform_breakdown: list[PlatformBreakdown]
    sentiment_breakdown: SentimentBreakdown
    nps_score: int
    recent_reviews: list[RecentReview]
    top_locations: list[LocationSummary]
    bottom_locations: list[LocationSummary]
```

- [ ] **Step 2: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.schemas.dashboard import DashboardResponse; print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/dashboard.py ; git commit -m "feat: add Dashboard Pydantic schemas"
```

---

## Task 2: Backend — Dashboard Endpoint

**Files:**
- Create: `backend/app/api/v1/dashboard.py`
- Modify: `backend/app/api/v1/__init__.py`

- [ ] **Step 1: Create `backend/app/api/v1/dashboard.py`**

```python
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.review import Review
from app.schemas.dashboard import (
    DashboardResponse,
    KpiResponse,
    TrendPoint,
    RatingDistribution,
    PlatformBreakdown,
    SentimentBreakdown,
    LocationSummary,
    RecentReview,
)

router = APIRouter()

MOCK_LOCATIONS = {
    "loc_1": "Upper Crust Vastrapur",
    "loc_2": "Upper Crust SG Highway",
    "loc_3": "Upper Crust Drive-In",
    "loc_4": "Upper Crust Bodakdev",
    "loc_5": "Upper Crust Thaltej",
}


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Annotated[Session, Depends(get_db)]):
    now = datetime.now(timezone.utc)

    # ── KPIs ──
    total = db.query(func.count(Review.id)).scalar() or 0
    avg_rating = db.query(func.avg(Review.rating)).scalar() or 0

    replied = db.query(func.count(Review.id)).filter(Review.is_resolved == True).scalar() or 0
    response_rate = (replied / total * 100) if total > 0 else 0

    avg_response_hours = 2.4  # Mock — would come from reply timestamps in production

    kpis = KpiResponse(
        total_reviews=total,
        average_rating=round(float(avg_rating), 1),
        response_rate=round(response_rate, 1),
        avg_response_hours=avg_response_hours,
    )

    # ── Sentiment trend (last 30 days) ──
    sentiment_trend = []
    for i in range(29, -1, -1):
        day = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        day_count = db.query(func.count(Review.id)).filter(
            Review.created_at >= day_start, Review.created_at < day_end
        ).scalar() or 0
        day_avg = db.query(func.avg(Review.rating)).filter(
            Review.created_at >= day_start, Review.created_at < day_end
        ).scalar() or 0
        sentiment_trend.append(TrendPoint(
            date=day.isoformat(),
            count=day_count,
            avg_rating=round(float(day_avg), 1) if day_avg else 0,
        ))

    # ── Rating distribution ──
    rating_rows = db.query(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
    rating_map = {r: c for r, c in rating_rows}
    rating_distribution = [
        RatingDistribution(rating=i, count=rating_map.get(i, 0)) for i in range(1, 6)
    ]

    # ── Platform breakdown ──
    platform_rows = db.query(
        Review.platform, func.count(Review.id), func.avg(Review.rating)
    ).group_by(Review.platform).all()
    platform_breakdown = [
        PlatformBreakdown(platform=p, count=c, avg_rating=round(float(a), 1))
        for p, c, a in platform_rows
    ]

    # ── Sentiment breakdown ──
    sentiment_rows = db.query(Review.sentiment, func.count(Review.id)).group_by(Review.sentiment).all()
    sentiment_map = {s: c for s, c in sentiment_rows if s}
    sentiment_breakdown = SentimentBreakdown(
        positive=sentiment_map.get("positive", 0),
        negative=sentiment_map.get("negative", 0),
        neutral=sentiment_map.get("neutral", 0),
    )

    # ── NPS score (mock calculation) ──
    promoters = sentiment_breakdown.positive
    detractors = sentiment_breakdown.negative
    nps_total = promoters + detractors + sentiment_breakdown.neutral
    nps_score = round(((promoters - detractors) / nps_total * 100)) if nps_total > 0 else 0

    # ── Recent reviews (last 5) ──
    recent = db.query(Review).order_by(Review.created_at.desc()).limit(5).all()
    recent_reviews = [
        RecentReview(
            id=str(r.id),
            reviewer_name=r.reviewer_name,
            platform=r.platform,
            rating=r.rating,
            text=r.text,
            sentiment=r.sentiment,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in recent
    ]

    # ── Location summary (mock — grouped by location_id) ──
    location_rows = db.query(
        Review.location_id, func.count(Review.id), func.avg(Review.rating)
    ).group_by(Review.location_id).all()

    locations = []
    for loc_id, count, avg in location_rows:
        loc_id_str = str(loc_id) if loc_id else "unknown"
        locations.append(LocationSummary(
            location_id=loc_id_str,
            location_name=MOCK_LOCATIONS.get(loc_id_str, f"Location {loc_id_str[:8]}"),
            review_count=count,
            average_rating=round(float(avg), 1),
        ))
    locations.sort(key=lambda x: x.average_rating, reverse=True)
    top_locations = locations[:3]
    bottom_locations = locations[-3:] if len(locations) > 3 else []

    return DashboardResponse(
        kpis=kpis,
        sentiment_trend=sentiment_trend,
        rating_distribution=rating_distribution,
        platform_breakdown=platform_breakdown,
        sentiment_breakdown=sentiment_breakdown,
        nps_score=nps_score,
        recent_reviews=recent_reviews,
        top_locations=top_locations,
        bottom_locations=bottom_locations,
    )
```

- [ ] **Step 2: Update `backend/app/api/v1/__init__.py`**

Replace entire file with:
```python
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.replies import router as replies_router
from app.api.v1.dashboard import router as dashboard_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
router.include_router(replies_router, prefix="", tags=["replies"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
```

- [ ] **Step 3: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.api.v1 import router; print('OK')"`

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/v1/dashboard.py backend/app/api/v1/__init__.py ; git commit -m "feat: add dashboard aggregation endpoint"
```

---

## Task 3: Frontend — Dashboard Types & Store

**Files:**
- Create: `frontend/src/types/dashboard.ts`
- Create: `frontend/src/stores/dashboard-store.ts`

- [ ] **Step 1: Create `frontend/src/types/dashboard.ts`**

```typescript
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
```

- [ ] **Step 2: Create `frontend/src/stores/dashboard-store.ts`**

```typescript
import { create } from "zustand"
import type { DashboardData } from "@/types/dashboard"
import apiClient from "@/lib/api-client"

interface DashboardState {
  data: DashboardData | null
  isLoading: boolean
  fetchDashboard: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.get<DashboardData>("/dashboard")
      set({ data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))
```

- [ ] **Step 3: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/dashboard.ts frontend/src/stores/dashboard-store.ts ; git commit -m "feat: add dashboard types and store"
```

---

## Task 4: Frontend — KPI Row Component

**Files:**
- Create: `frontend/src/components/dashboard/kpi-row.tsx`

- [ ] **Step 1: Create `frontend/src/components/dashboard/kpi-row.tsx`**

```tsx
import KpiCard from "@/components/shared/kpi-card"
import type { KpiData } from "@/types/dashboard"

interface Props {
  kpis: KpiData
}

export default function KpiRow({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Total Reviews"
        value={kpis.total_reviews.toLocaleString()}
        className="bg-card"
      />
      <KpiCard
        label="Average Rating"
        value={`⭐ ${kpis.average_rating}`}
        className="bg-card-green"
      />
      <KpiCard
        label="Response Rate"
        value={`${kpis.response_rate}%`}
        className="bg-card-blue"
      />
      <KpiCard
        label="Avg Response Time"
        value={`${kpis.avg_response_hours}h`}
        className="bg-card-yellow"
      />
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/kpi-row.tsx ; git commit -m "feat: add KPI row component"
```

---

## Task 5: Frontend — Sentiment Trend Chart

**Files:**
- Create: `frontend/src/components/dashboard/sentiment-chart.tsx`

- [ ] **Step 1: Create `frontend/src/components/dashboard/sentiment-chart.tsx`**

```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { TrendPoint } from "@/types/dashboard"

interface Props {
  data: TrendPoint[]
}

export default function SentimentChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text">Review Trend</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4361EE" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickFormatter={(v: string) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
            labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#4361EE"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/sentiment-chart.tsx ; git commit -m "feat: add sentiment trend chart"
```

---

## Task 6: Frontend — Rating Distribution Chart

**Files:**
- Create: `frontend/src/components/dashboard/rating-chart.tsx`

- [ ] **Step 1: Create `frontend/src/components/dashboard/rating-chart.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { RatingDistribution } from "@/types/dashboard"

interface Props {
  data: RatingDistribution[]
}

const COLORS = ["#E53935", "#FF8A3D", "#F4C542", "#5AC8FA", "#12B76A"]

export default function RatingChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text">Rating Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="rating"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickFormatter={(v: number) => `${v}★`}
          />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
            formatter={(value: number) => [`${value} reviews`, "Count"]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/rating-chart.tsx ; git commit -m "feat: add rating distribution chart"
```

---

## Task 7: Frontend — Platform Donut Chart

**Files:**
- Create: `frontend/src/components/dashboard/platform-chart.tsx`

- [ ] **Step 1: Create `frontend/src/components/dashboard/platform-chart.tsx`**

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { PlatformBreakdown } from "@/types/dashboard"

interface Props {
  data: PlatformBreakdown[]
}

const COLORS = ["#4361EE", "#E53935", "#8B5CF6", "#12B76A", "#FF8A3D"]

export default function PlatformChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text">By Platform</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="count"
            nameKey="platform"
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
            formatter={(value: number, name: string) => [`${value} reviews`, name]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-text-secondary capitalize">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/platform-chart.tsx ; git commit -m "feat: add platform donut chart"
```

---

## Task 8: Frontend — NPS Gauge

**Files:**
- Create: `frontend/src/components/dashboard/nps-gauge.tsx`

- [ ] **Step 1: Create `frontend/src/components/dashboard/nps-gauge.tsx`**

```tsx
import { cn } from "@/lib/utils"

interface Props {
  score: number
}

function getNpsColor(score: number): string {
  if (score >= 50) return "text-success"
  if (score >= 0) return "text-warning"
  return "text-danger"
}

function getNpsLabel(score: number): string {
  if (score >= 70) return "Excellent"
  if (score >= 50) return "Great"
  if (score >= 0) return "Needs Improvement"
  return "Critical"
}

export default function NpsGauge({ score }: Props) {
  const clamped = Math.max(-100, Math.min(100, score))
  const rotation = ((clamped + 100) / 200) * 180 - 90

  return (
    <div className="rounded-2xl bg-card p-6 flex flex-col items-center">
      <h3 className="mb-4 text-sm font-semibold text-text">NPS Score</h3>
      <div className="relative h-28 w-40">
        <svg viewBox="0 0 200 100" className="h-full w-full">
          <path
            d="M 10 90 A 90 90 0 0 1 190 90"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 10 90 A 90 90 0 0 1 190 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${((clamped + 100) / 200) * 283} 283`}
            className={getNpsColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className={cn("text-3xl font-bold", getNpsColor(score))}>{score}</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-text-secondary">{getNpsLabel(score)}</p>
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/nps-gauge.tsx ; git commit -m "feat: add NPS gauge component"
```

---

## Task 9: Frontend — Recent Reviews Feed

**Files:**
- Create: `frontend/src/components/dashboard/recent-reviews.tsx`

- [ ] **Step 1: Create `frontend/src/components/dashboard/recent-reviews.tsx`**

```tsx
import RatingBadge from "@/components/shared/rating-badge"
import { timeAgo } from "@/lib/utils"
import type { RecentReview } from "@/types/dashboard"

interface Props {
  reviews: RecentReview[]
}

export default function RecentReviews({ reviews }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text">Recent Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="flex items-start gap-3">
            <RatingBadge rating={review.rating} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">{review.reviewer_name}</span>
                <span className="text-text-muted">·</span>
                <span className="text-xs capitalize text-text-secondary">{review.platform}</span>
                <span className="text-text-muted">·</span>
                <span className="text-xs text-text-muted">{timeAgo(review.created_at)}</span>
              </div>
              {review.text && (
                <p className="mt-1 text-xs text-text-secondary line-clamp-2">{review.text}</p>
              )}
              {review.sentiment && (
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  review.sentiment === "positive" ? "bg-success-bg text-success" :
                  review.sentiment === "negative" ? "bg-danger-bg text-danger" :
                  "bg-card-secondary text-text-secondary"
                }`}>
                  {review.sentiment}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/recent-reviews.tsx ; git commit -m "feat: add recent reviews feed component"
```

---

## Task 10: Frontend — Location Summary

**Files:**
- Create: `frontend/src/components/dashboard/location-summary.tsx`

- [ ] **Step 1: Create `frontend/src/components/dashboard/location-summary.tsx`**

```tsx
import { MapPin, TrendingUp, TrendingDown } from "lucide-react"
import type { LocationSummary as LocationSummaryType } from "@/types/dashboard"

interface Props {
  title: string
  locations: LocationSummaryType[]
  variant: "top" | "bottom"
}

export default function LocationSummary({ title, locations, variant }: Props) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        {variant === "top" ? (
          <TrendingUp className="h-4 w-4 text-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-danger" />
        )}
        <h3 className="text-sm font-semibold text-text">{title}</h3>
      </div>
      <div className="space-y-3">
        {locations.length === 0 ? (
          <p className="text-xs text-text-muted">No data yet</p>
        ) : (
          locations.map((loc) => (
            <div key={loc.location_id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-text-muted" />
                <span className="text-xs font-medium text-text">{loc.location_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">{loc.review_count} reviews</span>
                <span className={`text-xs font-bold ${
                  loc.average_rating >= 4 ? "text-success" :
                  loc.average_rating >= 3 ? "text-warning" :
                  "text-danger"
                }`}>
                  ⭐ {loc.average_rating}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/location-summary.tsx ; git commit -m "feat: add location summary component"
```

---

## Task 11: Frontend — Dashboard Page

**Files:**
- Modify: `frontend/src/app/routes/overview.tsx`

- [ ] **Step 1: Replace `frontend/src/app/routes/overview.tsx`**

```tsx
import { useEffect } from "react"
import { useDashboardStore } from "@/stores/dashboard-store"
import KpiRow from "@/components/dashboard/kpi-row"
import SentimentChart from "@/components/dashboard/sentiment-chart"
import RatingChart from "@/components/dashboard/rating-chart"
import PlatformChart from "@/components/dashboard/platform-chart"
import NpsGauge from "@/components/dashboard/nps-gauge"
import RecentReviews from "@/components/dashboard/recent-reviews"
import LocationSummary from "@/components/dashboard/location-summary"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function OverviewPage() {
  const { data, isLoading, fetchDashboard } = useDashboardStore()

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Overview of your reputation metrics</p>
      </div>

      <KpiRow kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SentimentChart data={data.sentiment_trend} />
        </div>
        <NpsGauge score={data.nps_score} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RatingChart data={data.rating_distribution} />
        <PlatformChart data={data.platform_breakdown} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentReviews reviews={data.recent_reviews} />
        </div>
        <div className="space-y-6">
          <LocationSummary
            title="Top Locations"
            locations={data.top_locations}
            variant="top"
          />
          <LocationSummary
            title="Needs Attention"
            locations={data.bottom_locations}
            variant="bottom"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/routes/overview.tsx ; git commit -m "feat: implement Dashboard page with KPIs, charts, and bento layout"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Backend tests**

Run: `cd D:\Revly\backend ; python -m pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 2: Frontend build**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: Build succeeds

- [ ] **Step 3: Backend import check**

Run: `cd D:\Revly\backend ; python -c "from app.api.v1 import router; print('OK')"`
Expected: OK

- [ ] **Step 4: Git log**

Run: `git log --oneline`
Expected: All Phase 3 commits present

- [ ] **Step 5: Final commit**

```bash
git add -A ; git commit -m "chore: Phase 3 Dashboard complete"
```

---

## Phase 3 Complete

After this plan is executed, Revly has:

1. **Dashboard endpoint** aggregating all review data into a single response
2. **4 KPI cards** — Total Reviews, Average Rating, Response Rate, Avg Response Time
3. **Sentiment trend chart** — 30-day area chart showing review volume over time
4. **Rating distribution chart** — Bar chart with color-coded 1-5 star bars
5. **Platform donut chart** — Breakdown by Google/Zomato/Reelo
6. **NPS gauge** — SVG arc gauge with color-coded score
7. **Recent reviews feed** — Last 5 reviews with ratings, sentiment, platform
8. **Location summary** — Top/bottom locations by rating
9. **Bento-grid layout** — Responsive grid matching the Olly dashboard design
10. All existing Phase 1 & 2 features still working
