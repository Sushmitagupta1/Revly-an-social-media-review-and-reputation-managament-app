import uuid
import pytest
from app.models.review import Review
from app.models.user import User
from app.core.security import hash_password

BRAND_ID = uuid.uuid4()
LOCS = [uuid.uuid4(), uuid.uuid4()]


def _seed(db):
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


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_leaderboard(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/leaderboard", headers=_auth(user))
    assert resp.status_code == 200
    data = resp.json()
    assert "locations" in data
    assert len(data["locations"]) == 2

    # Check all fields present
    for loc in data["locations"]:
        assert "location_id" in loc
        assert "avg_rating" in loc
        assert "review_count" in loc
        assert "sentiment_breakdown" in loc
        assert "positive_percentage" in loc
        assert "rank" in loc

    # Check sort order: first location should have higher avg_rating
    assert data["locations"][0]["avg_rating"] >= data["locations"][1]["avg_rating"]
    assert data["locations"][0]["rank"] == 1
    assert data["locations"][1]["rank"] == 2

    # Check review counts (3 reviews per location from seed)
    for loc in data["locations"]:
        assert loc["review_count"] == 3


def test_leaderboard_time_and_location_filters(client, db_session):
    user = _seed(db_session)
    from app.models.location import Location
    from datetime import datetime

    loc_a = Location(id=uuid.uuid4(), brand_id=BRAND_ID, name="Upper Crust Bakery Bopal")
    loc_b = Location(id=uuid.uuid4(), brand_id=BRAND_ID, name="Upper Crust Bakery Satellite")
    db_session.add_all([loc_a, loc_b])
    db_session.commit()

    for i in range(3):
        db_session.add(Review(
            brand_id=BRAND_ID, location_id=loc_a.id, platform="google",
            reviewer_name=f"A{i}", rating=5, text=f"A{i}",
            sentiment="positive",
            created_at=datetime(2026, 8, 1, 10, 0, 0),
        ))
    for i in range(3):
        db_session.add(Review(
            brand_id=BRAND_ID, location_id=loc_b.id, platform="google",
            reviewer_name=f"B{i}", rating=2, text=f"B{i}",
            sentiment="negative",
            created_at=datetime(2026, 8, 10, 10, 0, 0),
        ))
    db_session.commit()

    # Time filter: only the first batch (Aug 1) falls in this window
    resp = client.get(
        "/api/v1/leaderboard",
        params={"date_from": "2026-08-01", "date_to": "2026-08-05"},
        headers=_auth(user),
    )
    assert resp.status_code == 200
    rows = resp.json()["locations"]
    assert len(rows) == 1
    assert rows[0]["location_name"] == "Upper Crust Bakery Bopal"
    assert rows[0]["review_count"] == 3

    # Location filter: only Satellite by name
    resp = client.get(
        "/api/v1/leaderboard",
        params={"locations": "Upper Crust Bakery Satellite"},
        headers=_auth(user),
    )
    assert resp.status_code == 200
    rows = resp.json()["locations"]
    assert len(rows) == 1
    assert rows[0]["location_name"] == "Upper Crust Bakery Satellite"

    # Empty window -> no locations
    resp = client.get(
        "/api/v1/leaderboard",
        params={"date_from": "2027-01-01", "date_to": "2027-01-02"},
        headers=_auth(user),
    )
    assert resp.status_code == 200
    assert resp.json()["locations"] == []
