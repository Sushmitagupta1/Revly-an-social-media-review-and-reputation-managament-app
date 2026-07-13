# Phase 5: Management Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 5 core management features — Inbox, Complaints, Praises, Location Leaderboard, and Competitors — by adding backend query endpoints and replacing frontend stubs with full implementations.

**Architecture:** Inbox/Complaints/Praises/Leaderboard are query-based on existing Review data (no new models). Competitors get a new SQLAlchemy model with CRUD. All backend endpoints reuse existing patterns (deps, schemas, pagination). Frontend follows established Zustand store + component + page pattern.

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic v2, React 19, Zustand, Tailwind CSS, shadcn/ui, Recharts

---

## File Structure

### Backend (new/modified)
- Modify: `backend/app/api/v1/reviews.py` — add resolve endpoint
- Create: `backend/app/api/v1/inbox.py` — inbox endpoint
- Create: `backend/app/api/v1/complaints.py` — complaints endpoint
- Create: `backend/app/api/v1/praises.py` — praises endpoint
- Create: `backend/app/api/v1/leaderboard.py` — location leaderboard endpoint
- Create: `backend/app/models/competitor.py` — Competitor model
- Create: `backend/app/schemas/competitor.py` — Competitor Pydantic schemas
- Create: `backend/app/api/v1/competitors.py` — Competitor CRUD endpoints
- Modify: `backend/app/models/__init__.py` — export Competitor
- Modify: `backend/app/api/v1/__init__.py` — mount new routers
- Create: `backend/app/seeds/competitors.py` — competitor seed data

### Frontend (new/modified)
- Create: `frontend/src/types/inbox.ts` — Inbox types
- Create: `frontend/src/types/competitor.ts` — Competitor types
- Create: `frontend/src/stores/inbox-store.ts` — Inbox store
- Create: `frontend/src/stores/complaints-store.ts` — Complaints store
- Create: `frontend/src/stores/praises-store.ts` — Praises store
- Create: `frontend/src/stores/leaderboard-store.ts` — Leaderboard store
- Create: `frontend/src/stores/competitor-store.ts` — Competitor store
- Create: `frontend/src/components/inbox/inbox-card.tsx` — Inbox review card
- Create: `frontend/src/components/inbox/inbox-stats.tsx` — Inbox KPI row
- Create: `frontend/src/components/complaints/complaint-card.tsx` — Complaint card
- Create: `frontend/src/components/complaints/complaint-stats.tsx` — Complaint KPI row
- Create: `frontend/src/components/complaints/topic-breakdown.tsx` — Topic chart
- Create: `frontend/src/components/praises/praise-card.tsx` — Praise card
- Create: `frontend/src/components/praises/praise-stats.tsx` — Praise KPI row
- Create: `frontend/src/components/leaderboard/leaderboard-table.tsx` — Rankings table
- Create: `frontend/src/components/competitors/competitor-card.tsx` — Competitor card
- Create: `frontend/src/components/competitors/competitor-form.tsx` — Add/edit form
- Modify: `frontend/src/app/routes/inbox.tsx` — full implementation
- Modify: `frontend/src/app/routes/complaints.tsx` — full implementation
- Modify: `frontend/src/app/routes/praises.tsx` — full implementation
- Modify: `frontend/src/app/routes/location-leaderboard.tsx` — full implementation
- Modify: `frontend/src/app/routes/competitors.tsx` — full implementation

---

## Task 1: Backend — Review Resolve Endpoint + Inbox Endpoint

**Files:**
- Modify: `backend/app/api/v1/reviews.py`
- Create: `backend/app/api/v1/inbox.py`
- Create: `backend/tests/test_inbox.py`

- [ ] **Step 1: Write the failing test for resolve endpoint**

