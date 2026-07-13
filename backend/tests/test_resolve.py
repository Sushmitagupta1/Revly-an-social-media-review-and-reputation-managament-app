import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.constants import MOCK_BRAND_ID
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.resolve_policy import ResolvePolicy
from app.models.user import User


@pytest.fixture()
def auth_headers(db_session):
    db_session.query(User).delete()
    db_session.commit()
    uid = uuid.uuid4()
    user = User(
        id=uid,
        email="resolve@test.com",
        full_name="T",
        password_hash=hash_password("pass"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    t = create_access_token({"sub": str(uid), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(autouse=True)
def _seed_policies(db_session):
    from app.seeds.resolve_policies import POLICIES

    for name, auto_resolve, sla, escalate in POLICIES:
        db_session.add(
            ResolvePolicy(
                brand_id=MOCK_BRAND_ID,
                name=name,
                auto_resolve_after_reply=auto_resolve,
                sla_hours=sla,
                escalate_after_hours=escalate,
            )
        )
    db_session.commit()


def test_list_policies(client, auth_headers):
    resp = client.get("/api/v1/resolve", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 3


def test_create_policy(client, auth_headers):
    resp = client.post(
        "/api/v1/resolve",
        json={"name": "Test Policy", "sla_hours": 24},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Policy"
    assert resp.json()["sla_hours"] == 24


def test_update_policy(client, auth_headers):
    list_resp = client.get("/api/v1/resolve", headers=auth_headers)
    pid = list_resp.json()["policies"][0]["id"]
    resp = client.patch(
        f"/api/v1/resolve/{pid}",
        json={"is_active": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_delete_policy(client, auth_headers):
    list_resp = client.get("/api/v1/resolve", headers=auth_headers)
    pid = list_resp.json()["policies"][0]["id"]
    resp = client.delete(f"/api/v1/resolve/{pid}", headers=auth_headers)
    assert resp.status_code == 200
    assert client.get("/api/v1/resolve", headers=auth_headers).json()["total"] == 2
