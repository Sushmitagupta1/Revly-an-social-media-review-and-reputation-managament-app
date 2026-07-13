import io
import math
import uuid

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func

from app.api.deps import CurrentUser, DbSession
from app.core.csv_export import export_reviews_csv
from app.models.review import Review
from app.schemas.review import ReviewListResponse, ReviewResolveRequest, ReviewResponse, ReviewStatsResponse

router = APIRouter()


@router.get("/stats", response_model=ReviewStatsResponse)
def get_review_stats(db: DbSession):
    total = db.query(func.count(Review.id)).scalar() or 0
    avg = db.query(func.avg(Review.rating)).scalar() or 0

    platform_rows = db.query(Review.platform, func.count(Review.id)).group_by(Review.platform).all()
    by_platform = {p: c for p, c in platform_rows}

    sentiment_rows = db.query(Review.sentiment, func.count(Review.id)).group_by(Review.sentiment).all()
    by_sentiment = {s: c for s, c in sentiment_rows if s}

    rating_rows = db.query(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
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
    search: str | None = None,
    platform: str | None = None,
    rating: int | None = None,
    sentiment: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review)

    if search:
        query = query.filter(Review.text.ilike(f"%{search}%"))
    if platform:
        query = query.filter(Review.platform == platform)
    if rating is not None:
        query = query.filter(Review.rating == rating)
    if sentiment:
        query = query.filter(Review.sentiment == sentiment)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return ReviewListResponse(
        reviews=[ReviewResponse.model_validate(r) for r in reviews],
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
