import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.constants import MOCK_BRAND_ID
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.auto_response import AutoResponse
from app.models.user import User


@pytest.fixture()
def auth_headers(db_session):
    db_session.query(User).delete()
    db_session.commit()
    uid = uuid.uuid4()
    user = User(
        id=uid,
        email="auto@test.com",
        full_name="T",
        password_hash=hash_password("pass"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    t = create_access_token({"sub": str(uid), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(autouse=True)
def _seed_responses(db_session):
    from app.seeds.auto_responses import AUTO_RESPONSES

    for sentiment, topic, template in AUTO_RESPONSES:
        db_session.add(
            AutoResponse(
                brand_id=MOCK_BRAND_ID,
                sentiment=sentiment,
                topic=topic,
                template=template,
            )
        )
    db_session.commit()


def test_list_auto_responses(client, auth_headers):
    resp = client.get("/api/v1/auto-responses", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 7


def test_create_auto_response(client, auth_headers):
    resp = client.post(
        "/api/v1/auto-responses",
        json={"sentiment": "positive", "topic": "delivery", "template": "Thanks!"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["topic"] == "delivery"


def test_update_auto_response(client, auth_headers):
    list_resp = client.get("/api/v1/auto-responses", headers=auth_headers)
    rid = list_resp.json()["responses"][0]["id"]
    resp = client.patch(
        f"/api/v1/auto-responses/{rid}",
        json={"is_active": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_delete_auto_response(client, auth_headers):
    list_resp = client.get("/api/v1/auto-responses", headers=auth_headers)
    rid = list_resp.json()["responses"][0]["id"]
    resp = client.delete(f"/api/v1/auto-responses/{rid}", headers=auth_headers)
    assert resp.status_code == 200
    assert (
        client.get("/api/v1/auto-responses", headers=auth_headers).json()["total"] == 6
    )
