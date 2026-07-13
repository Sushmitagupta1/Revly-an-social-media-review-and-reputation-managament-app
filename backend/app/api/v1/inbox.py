import math
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.review import Review
from app.models.reply import Reply
from app.schemas.review import ReviewResponse

router = APIRouter()


@router.get("")
def list_inbox(
    db: Annotated[Session, Depends(get_db)],
    _user=Depends(get_current_user),
    priority: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    reply_subq = db.query(Reply.review_id).subquery()
    query = db.query(Review).filter(~Review.id.in_(db.query(reply_subq.c.review_id)))

    if priority == "urgent":
        query = query.filter(Review.rating <= 2)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "reviews": [ReviewResponse.model_validate(r) for r in reviews],
        "total": total,
        "page": page,
        "pages": pages,
    }
