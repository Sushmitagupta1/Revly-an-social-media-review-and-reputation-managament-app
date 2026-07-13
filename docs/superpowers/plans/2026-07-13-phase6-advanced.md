# Phase 6: Advanced Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the final set of features — Reports, Notifications, Account Profile, Team, and Locations — completing the full Revly product.

**Architecture:** Reports reuses existing dashboard aggregation. Notifications get a new model with CRUD. Account pages use existing User model for profile/team, new Location model for locations. All backend endpoints follow established patterns. Frontend follows Zustand store + component + page pattern.

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic v2, React 19, Zustand, Tailwind CSS, shadcn/ui, Recharts

---

## File Structure

### Backend (new/modified)
- Create: `backend/app/api/v1/reports.py` — Reports endpoint (summary + CSV export)
- Create: `backend/app/models/notification.py` — Notification model
- Create: `backend/app/schemas/notification.py` — Notification schemas
- Create: `backend/app/api/v1/notifications.py` — Notification CRUD
- Create: `backend/app/models/location.py` — Location model
- Create: `backend/app/schemas/location.py` — Location schemas
- Create: `backend/app/api/v1/locations.py` — Location CRUD
- Modify: `backend/app/models/__init__.py` — export Notification, Location
- Modify: `backend/app/api/v1/__init__.py` — mount new routers
- Create: `backend/app/seeds/locations.py` — Location seed data
- Create: `backend/tests/test_reports.py`
- Create: `backend/tests/test_notifications.py`
- Create: `backend/tests/test_locations.py`

### Frontend (new/modified)
- Create: `frontend/src/types/notification.ts`
- Create: `frontend/src/types/location.ts`
- Create: `frontend/src/stores/report-store.ts`
- Create: `frontend/src/stores/notification-store.ts`
- Create: `frontend/src/stores/location-store.ts`
- Create: `frontend/src/components/reports/report-summary.tsx`
- Create: `frontend/src/components/notifications/notification-card.tsx`
- Create: `frontend/src/components/notifications/notification-list.tsx`
- Create: `frontend/src/components/account/profile-form.tsx`
- Create: `frontend/src/components/account/team-list.tsx`
- Create: `frontend/src/components/account/location-list.tsx`
- Modify: `frontend/src/app/routes/reports.tsx`
- Modify: `frontend/src/app/routes/notifications.tsx`
- Modify: `frontend/src/app/routes/account/profile.tsx`
- Modify: `frontend/src/app/routes/account/team.tsx`
- Modify: `frontend/src/app/routes/account/locations.tsx`

---

## Task 1: Backend — Reports Endpoint

**Files:**
- Create: `backend/app/api/v1/reports.py`
- Create: `backend/tests/test_reports.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_reports.py
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.review import Review
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)
BRAND_ID = uuid.uuid4()


def _seed():
    db = SessionLocal()
    try:
        db.query(Review).delete()
        db.query(User).delete()
        db.commit()
        user = User(id=uuid.uuid4(), email="rpt@test.com", full_name="Rpt",
                     password_hash=hash_password("pass"), is_active=True)
        db.add(user)
        db.commit()
        for i in range(5):
            db.add(Review(
                brand_id=BRAND_ID, platform="google", reviewer_name=f"R{i}",
                rating=5 if i < 3 else 2, text=f"Review {i}",
                sentiment="positive" if i < 3 else "negative",
            ))
        db.commit()
        return user
    finally:
        db.close()


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_report_summary():
    user = _seed()
    resp = client.get("/api/v1/reports/summary", headers=_auth(user))
    assert resp.status_code == 200
    data = resp.json()
    assert "total_reviews" in data
    assert "average_rating" in data
    assert "by_sentiment" in data
    assert "by_platform" in data


def test_report_export_csv():
    user = _seed()
    resp = client.get("/api/v1/reports/export", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/csv; charset=utf-8"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_reports.py -v`
Expected: FAIL with 404

- [ ] **Step 3: Create reports endpoint**

