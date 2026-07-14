import json
import math
from collections import Counter

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.models.review import Review
from app.schemas.review import ComplaintListResponse, ReviewResponse, TopicCount

router = APIRouter()


def _resolve_location_ids(db, location_names: list[str]) -> list[str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    name_to_id = {r.name: str(r.id) for r in rows}
    return [name_to_id[n] for n in location_names if n in name_to_id]


TOPIC_LABELS = {
    "food_quality": "Food Quality",
    "service": "Service",
    "delivery": "Delivery",
    "pricing": "Pricing",
    "staff": "Staff",
    "ambience": "Ambience",
    "cleanliness": "Cleanliness",
    "wait_time": "Wait Time",
}


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    db: DbSession,
    _user: CurrentUser,
    topic: str | None = None,
    resolved: bool | None = None,
    location: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review).filter(Review.sentiment == "negative")

    if location:
        filter_names = [n.strip() for n in location.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                query = query.filter(Review.location_id.in_(loc_ids))

    if topic:
        query = query.filter(Review.topics.like(f'%"{topic}"%'))
    if resolved is not None:
        query = query.filter(Review.is_resolved == resolved)

    all_negative = db.query(Review).filter(Review.sentiment == "negative")
    if location:
        filter_names = [n.strip() for n in location.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                all_negative = all_negative.filter(Review.location_id.in_(loc_ids))

    topic_counter: Counter = Counter()
    for r in all_negative.all():
        if r.topics:
            raw = r.topics
            if isinstance(raw, str):
                try:
                    raw = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    raw = []
            if isinstance(raw, list):
                for t in raw:
                    label = TOPIC_LABELS.get(t, t.replace("_", " ").title())
                    topic_counter[label] += 1

    topic_counts = [
        TopicCount(topic=t, count=c)
        for t, c in topic_counter.most_common()
    ]

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return ComplaintListResponse(
        reviews=[ReviewResponse.model_validate(r) for r in reviews],
        total=total,
        page=page,
        pages=pages,
        topic_counts=topic_counts,
    )
