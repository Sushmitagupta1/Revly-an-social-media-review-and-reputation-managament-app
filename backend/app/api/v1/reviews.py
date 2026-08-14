import io
import math
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func

from app.api.deps import CurrentUser, DbSession
from app.core.csv_export import export_reviews_csv
from app.models.reply import Reply
from app.models.review import Review
from app.schemas.review import ReviewListResponse, ReviewResolveRequest, ReviewResponse, ReviewStatsResponse

router = APIRouter()


def _resolve_location_ids(db: DbSession, names: list[str]) -> list[str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    name_to_id = {r.name: str(r.id) for r in rows}
    return [name_to_id[n] for n in names if n in name_to_id]


def _build_location_name_map(db: DbSession) -> dict[str, str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    return {str(r.id): r.name for r in rows}


def _apply_location_filter(query, db: DbSession, locations: str | None):
    if not locations:
        return query
    names = [n.strip() for n in locations.split(",") if n.strip()]
    if not names:
        return query
    ids = _resolve_location_ids(db, names)
    if ids:
        query = query.filter(Review.location_id.in_(ids))
    return query


@router.get("/stats", response_model=ReviewStatsResponse)
def get_review_stats(
    db: DbSession,
    locations: str | None = None,
    search: str | None = None,
    platform: str | None = None,
    rating: int | None = None,
    sentiment: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
):
    query = db.query(Review)
    query = _apply_location_filter(query, db, locations)

    if search:
        query = query.filter(Review.text.ilike(f"%{search}%"))
    if platform:
        query = query.filter(Review.platform == platform)
    if rating is not None:
        query = query.filter(Review.rating == rating)
    if sentiment:
        query = query.filter(Review.sentiment == sentiment)
    if date_from:
        try:
            dt = datetime.fromisoformat(date_from)
            query = query.filter(Review.created_at >= dt)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            query = query.filter(Review.created_at <= dt)
        except ValueError:
            pass

    total = query.with_entities(func.count(Review.id)).scalar() or 0
    avg = query.with_entities(func.avg(Review.rating)).scalar() or 0

    platform_rows = query.with_entities(Review.platform, func.count(Review.id)).group_by(Review.platform).all()
    by_platform = {p: c for p, c in platform_rows}

    sentiment_rows = query.with_entities(Review.sentiment, func.count(Review.id)).group_by(Review.sentiment).all()
    by_sentiment = {s: c for s, c in sentiment_rows if s}

    rating_rows = query.with_entities(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
    by_rating = {r: c for r, c in rating_rows}

    return ReviewStatsResponse(
        total=total,
        average_rating=round(float(avg), 1),
        by_platform=by_platform,
        by_sentiment=by_sentiment,
        by_rating=by_rating,
    )


@router.get("", response_model=ReviewListResponse)
def list_reviews(
    db: DbSession,
    locations: str | None = None,
    search: str | None = None,
    platform: str | None = None,
    rating: int | None = None,
    sentiment: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review)
    query = _apply_location_filter(query, db, locations)

    if search:
        query = query.filter(Review.text.ilike(f"%{search}%"))
    if platform:
        query = query.filter(Review.platform == platform)
    if rating is not None:
        query = query.filter(Review.rating == rating)
    if sentiment:
        query = query.filter(Review.sentiment == sentiment)
    if date_from:
        try:
            dt = datetime.fromisoformat(date_from)
            query = query.filter(Review.created_at >= dt)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            query = query.filter(Review.created_at <= dt)
        except ValueError:
            pass

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    loc_map = _build_location_name_map(db)
    reply_counts = dict(db.query(Reply.review_id, func.count(Reply.id)).filter(Reply.status == "sent").group_by(Reply.review_id).all())
    response_items = []
    for r in reviews:
        item = ReviewResponse.model_validate(r)
        item.location_name = loc_map.get(str(r.location_id)) if r.location_id else None
        item.reply_count = reply_counts.get(r.id, 0)
        response_items.append(item)

    return ReviewListResponse(
        reviews=response_items,
        total=total,
        page=page,
        pages=pages,
    )


@router.get("/export")
def export_reviews(
    db: DbSession,
    platform: str | None = None,
    rating: int | None = None,
):
    query = db.query(Review)
    if platform:
        query = query.filter(Review.platform == platform)
    if rating is not None:
        query = query.filter(Review.rating == rating)

    reviews = query.order_by(Review.created_at.desc()).all()
    csv_content = export_reviews_csv(reviews)

    return StreamingResponse(
        io.BytesIO(csv_content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reviews.csv"},
    )


@router.patch("/{review_id}/resolve", response_model=ReviewResponse)
def resolve_review(
    review_id: str,
    body: ReviewResolveRequest,
    db: DbSession,
    _user: CurrentUser,
):
    review = db.query(Review).filter(Review.id == uuid.UUID(review_id)).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_resolved = body.is_resolved
    db.commit()
    db.refresh(review)
    return ReviewResponse.model_validate(review)