```python
# backend/app/api/v1/reports.py
import io
import math
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, CurrentUser, DbSession
from app.models.review import Review
from app.core.csv_export import export_reviews_csv

router = APIRouter()


@router.get("/summary")
def report_summary(db: DbSession, _user: CurrentUser):
    total = db.query(func.count(Review.id)).scalar() or 0
    avg = db.query(func.avg(Review.rating)).scalar() or 0

    platform_rows = db.query(Review.platform, func.count(Review.id)).group_by(Review.platform).all()
    by_platform = {p: c for p, c in platform_rows}

    sentiment_rows = db.query(Review.sentiment, func.count(Review.id)).group_by(Review.sentiment).all()
    by_sentiment = {s: c for s, c in sentiment_rows if s}

    rating_rows = db.query(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
    by_rating = {r: c for r, c in rating_rows}

    return {
        "total_reviews": total,
        "average_rating": round(float(avg), 1),
        "by_sentiment": by_sentiment,
        "by_platform": by_platform,
        "by_rating": by_rating,
    }


@router.get("/export")
def export_report(
    db: DbSession,
    _user: CurrentUser,
    platform: str | None = None,
    rating: int | None = None,
):
    query = db.query(Review)
    if platform:
        query = query.filter(Review.platform == platform)
    if rating is not None:
        query = query.filter(Review.rating == rating)

    reviews = query.order_by(Review.created_at.desc()).all()
    csv_content = export_reviews_csv(reviews)

    return StreamingResponse(
        io.BytesIO(csv_content.encode()),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=report.csv"},
    )
```

- [ ] **Step 4: Register router**

In `backend/app/api/v1/__init__.py`, add:
```python
from app.api.v1.reports import router as reports_router
router.include_router(reports_router, prefix="/reports", tags=["reports"])
```

- [ ] **Step 5: Run tests**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_reports.py -v`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/reports.py backend/app/api/v1/__init__.py backend/tests/test_reports.py
git commit -m "feat: add reports summary and CSV export endpoint"
```

---

## Task 2: Backend — Notification Model + CRUD

**Files:**
- Create: `backend/app/models/notification.py`
- Create: `backend/app/schemas/notification.py`
- Create: `backend/app/api/v1/notifications.py`
- Create: `backend/tests/test_notifications.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/api/v1/__init__.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_notifications.py
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.notification import Notification
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)


def _setup():
    db = SessionLocal()
    try:
        db.query(Notification).delete()
        db.query(User).delete()
        db.commit()
        user = User(id=uuid.uuid4(), email="notif@test.com", full_name="N",
                     password_hash=hash_password("pass"), is_active=True)
        db.add(user)
        db.commit()
        return user
    finally:
        db.close()


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_list_notifications():
    user = _setup()
    resp = client.get("/api/v1/notifications", headers=_auth(user))
    assert resp.status_code == 200
    assert "notifications" in resp.json()


def test_create_notification():
    user = _setup()
    resp = client.post("/api/v1/notifications", headers=_auth(user), json={
        "user_id": str(user.id),
        "title": "New review",
        "message": "You got a 5-star review!",
        "type": "review",
    })
    assert resp.status_code == 200
    assert resp.json()["title"] == "New review"


def test_mark_read():
    user = _setup()
    create = client.post("/api/v1/notifications", headers=_auth(user), json={
        "user_id": str(user.id),
        "title": "Test",
        "message": "Test message",
        "type": "review",
    })
    nid = create.json()["id"]
    resp = client.patch(f"/api/v1/notifications/{nid}/read", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["is_read"] is True
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_notifications.py -v`
Expected: FAIL with 404

- [ ] **Step 3: Create Notification model**

```python
# backend/app/models/notification.py
import uuid
from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
```

- [ ] **Step 4: Create Notification schemas**

```python
# backend/app/schemas/notification.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    title: str
    message: str
    type: str


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread: int
```

- [ ] **Step 5: Create Notification CRUD endpoints**

```python
# backend/app/api/v1/notifications.py
import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, CurrentUser, DbSession
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate, NotificationResponse, NotificationListResponse,
)

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
def list_notifications(db: DbSession, user: CurrentUser):
    query = db.query(Notification).filter(Notification.user_id == user.id)
    total = query.count()
    unread = query.filter(Notification.is_read == False).count()
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread=unread,
    )


@router.post("", response_model=NotificationResponse)
def create_notification(
    body: NotificationCreate,
    db: DbSession,
    _user: CurrentUser,
):
    notif = Notification(**body.model_dump())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return NotificationResponse.model_validate(notif)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: str,
    db: DbSession,
    user: CurrentUser,
):
    notif = db.query(Notification).filter(
        Notification.id == __import__("uuid").UUID(notification_id),
        Notification.user_id == user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return NotificationResponse.model_validate(notif)
```

- [ ] **Step 6: Update models/__init__.py and api/v1/__init__.py**

In `backend/app/models/__init__.py`, add:
```python
from app.models.notification import Notification
# add to __all__
```

