import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.constants import MOCK_BRAND_ID
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.automation_rule import AutomationRule
from app.models.user import User


@pytest.fixture()
def auth_headers(db_session):
    db_session.query(User).delete()
    db_session.commit()
    uid = uuid.uuid4()
    user = User(id=uid, email="auto@test.com", full_name="T",
                password_hash=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.commit()
    t = create_access_token({"sub": str(uid), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(autouse=True)
def _seed_rules(db_session, auth_headers):
    from app.seeds.automation_rules import RULES
    for name, trigger, action, template in RULES:
        db_session.add(AutomationRule(brand_id=MOCK_BRAND_ID, name=name, trigger=trigger, action=action, template=template))
    db_session.commit()


def test_list_rules(client, auth_headers):
    resp = client.get("/api/v1/automation", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 4


def test_create_rule(client, auth_headers):
    resp = client.post("/api/v1/automation", json={
        "name": "Test rule",
        "trigger": "sentiment_positive",
        "action": "auto_reply",
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test rule"
    assert resp.json()["is_active"] is True


def test_update_rule(client, auth_headers):
    list_resp = client.get("/api/v1/automation", headers=auth_headers)
    rule_id = list_resp.json()["rules"][0]["id"]
    resp = client.patch(f"/api/v1/automation/{rule_id}", json={
        "is_active": False,
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_delete_rule(client, auth_headers):
    list_resp = client.get("/api/v1/automation", headers=auth_headers)
    rule_id = list_resp.json()["rules"][0]["id"]
    resp = client.delete(f"/api/v1/automation/{rule_id}", headers=auth_headers)
    assert resp.status_code == 200
    list_resp2 = client.get("/api/v1/automation", headers=auth_headers)
    assert list_resp2.json()["total"] == 3
