import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base
from app.models.location import Location
from app.models.user import User
from app.core.security import hash_password


@pytest.fixture()
def auth_headers(db_session):
    db_session.query(Location).delete()
    db_session.query(User).delete()
    db_session.commit()
    uid = uuid.uuid4()
    user = User(id=uid, email="loc@test.com", full_name="L",
                password_hash=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.commit()
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(uid), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_create_location(client, auth_headers):
    resp = client.post("/api/v1/locations", headers=auth_headers, json={
        "name": "SG Highway", "address": "123 Main St", "city": "Ahmedabad",
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "SG Highway"


def test_list_locations(client, auth_headers):
    client.post("/api/v1/locations", headers=auth_headers, json={
        "name": "Loc1", "address": "Addr1", "city": "City1",
    })
    resp = client.get("/api/v1/locations", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_delete_location(client, auth_headers):
    create = client.post("/api/v1/locations", headers=auth_headers, json={
        "name": "Del", "address": "Addr", "city": "City",
    })
    lid = create.json()["id"]
    resp = client.delete(f"/api/v1/locations/{lid}", headers=auth_headers)
    assert resp.status_code == 200