In `backend/app/api/v1/__init__.py`, add:
```python
from app.api.v1.notifications import router as notifications_router
router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
```

- [ ] **Step 7: Run tests**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_notifications.py -v`
Expected: All 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/notification.py backend/app/schemas/notification.py backend/app/api/v1/notifications.py backend/app/models/__init__.py backend/app/api/v1/__init__.py backend/tests/test_notifications.py
git commit -m "feat: add Notification model, CRUD endpoints, and tests"
```

---

## Task 3: Backend — Location Model + CRUD

**Files:**
- Create: `backend/app/models/location.py`
- Create: `backend/app/schemas/location.py`
- Create: `backend/app/api/v1/locations.py`
- Create: `backend/app/seeds/locations.py`
- Create: `backend/tests/test_locations.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/api/v1/__init__.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_locations.py
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.location import Location
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)


def _setup():
    db = SessionLocal()
    try:
        db.query(Location).delete()
        db.query(User).delete()
        db.commit()
        user = User(id=uuid.uuid4(), email="loc@test.com", full_name="L",
                     password_hash=hash_password("pass"), is_active=True)
        db.add(user)
        db.commit()
        return user
    finally:
        db.close()


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_create_location():
    user = _setup()
    resp = client.post("/api/v1/locations", headers=_auth(user), json={
        "name": "SG Highway", "address": "123 Main St", "city": "Ahmedabad",
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "SG Highway"


def test_list_locations():
    user = _setup()
    client.post("/api/v1/locations", headers=_auth(user), json={
        "name": "Loc1", "address": "Addr1", "city": "City1",
    })
    resp = client.get("/api/v1/locations", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_delete_location():
    user = _setup()
    create = client.post("/api/v1/locations", headers=_auth(user), json={
        "name": "Del", "address": "Addr", "city": "City",
    })
    lid = create.json()["id"]
    resp = client.delete(f"/api/v1/locations/{lid}", headers=_auth(user))
    assert resp.status_code == 200
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_locations.py -v`
Expected: FAIL with 404

- [ ] **Step 3: Create Location model**

```python
# backend/app/models/location.py
import uuid
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class Location(Base, TimestampMixin):
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
```

- [ ] **Step 4: Create Location schemas**

```python
# backend/app/schemas/location.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class LocationCreate(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None


class LocationResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: str | None
    city: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class LocationListResponse(BaseModel):
    locations: list[LocationResponse]
    total: int
```

- [ ] **Step 5: Create Location CRUD endpoints**

```python
# backend/app/api/v1/locations.py
import uuid
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationResponse, LocationListResponse
from app.core.constants import MOCK_BRAND_ID

router = APIRouter()


@router.get("", response_model=LocationListResponse)
def list_locations(db: DbSession, _user: CurrentUser):
    rows = db.query(Location).filter(Location.brand_id == MOCK_BRAND_ID).order_by(Location.name).all()
    return LocationListResponse(
        locations=[LocationResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@router.post("", response_model=LocationResponse)
def create_location(body: LocationCreate, db: DbSession, _user: CurrentUser):
    loc = Location(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return LocationResponse.model_validate(loc)


@router.delete("/{location_id}")
def delete_location(location_id: str, db: DbSession, _user: CurrentUser):
    loc = db.query(Location).filter(
        Location.id == uuid.UUID(location_id),
        Location.brand_id == MOCK_BRAND_ID,
    ).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
    return {"ok": True}
```

- [ ] **Step 6: Update models/__init__.py and api/v1/__init__.py**

Add Location to models export and mount router.

- [ ] **Step 7: Create seed data**

```python
# backend/app/seeds/locations.py
import uuid
from app.core.database import SessionLocal
from app.models.location import Location
from app.core.constants import MOCK_BRAND_ID

LOCATIONS = [
    ("SG Highway", "SG Highway Road", "Ahmedabad"),
    ("Vastrapur", "Vastrapur Lake Road", "Ahmedabad"),
    ("Drive-In", "Drive-In Road", "Ahmedabad"),
    ("Bodakdev", "Bodakdev Cross Roads", "Ahmedabad"),
    ("Thaltej", "Thaltej Road", "Ahmedabad"),
]


def seed_locations():
    db = SessionLocal()
    try:
        if db.query(Location).count() > 0:
            print("Locations already seeded. Skipping.")
            return
        for name, address, city in LOCATIONS:
            db.add(Location(brand_id=MOCK_BRAND_ID, name=name, address=address, city=city))
        db.commit()
        print(f"Seeded {len(LOCATIONS)} locations.")
    finally:
        db.close()
```

