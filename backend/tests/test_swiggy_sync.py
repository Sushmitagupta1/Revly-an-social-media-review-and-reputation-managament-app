import uuid

from app.models.review import Review
from app.services.swiggy_sync import _dedup_reviews, _ensure_unique_index

BRAND_ID = uuid.uuid4()


def _seed_duplicates(db_session):
    db_session.query(Review).delete()
    db_session.commit()
    for i in range(3):
        db_session.add(Review(
            brand_id=BRAND_ID, platform="swiggy", platform_review_id="order-123",
            reviewer_name=f"R{i}", rating=5, text="dup", sentiment="positive",
        ))
    db_session.commit()


def test_dedup_reviews_removes_duplicates(db_session):
    _seed_duplicates(db_session)
    assert db_session.query(Review).filter(Review.platform_review_id == "order-123").count() == 3

    removed = _dedup_reviews(db_session)
    assert removed == 2
    assert db_session.query(Review).filter(Review.platform_review_id == "order-123").count() == 1


def test_dedup_keeps_unique_rows(db_session):
    _seed_duplicates(db_session)
    _dedup_reviews(db_session)
    db_session.add(Review(
        brand_id=BRAND_ID, platform="swiggy", platform_review_id="order-456",
        reviewer_name="R9", rating=4, text="keep", sentiment="positive",
    ))
    db_session.commit()

    removed = _dedup_reviews(db_session)
    assert removed == 0
    assert db_session.query(Review).filter(Review.platform_review_id.in_(["order-123", "order-456"])).count() == 2


def test_ensure_unique_index_returns_true(db_session):
    _seed_duplicates(db_session)
    _dedup_reviews(db_session)
    assert _ensure_unique_index(db_session) is True
