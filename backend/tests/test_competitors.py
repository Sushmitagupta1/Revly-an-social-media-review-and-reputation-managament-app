import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base
from app.models.competitor import Competitor
from app.models.user import User
from app.core.security import hash_password


@pytest.fixture()
def auth_headers(db_session):
    db_session.query(Competitor).delete()
    db_session.query(User).delete()
    db_session.commit()
    uid = uuid.uuid4()
    user = User(id=uid, email="t4@test.com", full_name="T",
                password_hash=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.commit()
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(uid), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_create_competitor(client, auth_headers):
    resp = client.post("/api/v1/competitors", headers=auth_headers, json={
        "name": "Food Bazaar", "platform": "google", "avg_rating": 4.2, "review_count": 150
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "Food Bazaar"


def test_list_competitors(client, auth_headers):
    client.post("/api/v1/competitors", headers=auth_headers, json={
        "name": "C1", "platform": "google", "avg_rating": 4.0, "review_count": 100
    })
    resp = client.get("/api/v1/competitors", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_delete_competitor(client, auth_headers):
    create = client.post("/api/v1/competitors", headers=auth_headers, json={
        "name": "Del", "platform": "google", "avg_rating": 3.5, "review_count": 50
    })
    cid = create.json()["id"]
    resp = client.delete(f"/api/v1/competitors/{cid}", headers=auth_headers)
    assert resp.status_code == 200
