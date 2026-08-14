import uuid
from datetime import datetime

from app.models.review import Review
from app.models.user import User
from app.core.security import hash_password

BRAND_ID = uuid.uuid4()


def _seed(db):
    db.query(Review).delete()
    db.query(User).delete()
    db.commit()
    user = User(id=uuid.uuid4(), email="rv@test.com", full_name="RV",
                password_hash=hash_password("pass"), is_active=True)
    db.add(user)
    db.commit()
    reviews = [
        Review(
            brand_id=BRAND_ID, platform="google", reviewer_name="R1", rating=5,
            text="great", sentiment="positive",
            created_at=datetime(2026, 8, 1, 10, 0, 0),
        ),
        Review(
            brand_id=BRAND_ID, platform="google", reviewer_name="R2", rating=1,
            text="bad", sentiment="negative",
            created_at=datetime(2026, 8, 2, 10, 0, 0),
        ),
        Review(
            brand_id=BRAND_ID, platform="zomato", reviewer_name="R3", rating=4,
            text="ok", sentiment="neutral",
            created_at=datetime(2026, 8, 10, 10, 0, 0),
        ),
    ]
    db.add_all(reviews)
    db.commit()
    return user


def _auth(user):
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(user.id), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


def test_review_stats_filters(client, db_session):
    user = _seed(db_session)
    resp = client.get("/api/v1/reviews/stats", headers=_auth(user))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert data["by_sentiment"] == {"positive": 1, "negative": 1, "neutral": 1}

    # Platform filter
    resp = client.get("/api/v1/reviews/stats", params={"platform": "google"}, headers=_auth(user))
    assert resp.json()["total"] == 2

    # Rating filter
    resp = client.get("/api/v1/reviews/stats", params={"rating": 5}, headers=_auth(user))
    assert resp.json()["total"] == 1

    # Sentiment filter
    resp = client.get("/api/v1/reviews/stats", params={"sentiment": "positive"}, headers=_auth(user))
    assert resp.json()["total"] == 1

    # Date window: Aug 1-5 covers first two reviews only
    resp = client.get(
        "/api/v1/reviews/stats",
        params={"date_from": "2026-08-01", "date_to": "2026-08-05"},
        headers=_auth(user),
    )
    assert resp.json()["total"] == 2


def test_reply_count_counts_only_sent_replies(client, db_session):
    from app.models.reply import Reply
    user = _seed(db_session)
    db_session.query(Reply).delete()
    db_session.commit()
    review = db_session.query(Review).order_by(Review.created_at).first()
    db_session.add_all([
        Reply(review_id=review.id, user_id=user.id, text="draft", is_ai_generated=False, status="draft"),
        Reply(review_id=review.id, user_id=user.id, text="approved", is_ai_generated=False, status="approved"),
        Reply(review_id=review.id, user_id=user.id, text="sent", is_ai_generated=False, status="sent"),
    ])
    db_session.commit()

    resp = client.get("/api/v1/reviews", headers=_auth(user))
    assert resp.status_code == 200
    items = resp.json()["reviews"]
    match = next((it for it in items if it["id"] == str(review.id)), None)
    assert match is not None
    assert match["reply_count"] == 1
