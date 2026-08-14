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

    removed, error = _dedup_reviews(db_session)
    assert removed == 2
    assert error is None
    assert db_session.query(Review).filter(Review.platform_review_id == "order-123").count() == 1


def test_dedup_keeps_unique_rows(db_session):
    _seed_duplicates(db_session)
    _dedup_reviews(db_session)
    db_session.add(Review(
        brand_id=BRAND_ID, platform="swiggy", platform_review_id="order-456",
        reviewer_name="R9", rating=4, text="keep", sentiment="positive",
    ))
    db_session.commit()

    removed, error = _dedup_reviews(db_session)
    assert removed == 0
    assert error is None
    assert db_session.query(Review).filter(Review.platform_review_id.in_(["order-123", "order-456"])).count() == 2


def test_ensure_unique_index_returns_true(db_session):
    _seed_duplicates(db_session)
    _dedup_reviews(db_session)
    assert _ensure_unique_index(db_session) is True


def test_dedup_keeps_copy_with_reply(db_session):
    from app.models.reply import Reply

    db_session.query(Reply).delete()
    db_session.query(Review).delete()
    db_session.commit()

    no_reply = Review(
        brand_id=BRAND_ID, platform="swiggy", platform_review_id="order-999",
        reviewer_name="R1", rating=5, text="dup", sentiment="positive",
    )
    with_reply = Review(
        brand_id=BRAND_ID, platform="swiggy", platform_review_id="order-999",
        reviewer_name="R2", rating=5, text="dup", sentiment="positive",
    )
    db_session.add_all([no_reply, with_reply])
    db_session.commit()
    db_session.add(Reply(review_id=with_reply.id, text="replied", status="sent"))
    db_session.commit()

    removed, error = _dedup_reviews(db_session)
    assert removed == 1
    assert error is None
    remaining = db_session.query(Review).filter(Review.platform_review_id == "order-999").all()
    assert len(remaining) == 1
    assert remaining[0].id == with_reply.id
    assert db_session.query(Reply).filter(Reply.review_id == with_reply.id).count() == 1