```python
# backend/tests/test_inbox.py
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, SessionLocal
from app.models.review import Review
from app.models.reply import Reply
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)

BRAND_ID = uuid.uuid4()
LOCATIONS = [uuid.uuid4() for _ in range(3)]


def _seed_reviews():
    db = SessionLocal()
    try:
        db.query(Review).delete()
        db.query(Reply).delete()
        db.query(User).delete()
        db.commit()

        user = User(
            id=uuid.uuid4(),
            email="test@test.com",
            full_name="Test User",
            password_hash=hash_password("password123"),
            is_active=True,
        )
        db.add(user)
        db.commit()

        reviews = []
        for i in range(5):
            r = Review(
                brand_id=BRAND_ID,
                location_id=LOCATIONS[i % 3],
                platform="google",
                reviewer_name=f"Reviewer {i}",
                rating=1 if i < 2 else 4,
                text=f"Review {i}",
                sentiment="negative" if i < 2 else "positive",
                topics=["service"],
                is_resolved=False,
            )
            reviews.append(r)
        db.add_all(reviews)
        db.commit()
        return user
    finally:
        db.close()


def _auth_header(user):
    from app.core.security import create_access_token
    token = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {token}"}


def test_resolve_review():
    user = _seed_reviews()
    headers = _auth_header(user)
    db = SessionLocal()
    review_id = str(db.query(Review).first().id)
    db.close()

    resp = client.patch(f"/api/v1/reviews/{review_id}/resolve", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["is_resolved"] is True


def test_inbox_returns_unreplied_reviews():
    user = _seed_reviews()
    headers = _auth_header(user)

    resp = client.get("/api/v1/inbox", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "reviews" in data
    assert "total" in data
    assert data["total"] >= 1


def test_inbox_filters_urgent():
    user = _seed_reviews()
    headers = _auth_header(user)

    resp = client.get("/api/v1/inbox?priority=urgent", headers=headers)
    assert resp.status_code == 200
    for review in resp.json()["reviews"]:
        assert review["rating"] <= 2
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_inbox.py -v`
Expected: FAIL with 404 (endpoints don't exist)

- [ ] **Step 3: Add resolve endpoint to reviews.py**

Add at the end of `backend/app/api/v1/reviews.py`:

```python
from pydantic import BaseModel

class ResolveResponse(BaseModel):
    id: str
    is_resolved: bool

@router.patch("/{review_id}/resolve", response_model=ResolveResponse)
def resolve_review(
    review_id: str,
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(get_current_user)],
):
    review = db.query(Review).filter(Review.id == uuid.UUID(review_id)).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_resolved = not review.is_resolved
    db.commit()
    db.refresh(review)
    return ResolveResponse(id=str(review.id), is_resolved=review.is_resolved)
```

Also add `import uuid` and `from fastapi import HTTPException` and `from app.api.deps import get_current_user` and `from app.models.user import User` to the imports at the top if not already there.

- [ ] **Step 4: Create inbox endpoint**

```python
# backend/app/api/v1/inbox.py
import math
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.review import Review
from app.models.reply import Reply
from app.schemas.review import ReviewResponse

router = APIRouter()


@router.get("")
def list_inbox(
    db: Annotated[Session, Depends(get_db)],
    _user=Depends(get_current_user),
    priority: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    reply_subq = db.query(Reply.review_id).subquery()
    query = db.query(Review).filter(~Review.id.in_(db.query(reply_subq.c.review_id)))

    if priority == "urgent":
        query = query.filter(Review.rating <= 2)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "reviews": [ReviewResponse.model_validate(r) for r in reviews],
        "total": total,
        "page": page,
        "pages": pages,
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_inbox.py -v`
Expected: All 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/reviews.py backend/app/api/v1/inbox.py backend/tests/test_inbox.py
git commit -m "feat: add review resolve endpoint and inbox endpoint"
```

---

## Task 2: Backend — Complaints + Praises Endpoints

**Files:**
- Create: `backend/app/api/v1/complaints.py`
- Create: `backend/app/api/v1/praises.py`
- Create: `backend/tests/test_complaints_praises.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_complaints_praises.py
import uuid
import pytest
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
        user = User(id=uuid.uuid4(), email="test2@test.com", full_name="Test",
                     password_hash=hash_password("pass123"), is_active=True)
        db.add(user)
        db.commit()
        for i in range(4):
            db.add(Review(
                brand_id=BRAND_ID, platform="google", reviewer_name=f"R{i}",
                rating=1 if i < 2 else 5, text=f"Review {i}",
                sentiment="negative" if i < 2 else "positive",
                topics=["food_quality", "service"], is_resolved=False,
            ))
        db.commit()
        return user
    finally:
        db.close()


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_complaints_list():
    user = _seed()
    resp = client.get("/api/v1/complaints", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    for r in resp.json()["reviews"]:
        assert r["sentiment"] == "negative"


def test_complaints_filter_topic():
    user = _seed()
    resp = client.get("/api/v1/complaints?topic=service", headers=_auth(user))
    assert resp.status_code == 200


def test_praises_list():
    user = _seed()
    resp = client.get("/api/v1/praises", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    for r in resp.json()["reviews"]:
        assert r["sentiment"] == "positive"


def test_praises_filter_platform():
    user = _seed()
    resp = client.get("/api/v1/praises?platform=google", headers=_auth(user))
    assert resp.status_code == 200
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_complaints_praises.py -v`
Expected: FAIL with 404

- [ ] **Step 3: Create complaints endpoint**

```python
# backend/app/api/v1/complaints.py
import math
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.review import Review
from app.schemas.review import ReviewResponse

router = APIRouter()


@router.get("")
def list_complaints(
    db: Annotated[Session, Depends(get_db)],
    _user=Depends(get_current_user),
    topic: str | None = None,
    resolved: bool | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review).filter(Review.sentiment == "negative")
    if topic:
        query = query.filter(Review.topics.op("@>")(f'["{topic}"]'))
    if resolved is not None:
        query = query.filter(Review.is_resolved == resolved)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "reviews": [ReviewResponse.model_validate(r) for r in reviews],
        "total": total,
        "page": page,
        "pages": pages,
    }
```

- [ ] **Step 4: Create praises endpoint**

```python
# backend/app/api/v1/praises.py
import math
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.review import Review
from app.schemas.review import ReviewResponse

router = APIRouter()


@router.get("")
def list_praises(
    db: Annotated[Session, Depends(get_db)],
    _user=Depends(get_current_user),
    platform: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review).filter(Review.sentiment == "positive")
    if platform:
        query = query.filter(Review.platform == platform)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "reviews": [ReviewResponse.model_validate(r) for r in reviews],
        "total": total,
        "page": page,
        "pages": pages,
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_complaints_praises.py -v`
Expected: All 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/complaints.py backend/app/api/v1/praises.py backend/tests/test_complaints_praises.py
git commit -m "feat: add complaints and praises endpoints"
```

---

## Task 3: Backend — Location Leaderboard Endpoint

**Files:**
- Create: `backend/app/api/v1/leaderboard.py`
- Create: `backend/tests/test_leaderboard.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_leaderboard.py
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.review import Review
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)
BRAND_ID = uuid.uuid4()
LOCS = [uuid.uuid4(), uuid.uuid4()]


def _seed():
    db = SessionLocal()
    try:
        db.query(Review).delete()
        db.query(User).delete()
        db.commit()
        user = User(id=uuid.uuid4(), email="t3@test.com", full_name="T",
                     password_hash=hash_password("pass"), is_active=True)
        db.add(user)
        db.commit()
        for i in range(6):
            db.add(Review(
                brand_id=BRAND_ID, location_id=LOCS[i % 2], platform="google",
                reviewer_name=f"R{i}", rating=5 if i < 3 else 2,
                text=f"R{i}", sentiment="positive" if i < 3 else "negative",
            ))
        db.commit()
        return user
    finally:
        db.close()


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_leaderboard():
    user = _seed()
    resp = client.get("/api/v1/leaderboard", headers=_auth(user))
    assert resp.status_code == 200
    data = resp.json()
    assert "locations" in data
    assert len(data["locations"]) == 2
    for loc in data["locations"]:
        assert "location_id" in loc
        assert "avg_rating" in loc
        assert "review_count" in loc
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_leaderboard.py -v`
Expected: FAIL with 404

- [ ] **Step 3: Create leaderboard endpoint**

```python
# backend/app/api/v1/leaderboard.py
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.review import Review

router = APIRouter()


@router.get("")
def get_leaderboard(
    db: Annotated[Session, Depends(get_db)],
    _user=Depends(get_current_user),
):
    rows = (
        db.query(
            Review.location_id,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .filter(Review.location_id.isnot(None))
        .group_by(Review.location_id)
        .all()
    )

    locations = []
    for row in rows:
        sentiment_rows = (
            db.query(Review.sentiment, func.count(Review.id))
            .filter(Review.location_id == row.location_id)
            .group_by(Review.sentiment)
            .all()
        )
        sentiment = {s: c for s, c in sentiment_rows if s}
        total = sum(sentiment.values()) or 1
        positive_pct = round(sentiment.get("positive", 0) / total * 100, 1)

        locations.append({
            "location_id": str(row.location_id),
            "avg_rating": round(float(row.avg_rating), 1),
            "review_count": row.review_count,
            "sentiment_breakdown": sentiment,
            "positive_percentage": positive_pct,
        })

    locations.sort(key=lambda x: x["avg_rating"], reverse=True)

    for i, loc in enumerate(locations):
        loc["rank"] = i + 1

    return {"locations": locations}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_leaderboard.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/leaderboard.py backend/tests/test_leaderboard.py
git commit -m "feat: add location leaderboard endpoint"
```

---

## Task 4: Backend — Competitor Model + CRUD + Seed

**Files:**
- Create: `backend/app/models/competitor.py`
- Create: `backend/app/schemas/competitor.py`
- Create: `backend/app/api/v1/competitors.py`
- Create: `backend/app/seeds/competitors.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/api/v1/__init__.py`
- Create: `backend/tests/test_competitors.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_competitors.py
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.competitor import Competitor
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)


def _setup():
    db = SessionLocal()
    try:
        db.query(Competitor).delete()
        db.query(User).delete()
        db.commit()
        user = User(id=uuid.uuid4(), email="t4@test.com", full_name="T",
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


def test_create_competitor():
    user = _setup()
    resp = client.post("/api/v1/competitors", headers=_auth(user), json={
        "name": "Food Bazaar", "platform": "google", "avg_rating": 4.2, "review_count": 150
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "Food Bazaar"


def test_list_competitors():
    user = _setup()
    client.post("/api/v1/competitors", headers=_auth(user), json={
        "name": "C1", "platform": "google", "avg_rating": 4.0, "review_count": 100
    })
    resp = client.get("/api/v1/competitors", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_delete_competitor():
    user = _setup()
    create = client.post("/api/v1/competitors", headers=_auth(user), json={
        "name": "Del", "platform": "google", "avg_rating": 3.5, "review_count": 50
    })
    cid = create.json()["id"]
    resp = client.delete(f"/api/v1/competitors/{cid}", headers=_auth(user))
    assert resp.status_code == 200
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_competitors.py -v`
Expected: FAIL with 404

- [ ] **Step 3: Create Competitor model**

```python
# backend/app/models/competitor.py
import uuid
from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class Competitor(Base, TimestampMixin):
    __tablename__ = "competitors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    avg_rating: Mapped[float] = mapped_column(nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
```

- [ ] **Step 4: Create Competitor schemas**

```python
# backend/app/schemas/competitor.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class CompetitorCreate(BaseModel):
    name: str
    platform: str
    avg_rating: float | None = None
    review_count: int = 0
    url: str | None = None


class CompetitorUpdate(BaseModel):
    name: str | None = None
    platform: str | None = None
    avg_rating: float | None = None
    review_count: int | None = None
    url: str | None = None


class CompetitorResponse(BaseModel):
    id: uuid.UUID
    name: str
    platform: str
    avg_rating: float | None
    review_count: int
    url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class CompetitorListResponse(BaseModel):
    competitors: list[CompetitorResponse]
    total: int
```

- [ ] **Step 5: Create Competitor CRUD endpoints**

```python
# backend/app/api/v1/competitors.py
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.competitor import Competitor
from app.schemas.competitor import (
    CompetitorCreate, CompetitorUpdate, CompetitorResponse, CompetitorListResponse,
)

router = APIRouter()

MOCK_BRAND_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.get("", response_model=CompetitorListResponse)
def list_competitors(db: Annotated[Session, Depends(get_db)], _user=Depends(get_current_user)):
    rows = db.query(Competitor).filter(Competitor.brand_id == MOCK_BRAND_ID).order_by(Competitor.name).all()
    return CompetitorListResponse(
        competitors=[CompetitorResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@router.post("", response_model=CompetitorResponse)
def create_competitor(
    body: CompetitorCreate,
    db: Annotated[Session, Depends(get_db)],
    _user=Depends(get_current_user),
):
    comp = Competitor(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return CompetitorResponse.model_validate(comp)


@router.patch("/{competitor_id}", response_model=CompetitorResponse)
def update_competitor(
    competitor_id: str,
    body: CompetitorUpdate,
    db: Annotated[Session, Depends(get_db)],
    _user=Depends(get_current_user),
):
    comp = db.query(Competitor).filter(Competitor.id == uuid.UUID(competitor_id)).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(comp, k, v)
    db.commit()
    db.refresh(comp)
    return CompetitorResponse.model_validate(comp)


@router.delete("/{competitor_id}")
def delete_competitor(
    competitor_id: str,
    db: Annotated[Session, Depends(get_db)],
    _user=Depends(get_current_user),
):
    comp = db.query(Competitor).filter(Competitor.id == uuid.UUID(competitor_id)).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    db.delete(comp)
    db.commit()
    return {"ok": True}
```

- [ ] **Step 6: Update models/__init__.py and api/v1/__init__.py**

In `backend/app/models/__init__.py`, add:
```python
from app.models.competitor import Competitor
# add to __all__
```

In `backend/app/api/v1/__init__.py`, add:
```python
from app.api.v1.inbox import router as inbox_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.praises import router as praises_router
from app.api.v1.leaderboard import router as leaderboard_router
from app.api.v1.competitors import router as competitors_router

router.include_router(inbox_router, prefix="/inbox", tags=["inbox"])
router.include_router(complaints_router, prefix="/complaints", tags=["complaints"])
router.include_router(praises_router, prefix="/praises", tags=["praises"])
router.include_router(leaderboard_router, prefix="/leaderboard", tags=["leaderboard"])
router.include_router(competitors_router, prefix="/competitors", tags=["competitors"])
```

- [ ] **Step 7: Create competitor seed**

```python
# backend/app/seeds/competitors.py
import random
from app.core.database import SessionLocal
from app.models.competitor import Competitor

MOCK_BRAND_ID = __import__("uuid").UUID("00000000-0000-0000-0000-000000000001")

COMPETITORS = [
    ("Food Bazaar", "google", 4.2, 150),
    ("Baker's Corner", "google", 3.8, 89),
    ("Sweet Crumbs", "zomato", 4.5, 210),
    ("Urban Bites", "google", 3.6, 67),
    ("The Bread Factory", "reelo", 4.1, 120),
]


def seed_competitors():
    db = SessionLocal()
    try:
        if db.query(Competitor).count() > 0:
            print("Competitors already seeded. Skipping.")
            return
        for name, platform, rating, count in COMPETITORS:
            db.add(Competitor(
                brand_id=MOCK_BRAND_ID, name=name, platform=platform,
                avg_rating=rating, review_count=count,
            ))
        db.commit()
        print(f"Seeded {len(COMPETITORS)} competitors.")
    finally:
        db.close()
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd D:\Revly\backend ; python -m pytest tests/test_competitors.py -v`
Expected: All 3 tests PASS

- [ ] **Step 9: Commit**

```bash
git add backend/app/models/competitor.py backend/app/schemas/competitor.py backend/app/api/v1/competitors.py backend/app/seeds/competitors.py backend/app/models/__init__.py backend/app/api/v1/__init__.py backend/tests/test_competitors.py
git commit -m "feat: add Competitor model, CRUD endpoints, and seed data"
```

---

## Task 5: Frontend — Types + Stores for All Features

**Files:**
- Create: `frontend/src/types/inbox.ts`
- Create: `frontend/src/types/competitor.ts`
- Create: `frontend/src/stores/inbox-store.ts`
- Create: `frontend/src/stores/complaints-store.ts`
- Create: `frontend/src/stores/praises-store.ts`
- Create: `frontend/src/stores/leaderboard-store.ts`
- Create: `frontend/src/stores/competitor-store.ts`

- [ ] **Step 1: Create types**

```typescript
// frontend/src/types/inbox.ts
import type { Review } from "./review"

export interface InboxResponse {
  reviews: Review[]
  total: number
  page: number
  pages: number
}
```

```typescript
// frontend/src/types/competitor.ts
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
```

- [ ] **Step 2: Create stores**

```typescript
// frontend/src/stores/inbox-store.ts
import { create } from "zustand"
import type { Review } from "@/types/review"
import apiClient from "@/lib/api-client"

interface InboxState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  priority: string | null
  setPriority: (p: string | null) => void
  setPage: (p: number) => void
  fetchInbox: () => Promise<void>
  resolveReview: (id: string) => Promise<void>
}

export const useInboxStore = create<InboxState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, priority: null,
  setPriority: (priority) => { set({ priority, page: 1 }); get().fetchInbox() },
  setPage: (page) => { set({ page }); get().fetchInbox() },
  fetchInbox: async () => {
    set({ isLoading: true })
    const { priority, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (priority) params.set("priority", priority)
    const { data } = await apiClient.get(`/inbox?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, isLoading: false })
  },
  resolveReview: async (id) => {
    await apiClient.patch(`/reviews/${id}/resolve`)
    get().fetchInbox()
  },
}))
```

```typescript
// frontend/src/stores/complaints-store.ts
import { create } from "zustand"
import type { Review } from "@/types/review"
import apiClient from "@/lib/api-client"

