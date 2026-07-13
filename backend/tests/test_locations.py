import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.location import Location
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)


def _setup():
    db = SessionLocal()
    try:
        db.query(Location).delete()
        db.query(User).delete()
        db.commit()
        user = User(id=uuid.uuid4(), email="loc@test.com", full_name="L",
                     password_hash=hash_password("pass"), is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user
    finally:
        db.close()


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_create_location():
    user = _setup()
    resp = client.post("/api/v1/locations", headers=_auth(user), json={
        "name": "SG Highway", "address": "123 Main St", "city": "Ahmedabad",
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "SG Highway"


def test_list_locations():
    user = _setup()
    client.post("/api/v1/locations", headers=_auth(user), json={
        "name": "Loc1", "address": "Addr1", "city": "City1",
    })
    resp = client.get("/api/v1/locations", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_delete_location():
    user = _setup()
    create = client.post("/api/v1/locations", headers=_auth(user), json={
        "name": "Del", "address": "Addr", "city": "City",
    })
    lid = create.json()["id"]
    resp = client.delete(f"/api/v1/locations/{lid}", headers=_auth(user))
    assert resp.status_code == 200
