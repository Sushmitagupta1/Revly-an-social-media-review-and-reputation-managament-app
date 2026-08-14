import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base
from app.models.review import Review
from app.models.user import User
from app.core.security import hash_password

BRAND_ID = uuid.uuid4()


def _seed(db):
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


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_complaints_list(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/complaints", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    for r in resp.json()["reviews"]:
        assert r["sentiment"] == "negative"


def test_complaints_filter_topic(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/complaints?topic=service", headers=_auth(user))
    assert resp.status_code == 200


def test_praises_list(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/praises", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    for r in resp.json()["reviews"]:
        assert r["sentiment"] == "positive"


def test_praises_filter_platform(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/praises?platform=google", headers=_auth(user))
    assert resp.status_code == 200


def _seed_with_locations(db):
    from app.models.location import Location
    db.query(Review).delete()
    db.query(Location).delete()
    db.commit()
    loc_a = Location(id=uuid.uuid4(), brand_id=BRAND_ID, name="Outlet A", address="A1", city="City")
    loc_b = Location(id=uuid.uuid4(), brand_id=BRAND_ID, name="Outlet B", address="B1", city="City")
    db.add_all([loc_a, loc_b])
    db.commit()
    db.add_all([
        Review(brand_id=BRAND_ID, platform="google", reviewer_name="A1", rating=1,
               text="bad", sentiment="negative", topics=["service"],
               is_resolved=False, location_id=loc_a.id),
        Review(brand_id=BRAND_ID, platform="google", reviewer_name="A2", rating=1,
               text="bad", sentiment="negative", topics=["service"],
               is_resolved=False, location_id=loc_a.id),
        Review(brand_id=BRAND_ID, platform="google", reviewer_name="B1", rating=5,
               text="good", sentiment="positive", topics=["service"],
               is_resolved=False, location_id=loc_b.id),
    ])
    db.commit()
    return loc_a, loc_b


def test_complaints_location_counts(client, db_session):
    user = _seed(db_session)
    db_session.query(Review).delete()
    db_session.commit()
    loc_a, _ = _seed_with_locations(db_session)
    resp = client.get("/api/v1/complaints", headers=_auth(user))
    assert resp.status_code == 200
    loc_counts = {t["topic"]: t["count"] for t in resp.json()["location_counts"]}
    assert loc_counts.get("Outlet A") == 2
    assert "Outlet B" not in loc_counts


def test_praises_location_counts(client, db_session):
    user = _seed(db_session)
    db_session.query(Review).delete()
    db_session.commit()
    _, loc_b = _seed_with_locations(db_session)
    resp = client.get("/api/v1/praises", headers=_auth(user))
    assert resp.status_code == 200
    loc_counts = {t["topic"]: t["count"] for t in resp.json()["location_counts"]}
    assert loc_counts.get("Outlet B") == 1
    assert "Outlet A" not in loc_counts


def _seed_dates(db):
    from datetime import datetime, timezone
    db.query(Review).delete()
    db.commit()
    db.add_all([
        Review(brand_id=BRAND_ID, platform="google", reviewer_name="D1", rating=1,
               text="old bad", sentiment="negative", topics=["service"],
               is_resolved=False,
               created_at=datetime(2024, 1, 10, tzinfo=timezone.utc)),
        Review(brand_id=BRAND_ID, platform="google", reviewer_name="D2", rating=1,
               text="new bad", sentiment="negative", topics=["service"],
               is_resolved=False,
               created_at=datetime(2024, 3, 20, tzinfo=timezone.utc)),
        Review(brand_id=BRAND_ID, platform="google", reviewer_name="D3", rating=5,
               text="new good", sentiment="positive", topics=["food_quality"],
               is_resolved=False,
               created_at=datetime(2024, 3, 21, tzinfo=timezone.utc)),
    ])
    db.commit()


def test_complaints_date_filter(client, db_session):
    user = _seed(db_session)
    _seed_dates(db_session)
    resp = client.get("/api/v1/complaints?date_from=2024-03-01&date_to=2024-03-31", headers=_auth(user))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["reviews"][0]["reviewer_name"] == "D2"
    assert body["location_counts"] == []


def test_praises_date_filter(client, db_session):
    user = _seed(db_session)
    _seed_dates(db_session)
    resp = client.get("/api/v1/praises?date_from=2024-03-01&date_to=2024-03-31", headers=_auth(user))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["reviews"][0]["reviewer_name"] == "D3"
