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
