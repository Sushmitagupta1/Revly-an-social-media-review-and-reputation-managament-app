import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.notification import Notification
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)


def _setup():
    app.dependency_overrides = {}
    db = SessionLocal()
    try:
        db.query(Notification).delete()
        db.query(User).delete()
        db.commit()
        user_id = uuid.uuid4()
        user = User(id=user_id, email="notif@test.com", full_name="N",
                     password_hash=hash_password("pass"), is_active=True)
        db.add(user)
        db.commit()
        return user_id
    finally:
        db.close()


def _auth(user_id):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user_id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_list_notifications():
    user_id = _setup()
    resp = client.get("/api/v1/notifications", headers=_auth(user_id))
    assert resp.status_code == 200
    assert "notifications" in resp.json()


def test_create_notification():
    user_id = _setup()
    resp = client.post("/api/v1/notifications", headers=_auth(user_id), json={
        "user_id": str(user_id),
        "title": "New review",
        "message": "You got a 5-star review!",
        "type": "review",
    })
    assert resp.status_code == 200
    assert resp.json()["title"] == "New review"


def test_mark_read():
    user_id = _setup()
    create = client.post("/api/v1/notifications", headers=_auth(user_id), json={
        "user_id": str(user_id),
        "title": "Test",
        "message": "Test message",
        "type": "review",
    })
    nid = create.json()["id"]
    resp = client.patch(f"/api/v1/notifications/{nid}/read", headers=_auth(user_id))
    assert resp.status_code == 200
    assert resp.json()["is_read"] is True
