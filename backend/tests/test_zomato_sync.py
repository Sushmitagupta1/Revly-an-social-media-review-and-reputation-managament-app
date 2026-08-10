import base64
import json
import uuid
from datetime import datetime, timedelta, timezone

from app.core.constants import MOCK_BRAND_ID
from app.models.integration import Integration
from app.services.zomato_sync import _parse_display_date, _parse_order_details


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


def test_match_location_id():
    from app.services.zomato_sync import _match_location_id
    locations = [
        ("loc-1", "Upper Crust (Vastrapur)"),
        ("loc-2", "Upper Crust Bakery (Prahlad Nagar)"),
        ("loc-3", "Lithosphere By Upper Crust (Bodakdev)"),
    ]
    assert _match_location_id(
        {"restaurant": {"name": "Upper Crust", "subzone": "Vastrapur"}}, locations
    ) == "loc-1"
    # name fallback without subzone
    assert _match_location_id(
        {"restaurant": {"name": "Upper Crust (Vastrapur)"}}, locations
    ) == "loc-1"
    # city fallback
    assert _match_location_id(
        {"restaurant": {"name": "Upper Crust", "city": "Vastrapur"}}, locations
    ) == "loc-1"
    # unmatched
    assert _match_location_id(
        {"restaurant": {"name": "Some Other Restaurant", "subzone": "X"}}, locations
    ) is None
    # no restaurant info
    assert _match_location_id(None, locations) is None
    assert _match_location_id({}, locations) is None


def test_parse_order_details():
    data = {
        "status": 200,
        "order": {
            "id": "8430300139",
            "resId": "110076",
            "state": "DELIVERED",
            "deliveryMode": "DELIVERY",
            "paymentMethod": "PAID",
            "createdAt": "2026-08-03T08:15:57Z",
            "creator": {"name": "Arup", "orderCount": 1},
            "cartDetails": {
                "items": {
                    "dishes": [
                        {"name": "Chicken Pot Pourri (275 gms)", "quantity": 1, "unitCost": 495, "totalCost": 495},
                        {"name": "Baked Macaroni with Chicken [275 g]", "quantity": 1, "unitCost": 490, "totalCost": 490},
                    ]
                },
                "total": {"amountDetails": {"totalCost": 985}},
            },
        },
    }
    parsed = _parse_order_details(data)
    assert parsed["order_id"] == "8430300139"
    assert parsed["ordered_at"] == "2026-08-03T08:15:57Z"
    assert parsed["state"] == "DELIVERED"
    assert parsed["delivery_mode"] == "DELIVERY"
    assert parsed["payment_method"] == "PAID"
    assert parsed["customer_name"] == "Arup"
    assert parsed["total"] == 985
    assert len(parsed["dishes"]) == 2
    assert parsed["dishes"][0]["name"] == "Chicken Pot Pourri (275 gms)"
    assert parsed["dishes"][0]["quantity"] == 1


def test_parse_order_details_missing_blocks():
    parsed = _parse_order_details({})
    assert parsed["order_id"] == ""
    assert parsed["ordered_at"] is None
    assert parsed["total"] is None
    assert parsed["dishes"] == []


def test_parse_review_includes_order():
    from app.api.v1.zomato import _parse_review
    review = {
        "review_id": 492835756,
        "customer_details": {"name": "Arup", "image": {"url": "https://example.com/a.jpg"}, "orders_count": 1},
        "review_info": {"rating": 5, "display_date": "yesterday"},
        "dish_feedbacks": [
            {"title": "Chicken Pot Pourri (275 gms)", "rating": "5"},
            {"title": "Baked Macaroni with Chicken [275 g]", "rating": "5"},
        ],
        "order_id": 8430300139,
    }
    parsed = _parse_review(review, "110076")
    assert parsed["order_id"] == "8430300139"
    assert parsed["order_details"] is not None
    assert parsed["order_details"]["order_id"] == "8430300139"
    assert len(parsed["order_details"]["dishes"]) == 2
    assert parsed["order_details"]["dishes"][0]["title"] == "Chicken Pot Pourri (275 gms)"


def test_parse_review_without_order():
    from app.api.v1.zomato import _parse_review
    review = {
        "review_id": 1,
        "customer_details": {"name": "X"},
        "review_info": {"rating": 4},
    }
    parsed = _parse_review(review, "110076")
    assert parsed["order_id"] is None
    assert parsed["order_details"] is None


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
