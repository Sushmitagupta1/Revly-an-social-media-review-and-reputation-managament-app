import math
from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.models.review import Review
from app.schemas.review import ReviewListResponse, ReviewResponse

router = APIRouter()


@router.get("", response_model=ReviewListResponse)
def list_complaints(
    db: DbSession,
    _user: CurrentUser,
    topic: str | None = None,
    resolved: bool | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review).filter(Review.sentiment == "negative")

    if topic:
        query = query.filter(Review.topics.like(f'%"{topic}"%'))
    if resolved is not None:
        query = query.filter(Review.is_resolved == resolved)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return ReviewListResponse(
        reviews=[ReviewResponse.model_validate(r) for r in reviews],
        total=total,
        page=page,
        pages=pages,
    )
