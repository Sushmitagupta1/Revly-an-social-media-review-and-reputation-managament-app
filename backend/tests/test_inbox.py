import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base
from app.models.review import Review
from app.models.reply import Reply
from app.models.user import User
from app.core.security import hash_password

BRAND_ID = uuid.uuid4()
LOCATIONS = [uuid.uuid4() for _ in range(3)]


def _seed_reviews(db):
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


def _auth_header(user):
    from app.core.security import create_access_token
    token = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {token}"}


def test_resolve_review(client, db_session):
    user = _seed_reviews(db_session)
    headers = _auth_header(user)
    review_id = str(db_session.query(Review).first().id)

    resp = client.patch(f"/api/v1/reviews/{review_id}/resolve", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["is_resolved"] is True


def test_inbox_returns_unreplied_reviews(client, db_session):
    user = _seed_reviews(db_session)
    headers = _auth_header(user)

    resp = client.get("/api/v1/inbox", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "reviews" in data
    assert "total" in data
    assert data["total"] >= 1


def test_inbox_filters_urgent(client, db_session):
    user = _seed_reviews(db_session)
    headers = _auth_header(user)

    resp = client.get("/api/v1/inbox?priority=urgent", headers=headers)
    assert resp.status_code == 200
    for review in resp.json()["reviews"]:
        assert review["rating"] <= 2
