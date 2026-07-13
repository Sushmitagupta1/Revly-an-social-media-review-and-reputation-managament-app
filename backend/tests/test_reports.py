import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.review import Review
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)
BRAND_ID = uuid.uuid4()


def _seed():
    db = SessionLocal()
    try:
        db.query(Review).delete()
        db.query(User).delete()
        db.commit()
        user = User(id=uuid.uuid4(), email="rpt@test.com", full_name="Rpt",
                     password_hash=hash_password("pass"), is_active=True)
        db.add(user)
        db.commit()
        for i in range(5):
            db.add(Review(
                brand_id=BRAND_ID, platform="google", reviewer_name=f"R{i}",
                rating=5 if i < 3 else 2, text=f"Review {i}",
                sentiment="positive" if i < 3 else "negative",
            ))
        db.commit()
        user_id = user.id
        return user_id
    finally:
        db.close()


def _auth(user_id):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user_id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_report_summary():
    user_id = _seed()
    resp = client.get("/api/v1/reports/summary", headers=_auth(user_id))
    assert resp.status_code == 200
    data = resp.json()
    assert "total_reviews" in data
    assert "average_rating" in data
    assert "by_sentiment" in data
    assert "by_platform" in data


def test_report_export_csv():
    user_id = _seed()
    resp = client.get("/api/v1/reports/export", headers=_auth(user_id))
    assert resp.status_code == 200
    assert "csv" in resp.headers["content-type"]