interface ComplaintsState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  topic: string | null
  resolved: boolean | null
  setTopic: (t: string | null) => void
  setResolved: (r: boolean | null) => void
  setPage: (p: number) => void
  fetchComplaints: () => Promise<void>
  resolveReview: (id: string) => Promise<void>
}

export const useComplaintsStore = create<ComplaintsState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, topic: null, resolved: null,
  setTopic: (topic) => { set({ topic, page: 1 }); get().fetchComplaints() },
  setResolved: (resolved) => { set({ resolved, page: 1 }); get().fetchComplaints() },
  setPage: (page) => { set({ page }); get().fetchComplaints() },
  fetchComplaints: async () => {
    set({ isLoading: true })
    const { topic, resolved, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (topic) params.set("topic", topic)
    if (resolved !== null) params.set("resolved", String(resolved))
    const { data } = await apiClient.get(`/complaints?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, isLoading: false })
  },
  resolveReview: async (id) => {
    await apiClient.patch(`/reviews/${id}/resolve`)
    get().fetchComplaints()
  },
}))
```

```typescript
// frontend/src/stores/praises-store.ts
import { create } from "zustand"
import type { Review } from "@/types/review"
import apiClient from "@/lib/api-client"

interface PraisesState {
  reviews: Review[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  platform: string | null
  setPlatform: (p: string | null) => void
  setPage: (p: number) => void
  fetchPraises: () => Promise<void>
}

export const usePraisesStore = create<PraisesState>((set, get) => ({
  reviews: [], total: 0, page: 1, pages: 1, isLoading: false, platform: null,
  setPlatform: (platform) => { set({ platform, page: 1 }); get().fetchPraises() },
  setPage: (page) => { set({ page }); get().fetchPraises() },
  fetchPraises: async () => {
    set({ isLoading: true })
    const { platform, page } = get()
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (platform) params.set("platform", platform)
    const { data } = await apiClient.get(`/praises?${params}`)
    set({ reviews: data.reviews, total: data.total, pages: data.pages, isLoading: false })
  },
}))
```

```typescript
// frontend/src/stores/leaderboard-store.ts
import { create } from "zustand"
import type { LocationRanking } from "@/types/competitor"
import apiClient from "@/lib/api-client"

interface LeaderboardState {
  locations: LocationRanking[]
  isLoading: boolean
  fetchLeaderboard: () => Promise<void>
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  locations: [], isLoading: false,
  fetchLeaderboard: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/leaderboard")
    set({ locations: data.locations, isLoading: false })
  },
}))
```

```typescript
// frontend/src/stores/competitor-store.ts
import { create } from "zustand"
import type { Competitor } from "@/types/competitor"
import apiClient from "@/lib/api-client"

interface CompetitorState {
  competitors: Competitor[]
  total: number
  isLoading: boolean
  fetchCompetitors: () => Promise<void>
  createCompetitor: (data: { name: string; platform: string; avg_rating?: number; review_count?: number }) => Promise<void>
  deleteCompetitor: (id: string) => Promise<void>
}

export const useCompetitorStore = create<CompetitorState>((set, get) => ({
  competitors: [], total: 0, isLoading: false,
  fetchCompetitors: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/competitors")
    set({ competitors: data.competitors, total: data.total, isLoading: false })
  },
  createCompetitor: async (body) => {
    await apiClient.post("/competitors", body)
    get().fetchCompetitors()
  },
  deleteCompetitor: async (id) => {
    await apiClient.delete(`/competitors/${id}`)
    get().fetchCompetitors()
  },
}))
```

- [ ] **Step 3: Verify frontend builds**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/inbox.ts frontend/src/types/competitor.ts frontend/src/stores/inbox-store.ts frontend/src/stores/complaints-store.ts frontend/src/stores/praises-store.ts frontend/src/stores/leaderboard-store.ts frontend/src/stores/competitor-store.ts
git commit -m "feat: add frontend types and stores for management features"
```

---

## Task 6: Frontend — Inbox Page

**Files:**
- Create: `frontend/src/components/inbox/inbox-stats.tsx`
- Create: `frontend/src/components/inbox/inbox-card.tsx`
- Modify: `frontend/src/app/routes/inbox.tsx`

- [ ] **Step 1: Create InboxStats component**

```tsx
// frontend/src/components/inbox/inbox-stats.tsx
import KpiCard from "@/components/shared/kpi-card"

interface Props {
  total: number
  urgent: number
}

export default function InboxStats({ total, urgent }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard label="Needs Reply" value={total} className="bg-surface border border-border" />
      <KpiCard label="Urgent (1-2★)" value={urgent} className="bg-surface border border-border" />
      <KpiCard label="Response Rate" value={total > 0 ? `${Math.round((1 - total / 75) * 100)}%` : "100%"} className="bg-surface border border-border" />
    </div>
  )
}
```

- [ ] **Step 2: Create InboxCard component**

```tsx
// frontend/src/components/inbox/inbox-card.tsx
import { Inbox, CheckCircle } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { timeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Review } from "@/types/review"

interface Props {
  review: Review
  onResolve: (id: string) => void
}

export default function InboxCard({ review, onResolve }: Props) {
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
        {review.rating <= 2 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">
            <Inbox className="h-3 w-3" /> Urgent
          </span>
        )}
      </div>

      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-text line-clamp-2">{review.text}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {review.sentiment && (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              review.sentiment === "negative" ? "bg-danger-bg text-danger" :
              review.sentiment === "positive" ? "bg-success-bg text-success" :
              "bg-card-secondary text-text-secondary"
            }`}>
              {review.sentiment}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-success hover:text-success"
          onClick={() => onResolve(review.id)}
        >
          <CheckCircle className="mr-1 h-4 w-4" /> Resolve
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement Inbox page**

```tsx
// frontend/src/app/routes/inbox.tsx
import { useEffect } from "react"
import { useInboxStore } from "@/stores/inbox-store"
import InboxStats from "@/components/inbox/inbox-stats"
import InboxCard from "@/components/inbox/inbox-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

const TOPICS = [
  { label: "All", value: null },
  { label: "Urgent", value: "urgent" },
]

export default function InboxPage() {
  const { reviews, total, page, pages, isLoading, priority, setPriority, setPage, fetchInbox, resolveReview } = useInboxStore()

  useEffect(() => { fetchInbox() }, [])

  const urgentCount = reviews.filter((r) => r.rating <= 2).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Inbox</h1>
        <p className="mt-1 text-sm text-text-secondary">Reviews that need your attention</p>
      </div>

      <InboxStats total={total} urgent={urgentCount} />

      <div className="flex gap-2">
        {TOPICS.map((t) => (
          <Button
            key={t.label}
            variant={priority === t.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setPriority(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="All caught up!" description="No reviews need your attention right now." />
      ) : (
        <>
          <div className="grid gap-4">
            {reviews.map((r) => (
              <InboxCard key={r.id} review={r} onResolve={resolveReview} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-text-secondary">Page {page} of {pages}</span>
            <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </>
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
git add frontend/src/components/inbox/ frontend/src/app/routes/inbox.tsx
git commit -m "feat: implement Inbox page with stats, filters, and resolve action"
```

---

## Task 7: Frontend — Complaints Page

**Files:**
- Create: `frontend/src/components/complaints/complaint-stats.tsx`
- Create: `frontend/src/components/complaints/complaint-card.tsx`
- Create: `frontend/src/components/complaints/topic-breakdown.tsx`
- Modify: `frontend/src/app/routes/complaints.tsx`

- [ ] **Step 1: Create ComplaintStats**

```tsx
// frontend/src/components/complaints/complaint-stats.tsx
import KpiCard from "@/components/shared/kpi-card"

interface Props {
  total: number
  resolved: number
  avgRating: number
}

export default function ComplaintStats({ total, resolved, avgRating }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard label="Total Complaints" value={total} className="bg-surface border border-border" />
      <KpiCard label="Resolved" value={resolved} className="bg-surface border border-border" />
      <KpiCard label="Avg Rating (Complaints)" value={avgRating.toFixed(1)} className="bg-surface border border-border" />
    </div>
  )
}
```

- [ ] **Step 2: Create ComplaintCard**

```tsx
// frontend/src/components/complaints/complaint-card.tsx
import { CheckCircle, AlertTriangle } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/utils"
import type { Review } from "@/types/review"

interface Props {
  review: Review
  onResolve: (id: string) => void
}

const topicLabels: Record<string, string> = {
  food_quality: "Food Quality", service: "Service", delivery: "Delivery",
  ambience: "Ambience", pricing: "Pricing", staff: "Staff", cleanliness: "Cleanliness", wait_time: "Wait Time",
}

export default function ComplaintCard({ review, onResolve }: Props) {
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
        {review.is_resolved ? (
          <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" /> Resolved</Badge>
        ) : (
          <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Open</Badge>
        )}
      </div>

      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-text line-clamp-3">{review.text}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {review.topics?.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">{topicLabels[t] || t}</Badge>
          ))}
        </div>
        {!review.is_resolved && (
          <Button variant="ghost" size="sm" className="text-success hover:text-success" onClick={() => onResolve(review.id)}>
            <CheckCircle className="mr-1 h-4 w-4" /> Resolve
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create TopicBreakdown chart**

```tsx
// frontend/src/components/complaints/topic-breakdown.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Props {
  data: { topic: string; count: number }[]
}

const COLORS = ["#EF4444", "#F97316", "#EAB308", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"]

export default function TopicBreakdown({ data }: Props) {
  if (data.length === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold text-text">Complaints by Topic</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 12 }} />
          <YAxis type="category" dataKey="topic" tick={{ fill: "#CBD5E1", fontSize: 12 }} width={80} />
          <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Implement Complaints page**

```tsx
// frontend/src/app/routes/complaints.tsx
import { useEffect, useMemo } from "react"
import { useComplaintsStore } from "@/stores/complaints-store"
import ComplaintStats from "@/components/complaints/complaint-stats"
import ComplaintCard from "@/components/complaints/complaint-card"
import TopicBreakdown from "@/components/complaints/topic-breakdown"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

const TOPICS = [
  { label: "All", value: null },
  { label: "Food Quality", value: "food_quality" },
  { label: "Service", value: "service" },
  { label: "Delivery", value: "delivery" },
  { label: "Pricing", value: "pricing" },
  { label: "Staff", value: "staff" },
]

export default function ComplaintsPage() {
  const { reviews, total, page, pages, isLoading, topic, setTopic, setPage, fetchComplaints, resolveReview } = useComplaintsStore()

  useEffect(() => { fetchComplaints() }, [])

  const resolvedCount = reviews.filter((r) => r.is_resolved).length
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const topicData = useMemo(() => {
    const counts: Record<string, number> = {}
    reviews.forEach((r) => r.topics?.forEach((t) => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count)
  }, [reviews])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Complaints</h1>
        <p className="mt-1 text-sm text-text-secondary">Track and resolve negative feedback</p>
      </div>

      <ComplaintStats total={total} resolved={resolvedCount} avgRating={avgRating} />

      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <Button key={t.label} variant={topic === t.value ? "default" : "ghost"} size="sm" onClick={() => setTopic(t.value)}>
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No complaints found" description="No negative reviews match your filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-4">
              {reviews.map((r) => (
                <ComplaintCard key={r.id} review={r} onResolve={resolveReview} />
              ))}
            </div>
            <TopicBreakdown data={topicData} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-text-secondary">Page {page} of {pages}</span>
            <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </>
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
git add frontend/src/components/complaints/ frontend/src/app/routes/complaints.tsx
git commit -m "feat: implement Complaints page with stats, topic filters, and breakdown chart"
```

---

## Task 8: Frontend — Praises Page

**Files:**
- Create: `frontend/src/components/praises/praise-stats.tsx`
- Create: `frontend/src/components/praises/praise-card.tsx`
- Modify: `frontend/src/app/routes/praises.tsx`

- [ ] **Step 1: Create PraiseStats**

```tsx
// frontend/src/components/praises/praise-stats.tsx
import KpiCard from "@/components/shared/kpi-card"

interface Props {
  total: number
  avgRating: number
}

export default function PraiseStats({ total, avgRating }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <KpiCard label="Total Praises" value={total} className="bg-surface border border-border" />
      <KpiCard label="Avg Rating (Praises)" value={avgRating.toFixed(1)} className="bg-surface border border-border" />
    </div>
  )
}
```

- [ ] **Step 2: Create PraiseCard**

```tsx
// frontend/src/components/praises/praise-card.tsx
import { Star } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { timeAgo } from "@/lib/utils"
import type { Review } from "@/types/review"

interface Props {
  review: Review
}

export default function PraiseCard({ review }: Props) {
  return (
    <div className="rounded-2xl border border-success/20 bg-surface p-5 transition-colors hover:bg-success/5">
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
        <Star className="h-4 w-4 fill-warning text-warning" />
      </div>

      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-text line-clamp-3">{review.text}</p>
      )}

      <div className="mt-3 flex gap-1">
        {review.topics?.map((t) => (
          <span key={t} className="inline-flex rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success capitalize">
            {t.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement Praises page**

```tsx
// frontend/src/app/routes/praises.tsx
import { useEffect } from "react"
import { usePraisesStore } from "@/stores/praises-store"
import PraiseStats from "@/components/praises/praise-stats"
import PraiseCard from "@/components/praises/praise-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

const PLATFORMS = [
  { label: "All", value: null },
  { label: "Google", value: "google" },
  { label: "Zomato", value: "zomato" },
  { label: "Reelo", value: "reelo" },
]

export default function PraisesPage() {
  const { reviews, total, page, pages, isLoading, platform, setPlatform, setPage, fetchPraises } = usePraisesStore()

  useEffect(() => { fetchPraises() }, [])

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Praises</h1>
        <p className="mt-1 text-sm text-text-secondary">Celebrate your best reviews and testimonials</p>
      </div>

      <PraiseStats total={total} avgRating={avgRating} />

      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <Button key={p.label} variant={platform === p.value ? "default" : "ghost"} size="sm" onClick={() => setPlatform(p.value)}>
            {p.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No praises found" description="No positive reviews match your filters." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <PraiseCard key={r.id} review={r} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-text-secondary">Page {page} of {pages}</span>
            <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </>
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
git add frontend/src/components/praises/ frontend/src/app/routes/praises.tsx
git commit -m "feat: implement Praises page with stats, platform filters, and cards"
```

---

## Task 9: Frontend — Location Leaderboard Page

**Files:**
- Create: `frontend/src/components/leaderboard/leaderboard-table.tsx`
- Modify: `frontend/src/app/routes/location-leaderboard.tsx`

- [ ] **Step 1: Create LeaderboardTable**

```tsx
// frontend/src/components/leaderboard/leaderboard-table.tsx
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import type { LocationRanking } from "@/types/competitor"

interface Props {
  locations: LocationRanking[]
}

const rankIcons: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

export default function LeaderboardTable({ locations }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Rank</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Location</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Rating</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Reviews</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Positive %</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.location_id} className="border-b border-border/50 transition-colors hover:bg-card-secondary/30">
              <td className="px-5 py-4">
                <span className="text-lg">{rankIcons[loc.rank] || `#${loc.rank}`}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm font-medium text-text">📍 {loc.location_id.slice(0, 8)}...</span>
              </td>
              <td className="px-5 py-4 text-center">
                <RatingBadge rating={loc.avg_rating} size="sm" />
              </td>
              <td className="px-5 py-4 text-center">
                <span className="text-sm font-medium text-text">{loc.review_count}</span>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  {loc.positive_percentage >= 60 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  )}
                  <span className={`text-sm font-medium ${loc.positive_percentage >= 60 ? "text-success" : "text-danger"}`}>
                    {loc.positive_percentage}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Implement Location Leaderboard page**

```tsx
// frontend/src/app/routes/location-leaderboard.tsx
import { useEffect } from "react"
import { useLeaderboardStore } from "@/stores/leaderboard-store"
import LeaderboardTable from "@/components/leaderboard/leaderboard-table"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function LocationLeaderboardPage() {
  const { locations, isLoading, fetchLeaderboard } = useLeaderboardStore()

  useEffect(() => { fetchLeaderboard() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Location Leaderboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Compare performance across all locations</p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : locations.length === 0 ? (
        <EmptyState title="No location data" description="Reviews need location IDs to appear here." />
      ) : (
        <LeaderboardTable locations={locations} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify frontend builds**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/leaderboard/ frontend/src/app/routes/location-leaderboard.tsx
git commit -m "feat: implement Location Leaderboard page with rankings table"
```

---

## Task 10: Frontend — Competitors Page

**Files:**
- Create: `frontend/src/components/competitors/competitor-card.tsx`
- Create: `frontend/src/components/competitors/competitor-form.tsx`
- Modify: `frontend/src/app/routes/competitors.tsx`

- [ ] **Step 1: Create CompetitorCard**

```tsx
// frontend/src/components/competitors/competitor-card.tsx
import { Trash2, ExternalLink } from "lucide-react"
import RatingBadge from "@/components/shared/rating-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Competitor } from "@/types/competitor"

interface Props {
  competitor: Competitor
  onDelete: (id: string) => void
}

const platformColors: Record<string, string> = {
  google: "bg-blue-500", zomato: "bg-red-500", reelo: "bg-purple-500",
}

export default function CompetitorCard({ competitor, onDelete }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:bg-card-secondary/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-secondary text-sm font-bold text-text">
            {competitor.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{competitor.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{competitor.platform}</Badge>
              {competitor.url && (
                <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(competitor.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {competitor.avg_rating !== null && <RatingBadge rating={competitor.avg_rating} />}
        <div>
          <p className="text-xs text-text-secondary">Reviews</p>
          <p className="text-sm font-semibold text-text">{competitor.review_count}</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create CompetitorForm**

```tsx
// frontend/src/components/competitors/competitor-form.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { name: string; platform: string; avg_rating?: number; review_count?: number }) => void
}

export default function CompetitorForm({ onSubmit }: Props) {
  const [name, setName] = useState("")
  const [platform, setPlatform] = useState("google")
  const [rating, setRating] = useState("")
  const [count, setCount] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      platform,
      avg_rating: rating ? parseFloat(rating) : undefined,
      review_count: count ? parseInt(count) : undefined,
    })
    setName("")
    setRating("")
    setCount("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Add Competitor</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input placeholder="Competitor name" value={name} onChange={(e) => setName(e.target.value)} />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text"
        >
          <option value="google">Google</option>
          <option value="zomato">Zomato</option>
          <option value="reelo">Reelo</option>
        </select>
        <Input type="number" step="0.1" min="0" max="5" placeholder="Avg rating" value={rating} onChange={(e) => setRating(e.target.value)} />
        <Input type="number" min="0" placeholder="Review count" value={count} onChange={(e) => setCount(e.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={!name.trim()}>Add Competitor</Button>
    </form>
  )
}
```

- [ ] **Step 3: Implement Competitors page**

```tsx
// frontend/src/app/routes/competitors.tsx
import { useEffect } from "react"
import { useCompetitorStore } from "@/stores/competitor-store"
import CompetitorCard from "@/components/competitors/competitor-card"
import CompetitorForm from "@/components/competitors/competitor-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function CompetitorsPage() {
  const { competitors, isLoading, fetchCompetitors, createCompetitor, deleteCompetitor } = useCompetitorStore()

  useEffect(() => { fetchCompetitors() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Competitors</h1>
        <p className="mt-1 text-sm text-text-secondary">Track and compare competitor performance</p>
      </div>

      <CompetitorForm onSubmit={createCompetitor} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : competitors.length === 0 ? (
        <EmptyState title="No competitors tracked" description="Add your first competitor above to start comparing." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitors.map((c) => (
            <CompetitorCard key={c.id} competitor={c} onDelete={deleteCompetitor} />
          ))}
        </div>
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
git add frontend/src/components/competitors/ frontend/src/app/routes/competitors.tsx
git commit -m "feat: implement Competitors page with cards, add form, and delete"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run all backend tests**

Run: `cd D:\Revly\backend ; python -m pytest tests/ -v`
Expected: All tests PASS (existing 10 + new tests)

- [ ] **Step 2: Run frontend build**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 3: Verify all imports**

Run: `cd D:\Revly\backend ; python -c "from app.api.v1.inbox import router; from app.api.v1.complaints import router; from app.api.v1.praises import router; from app.api.v1.leaderboard import router; from app.api.v1.competitors import router; from app.models.competitor import Competitor; print('All imports OK')"`
Expected: `All imports OK`

- [ ] **Step 4: Verify git log**

Run: `git log --oneline -15`
Expected: ~11 new commits for Phase 5

- [ ] **Step 5: Commit (if any uncommitted changes)**

```bash
git status
git add -A
git commit -m "chore: Phase 5 Management features complete"
```