- [ ] **Step 8: Run tests**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_locations.py -v`
Expected: All 3 tests PASS

- [ ] **Step 9: Commit**

```bash
git add backend/app/models/location.py backend/app/schemas/location.py backend/app/api/v1/locations.py backend/app/seeds/locations.py backend/app/models/__init__.py backend/app/api/v1/__init__.py backend/tests/test_locations.py
git commit -m "feat: add Location model, CRUD endpoints, and seed data"
```

---

## Task 4: Frontend — Types + Stores + Reports Page

**Files:**
- Create: `frontend/src/types/notification.ts`
- Create: `frontend/src/types/location.ts`
- Create: `frontend/src/stores/report-store.ts`
- Create: `frontend/src/stores/notification-store.ts`
- Create: `frontend/src/stores/location-store.ts`
- Create: `frontend/src/components/reports/report-summary.tsx`
- Modify: `frontend/src/app/routes/reports.tsx`

- [ ] **Step 1: Create types**

```typescript
// frontend/src/types/notification.ts
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread: number
}
```

```typescript
// frontend/src/types/location.ts
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
```

- [ ] **Step 2: Create stores**

```typescript
// frontend/src/stores/report-store.ts
import { create } from "zustand"
import apiClient from "@/lib/api-client"

interface ReportSummary {
  total_reviews: number
  average_rating: number
  by_sentiment: Record<string, number>
  by_platform: Record<string, number>
  by_rating: Record<number, number>
}

interface ReportState {
  summary: ReportSummary | null
  isLoading: boolean
  fetchSummary: () => Promise<void>
  exportCsv: () => Promise<void>
}

export const useReportStore = create<ReportState>((set) => ({
  summary: null, isLoading: false,
  fetchSummary: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/reports/summary")
    set({ summary: data, isLoading: false })
  },
  exportCsv: async () => {
    const { data } = await apiClient.get("/reports/export", { responseType: "blob" })
    const url = window.URL.createObjectURL(new Blob([data]))
    const a = document.createElement("a")
    a.href = url
    a.download = "report.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  },
}))
```

```typescript
// frontend/src/stores/notification-store.ts
import { create } from "zustand"
import type { Notification } from "@/types/notification"
import apiClient from "@/lib/api-client"

interface NotificationState {
  notifications: Notification[]
  total: number
  unread: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [], total: 0, unread: 0, isLoading: false,
  fetchNotifications: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/notifications")
    set({ notifications: data.notifications, total: data.total, unread: data.unread, isLoading: false })
  },
  markRead: async (id) => {
    await apiClient.patch(`/notifications/${id}/read`)
    get().fetchNotifications()
  },
}))
```

```typescript
// frontend/src/stores/location-store.ts
import { create } from "zustand"
import type { Location } from "@/types/location"
import apiClient from "@/lib/api-client"

interface LocationState {
  locations: Location[]
  total: number
  isLoading: boolean
  fetchLocations: () => Promise<void>
  createLocation: (data: { name: string; address?: string; city?: string }) => Promise<void>
  deleteLocation: (id: string) => Promise<void>
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: [], total: 0, isLoading: false,
  fetchLocations: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/locations")
    set({ locations: data.locations, total: data.total, isLoading: false })
  },
  createLocation: async (body) => {
    await apiClient.post("/locations", body)
    get().fetchLocations()
  },
  deleteLocation: async (id) => {
    await apiClient.delete(`/locations/${id}`)
    get().fetchLocations()
  },
}))
```

- [ ] **Step 3: Create ReportSummary component**

```tsx
// frontend/src/components/reports/report-summary.tsx
import KpiCard from "@/components/shared/kpi-card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface Props {
  summary: {
    total_reviews: number
    average_rating: number
    by_sentiment: Record<string, number>
    by_platform: Record<string, number>
    by_rating: Record<number, number>
  }
}

const SENTIMENT_COLORS: Record<string, string> = { positive: "#22C55E", neutral: "#94A3B8", negative: "#EF4444" }
const PLATFORM_COLORS = ["#3B82F6", "#EF4444", "#8B5CF6", "#F59E0B"]

