import uuid
from datetime import datetime, timedelta, timezone

from app.models.review import Review
from app.models.location import Location
from app.core.constants import MOCK_BRAND_ID

BRAND_ID = uuid.uuid4()


def _seed(db):
    db.query(Review).delete()
    db.query(Location).delete()
    db.commit()

    loc1 = Location(id=uuid.uuid4(), brand_id=MOCK_BRAND_ID, name="Alpha", address="A1", city="City")
    loc2 = Location(id=uuid.uuid4(), brand_id=MOCK_BRAND_ID, name="Beta", address="B1", city="City")
    db.add(loc1)
    db.add(loc2)
    db.commit()

    now = datetime.now(timezone.utc)
    reviews = [
        Review(
            brand_id=BRAND_ID, platform="google", reviewer_name="R1", rating=5,
            text="good", sentiment="positive", topics=["service"], is_resolved=True,
            location_id=loc1.id, created_at=now - timedelta(days=1),
        ),
        Review(
            brand_id=BRAND_ID, platform="google", reviewer_name="R2", rating=1,
            text="bad", sentiment="negative", topics=["food_quality"], is_resolved=False,
            location_id=loc1.id, created_at=now - timedelta(days=2),
        ),
        Review(
            brand_id=BRAND_ID, platform="zomato", reviewer_name="R3", rating=4,
            text="ok", sentiment="neutral", topics=None, is_resolved=False,
            location_id=loc2.id, created_at=now - timedelta(days=40),
        ),
    ]
    db.add_all(reviews)
    db.commit()
    return loc1, loc2


def test_dashboard_kpis(client, db_session):
    _seed(db_session)
    resp = client.get("/api/v1/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["kpis"]["total_reviews"] == 3
    assert data["kpis"]["average_rating"] == round((5 + 1 + 4) / 3, 1)
    assert data["kpis"]["response_rate"] == round(1 / 3 * 100, 1)
    assert data["complaints_count"] == 1
    assert data["praises_count"] == 1


def test_dashboard_date_filter(client, db_session):
    _seed(db_session)
    now = datetime.now(timezone.utc)
    date_from = (now - timedelta(days=5)).strftime("%Y-%m-%d")
    date_to = now.strftime("%Y-%m-%d")
    resp = client.get(f"/api/v1/dashboard?date_from={date_from}&date_to={date_to}")
    assert resp.status_code == 200
    data = resp.json()
    # R1 (1d ago) + R2 (2d ago) in range; R3 (40d ago) excluded
    assert data["kpis"]["total_reviews"] == 2


def test_dashboard_location_filter(client, db_session):
    _seed(db_session)
    resp = client.get("/api/v1/dashboard?locations=Alpha")
    assert resp.status_code == 200
    data = resp.json()
    assert data["kpis"]["total_reviews"] == 2
    assert data["top_locations"][0]["location_name"] == "Alpha"


def test_dashboard_trend_respects_range(client, db_session):
    _seed(db_session)
    now = datetime.now(timezone.utc)
    date_from = (now - timedelta(days=5)).strftime("%Y-%m-%d")
    date_to = now.strftime("%Y-%m-%d")
    resp = client.get(f"/api/v1/dashboard?date_from={date_from}&date_to={date_to}")
    assert resp.status_code == 200
    data = resp.json()
    # ~6 daily buckets (5 days ago through today)
    assert 5 <= len(data["sentiment_trend"]) <= 7
    # R3 (40 days ago) must NOT appear in the filtered trend
    total_in_trend = sum(p["count"] for p in data["sentiment_trend"])
    assert total_in_trend == 2


def test_dashboard_trend_unknown_location_ignores_filter(client, db_session):
    _seed(db_session)
    resp = client.get("/api/v1/dashboard?locations=DoesNotExist")
    assert resp.status_code == 200
    data = resp.json()
    # Unknown location name → no location filter applied (matches existing behavior)
    assert data["kpis"]["total_reviews"] == 3
