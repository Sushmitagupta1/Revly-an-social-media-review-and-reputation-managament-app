import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base
from app.models.review import Review
from app.models.user import User
from app.core.security import hash_password

BRAND_ID = uuid.uuid4()


def _seed(db):
    db.query(Review).delete()
    db.query(User).delete()
    db.commit()
    user = User(id=uuid.uuid4(), email="test2@test.com", full_name="Test",
                 password_hash=hash_password("pass123"), is_active=True)
    db.add(user)
    db.commit()
    for i in range(4):
        db.add(Review(
            brand_id=BRAND_ID, platform="google", reviewer_name=f"R{i}",
            rating=1 if i < 2 else 5, text=f"Review {i}",
            sentiment="negative" if i < 2 else "positive",
            topics=["food_quality", "service"], is_resolved=False,
        ))
    db.commit()
    return user


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_complaints_list(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/complaints", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    for r in resp.json()["reviews"]:
        assert r["sentiment"] == "negative"


def test_complaints_filter_topic(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/complaints?topic=service", headers=_auth(user))
    assert resp.status_code == 200


def test_praises_list(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/praises", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    for r in resp.json()["reviews"]:
        assert r["sentiment"] == "positive"


def test_praises_filter_platform(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/praises?platform=google", headers=_auth(user))
    assert resp.status_code == 200