export default function ReportSummary({ summary }: Props) {
  const sentimentData = Object.entries(summary.by_sentiment).map(([name, value]) => ({ name, value }))
  const platformData = Object.entries(summary.by_platform).map(([name, value]) => ({ name, value }))
  const ratingData = Object.entries(summary.by_rating).map(([name, value]) => ({ name: `${name}★`, value }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Reviews" value={summary.total_reviews} className="bg-surface border border-border" />
        <KpiCard label="Average Rating" value={`${summary.average_rating}★`} className="bg-surface border border-border" />
        <KpiCard label="Positive" value={summary.by_sentiment.positive || 0} className="bg-surface border border-border" />
        <KpiCard label="Negative" value={summary.by_sentiment.negative || 0} className="bg-surface border border-border" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingData}>
              <XAxis dataKey="name" tick={{ fill: "#CBD5E1", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text">Sentiment Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                {sentimentData.map((entry) => (
                  <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || "#94A3B8"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement Reports page**

```tsx
// frontend/src/app/routes/reports.tsx
import { useEffect } from "react"
import { useReportStore } from "@/stores/report-store"
import ReportSummary from "@/components/reports/report-summary"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ReportsPage() {
  const { summary, isLoading, fetchSummary, exportCsv } = useReportStore()

  useEffect(() => { fetchSummary() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="mt-1 text-sm text-text-secondary">Summary of your reputation metrics</p>
        </div>
        <Button variant="ghost" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {isLoading || !summary ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : (
        <ReportSummary summary={summary} />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify frontend builds**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/ frontend/src/stores/report-store.ts frontend/src/stores/notification-store.ts frontend/src/stores/location-store.ts frontend/src/components/reports/ frontend/src/app/routes/reports.tsx
git commit -m "feat: add reports page with summary charts and CSV export"
```

---

## Task 5: Frontend — Notifications Page

**Files:**
- Create: `frontend/src/components/notifications/notification-card.tsx`
- Create: `frontend/src/components/notifications/notification-list.tsx`
- Modify: `frontend/src/app/routes/notifications.tsx`

- [ ] **Step 1: Create NotificationCard**

```tsx
// frontend/src/components/notifications/notification-card.tsx
import { CheckCircle, AlertTriangle, Star, Info } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/types/notification"

interface Props {
  notification: Notification
  onMarkRead: (id: string) => void
}

const typeIcons: Record<string, typeof Star> = {
  review: Star, complaint: AlertTriangle, system: Info,
}

export default function NotificationCard({ notification, onMarkRead }: Props) {
  const Icon = typeIcons[notification.type] || Info

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${
      notification.is_read ? "border-border bg-surface/50" : "border-info/30 bg-surface"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
          notification.is_read ? "bg-card-secondary" : "bg-info/20"
        }`}>
          <Icon className={`h-4 w-4 ${notification.is_read ? "text-text-secondary" : "text-info"}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-text">{notification.title}</h4>
          <p className="mt-0.5 text-xs text-text-secondary">{notification.message}</p>
          <p className="mt-1 text-xs text-text-muted">{timeAgo(notification.created_at)}</p>
        </div>
        {!notification.is_read && (
          <Button variant="ghost" size="sm" onClick={() => onMarkRead(notification.id)}>
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create NotificationList**

```tsx
// frontend/src/components/notifications/notification-list.tsx
import NotificationCard from "./notification-card"
import type { Notification } from "@/types/notification"

interface Props {
  notifications: Notification[]
  onMarkRead: (id: string) => void
}

export default function NotificationList({ notifications, onMarkRead }: Props) {
  return (
    <div className="grid gap-3">
      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} onMarkRead={onMarkRead} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Implement Notifications page**

```tsx
// frontend/src/app/routes/notifications.tsx
import { useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"
import NotificationList from "@/components/notifications/notification-list"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"

export default function NotificationsPage() {
  const { notifications, unread, isLoading, fetchNotifications, markRead } = useNotificationStore()

  useEffect(() => { fetchNotifications() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-text-secondary">Stay updated on your reputation</p>
        </div>
        {unread > 0 && <Badge variant="default">{unread} unread</Badge>}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" />
      ) : (
        <NotificationList notifications={notifications} onMarkRead={markRead} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify frontend builds**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/notifications/ frontend/src/app/routes/notifications.tsx
git commit -m "feat: implement Notifications page with read/unread states"
```

---

## Task 6: Frontend — Account Profile Page

**Files:**
- Create: `frontend/src/components/account/profile-form.tsx`
- Modify: `frontend/src/app/routes/account/profile.tsx`

- [ ] **Step 1: Create ProfileForm**

```tsx
// frontend/src/components/account/profile-form.tsx
import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import apiClient from "@/lib/api-client"

export default function ProfileForm() {
  const { user, fetchUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "")
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await apiClient.patch("/users/me", { full_name: fullName, avatar_url: avatarUrl || null })
    await fetchUser()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Email</label>
        <Input value={user.email} disabled className="opacity-60" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Full Name</label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Avatar URL</label>
        <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Role</label>
        <Input value={user.role_name || "User"} disabled className="opacity-60" />
      </div>
      <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
    </form>
  )
}
```

- [ ] **Step 2: Implement Profile page**

```tsx
// frontend/src/app/routes/account/profile.tsx
import ProfileForm from "@/components/account/profile-form"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your account settings</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <ProfileForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify frontend builds**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/account/profile-form.tsx frontend/src/app/routes/account/profile.tsx
git commit -m "feat: implement Account Profile page with edit form"
```

---

## Task 7: Frontend — Account Team + Locations Pages

**Files:**
- Create: `frontend/src/components/account/team-list.tsx`
- Create: `frontend/src/components/account/location-list.tsx`
- Modify: `frontend/src/app/routes/account/team.tsx`
- Modify: `frontend/src/app/routes/account/locations.tsx`

- [ ] **Step 1: Create TeamList**

```tsx
// frontend/src/components/account/team-list.tsx
import { useEffect } from "react"
import apiClient from "@/lib/api-client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface TeamMember {
  id: string
  email: string
  full_name: string
  role_name: string | null
  is_active: boolean
}

export default function TeamList() {
  const [members, setMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    apiClient.get("/users/me").then(({ data }) => {
      setMembers([{ ...data, role_name: data.role_name || "Admin", is_active: true }])
    })
  }, [])

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card-secondary text-sm font-bold text-text">
              {m.full_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-text">{m.full_name}</p>
              <p className="text-xs text-text-secondary">{m.email}</p>
            </div>
          </div>
          <Badge variant={m.is_active ? "success" : "secondary"}>{m.role_name || "Member"}</Badge>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create LocationList**

```tsx
// frontend/src/components/account/location-list.tsx
import { useEffect, useState } from "react"
import { MapPin, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import apiClient from "@/lib/api-client"

interface Loc {
  id: string
  name: string
  address: string | null
  city: string | null
}

export default function LocationList() {
  const [locations, setLocations] = useState<Loc[]>([])
  const [name, setName] = useState("")
  const [city, setCity] = useState("")

  const fetch = () => apiClient.get("/locations").then(({ data }) => setLocations(data.locations))

  useEffect(() => { fetch() }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await apiClient.post("/locations", { name: name.trim(), city: city.trim() || undefined })
    setName("")
    setCity("")
    fetch()
  }

  const remove = async (id: string) => {
    await apiClient.delete(`/locations/${id}`)
    fetch()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <Input placeholder="Location name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="w-40" />
        <Button type="submit" size="sm" disabled={!name.trim()}>Add</Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {locations.map((loc) => (
          <div key={loc.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-text-secondary" />
              <div>
                <p className="text-sm font-medium text-text">{loc.name}</p>
                {loc.city && <p className="text-xs text-text-secondary">{loc.city}</p>}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => remove(loc.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement Team page**

```tsx
// frontend/src/app/routes/account/team.tsx
import TeamList from "@/components/account/team-list"

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your team members</p>
      </div>
      <TeamList />
    </div>
  )
}
```

- [ ] **Step 4: Implement Locations page**

```tsx
// frontend/src/app/routes/account/locations.tsx
import LocationList from "@/components/account/location-list"

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Locations</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your business locations</p>
      </div>
      <LocationList />
    </div>
  )
}
```

- [ ] **Step 5: Verify frontend builds**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/account/ frontend/src/app/routes/account/team.tsx frontend/src/app/routes/account/locations.tsx
git commit -m "feat: implement Account Team and Locations pages"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run all backend tests**

Run: `cd D:\Revly\backend ; python -m pytest tests/ -v`
Expected: All tests PASS

- [ ] **Step 2: Run frontend build**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 3: Verify all imports**

Run: `cd D:\Revly\backend ; python -c "from app.api.v1.reports import router; from app.api.v1.notifications import router; from app.api.v1.locations import router; from app.models.notification import Notification; from app.models.location import Location; print('All imports OK')"`

- [ ] **Step 4: Verify git log**

Run: `git log --oneline -15`
Expected: ~8 new commits for Phase 6

- [ ] **Step 5: Commit if needed**

```bash
git status
git add -A
git commit -m "chore: Phase 6 Advanced features complete"
```
