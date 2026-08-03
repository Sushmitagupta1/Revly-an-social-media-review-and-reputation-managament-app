import base64
import json
import uuid
from datetime import datetime, timedelta, timezone

from app.core.constants import MOCK_BRAND_ID
from app.models.integration import Integration
from app.services.zomato_sync import _parse_display_date


def _fake_jwt(rrm: dict) -> str:
    payload = base64.urlsafe_b64encode(
        json.dumps({"rrm": rrm, "uId": 1}).encode()
    ).rstrip(b"=").decode()
    return f"eyJhbGciOiJSUzI1NiJ9.{payload}.signature"


def test_parse_display_date_relative():
    now = datetime.now(timezone.utc)
    cases = {
        "2 days ago": now - timedelta(days=2),
        "7 days ago": now - timedelta(days=7),
        "1 day ago": now - timedelta(days=1),
        "3 weeks ago": now - timedelta(weeks=3),
        "2 hours ago": now - timedelta(hours=2),
    }
    for raw, expected in cases.items():
        parsed = _parse_display_date(raw)
        expected_midnight = expected.replace(hour=0, minute=0, second=0, microsecond=0)
        assert parsed is not None, f"{raw!r} should parse"
        assert abs((parsed - expected_midnight).total_seconds()) < 2, f"{raw!r} -> {parsed}"


def test_parse_display_date_absolute():
    assert _parse_display_date("12 Jul 2026") == datetime(2026, 7, 12, tzinfo=timezone.utc)
    assert _parse_display_date("09 July 2026") == datetime(2026, 7, 9, tzinfo=timezone.utc)
    assert _parse_display_date("yesterday") is not None
    assert _parse_display_date("today") is not None
    assert _parse_display_date("garbage") is None
    assert _parse_display_date("") is None
    assert _parse_display_date(None) is None


def test_restaurant_ids_from_jwt():
    from app.api.v1.zomato import _restaurant_ids_from_jwt
    token = _fake_jwt({"110076": [2], "20590610": [2], "21137764": [2]})
    assert sorted(_restaurant_ids_from_jwt(token)) == ["110076", "20590610", "21137764"]
    assert _restaurant_ids_from_jwt("not-a-jwt") == []
    assert _restaurant_ids_from_jwt("") == []


def test_update_restaurants_endpoint(client, db_session):
    integration = Integration(
        id=uuid.uuid4(),
        brand_id=MOCK_BRAND_ID,
        platform="zomato",
        account_name="Zomato Partner",
        status="active",
        is_connected=True,
        restaurant_ids=json.dumps(["20590610"]),
    )
    db_session.add(integration)
    db_session.commit()

    resp = client.post("/api/v1/zomato/restaurants", json={"restaurant_ids": ["110076", "20590610", "21137764"]})
    assert resp.status_code == 200
    assert resp.json()["restaurant_ids"] == ["110076", "20590610", "21137764"]

    db_session.refresh(integration)
    assert json.loads(integration.restaurant_ids) == ["110076", "20590610", "21137764"]

    resp = client.post("/api/v1/zomato/restaurants", json={"restaurant_ids": []})
    assert resp.status_code == 400
