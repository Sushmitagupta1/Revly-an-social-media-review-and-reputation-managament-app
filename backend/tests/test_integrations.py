import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.integration import Integration
from app.models.user import User
from app.core.constants import MOCK_BRAND_ID
from app.core.security import hash_password, create_access_token


@pytest.fixture()
def auth_headers(db_session):
    db_session.query(User).delete()
    db_session.commit()
    uid = uuid.uuid4()
    user = User(id=uid, email="t@test.com", full_name="T",
                password_hash=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.commit()
    t = create_access_token({"sub": str(uid), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(autouse=True)
def _seed_integrations(db_session):
    from app.seeds.integrations import INTEGRATIONS
    for platform, account_name, status, is_connected in INTEGRATIONS:
        db_session.add(Integration(brand_id=MOCK_BRAND_ID, platform=platform, account_name=account_name, status=status, is_connected=is_connected))
    db_session.commit()


def test_list_integrations(client, auth_headers):
    resp = client.get("/api/v1/integrations", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 4


def test_create_integration(client, auth_headers):
    resp = client.post("/api/v1/integrations", json={"platform": "reelo", "account_name": "Upper Crust - Reelo", "is_connected": False}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["platform"] == "reelo"
    assert resp.json()["status"] == "active"


def test_update_integration(client, auth_headers):
    list_resp = client.get("/api/v1/integrations", headers=auth_headers)
    iid = list_resp.json()["integrations"][0]["id"]
    resp = client.patch(f"/api/v1/integrations/{iid}", json={"status": "inactive"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "inactive"


def test_delete_integration(client, auth_headers):
    list_resp = client.get("/api/v1/integrations", headers=auth_headers)
    iid = list_resp.json()["integrations"][0]["id"]
    resp = client.delete(f"/api/v1/integrations/{iid}", headers=auth_headers)
    assert resp.status_code == 200
    assert client.get("/api/v1/integrations", headers=auth_headers).json()["total"] == 3
