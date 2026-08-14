import json
import math
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Query
from sqlalchemy import func

from app.api.deps import CurrentUser, DbSession
from app.models.review import Review
from app.models.reply import Reply
from app.core.constants import TOPIC_LABELS
from app.schemas.review import ComplaintListResponse, ReviewResponse, TopicCount

router = APIRouter()


def _resolve_location_ids(db, location_names: list[str]) -> list[str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    name_to_id = {r.name: str(r.id) for r in rows}
    return [name_to_id[n] for n in location_names if n in name_to_id]


def _build_location_name_map(db) -> dict[str, str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    return {str(r.id): r.name for r in rows}


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    db: DbSession,
    _user: CurrentUser,
    topic: str | None = None,
    resolved: bool | None = None,
    location: str | None = None,
    date_from: str | None = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: str | None = Query(None, description="End date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Review).filter(Review.sentiment == "negative")

    loc_ids = None
    if location:
        filter_names = [n.strip() for n in location.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                query = query.filter(Review.location_id.in_(loc_ids))

    dt_from = None
    dt_to = None
    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            query = query.filter(Review.created_at >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
            query = query.filter(Review.created_at < dt_to)
        except ValueError:
            pass

    if topic:
        query = query.filter(Review.topics.like(f'%"{topic}"%'))
    if resolved is not None:
        query = query.filter(Review.is_resolved == resolved)

    topic_query = db.query(Review).filter(Review.sentiment == "negative")
    if loc_ids:
        topic_query = topic_query.filter(Review.location_id.in_(loc_ids))
    if dt_from:
        topic_query = topic_query.filter(Review.created_at >= dt_from)
    if dt_to:
        topic_query = topic_query.filter(Review.created_at < dt_to)

    topic_counter: Counter = Counter()
    for r in topic_query.yield_per(500):
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

    loc_name_map = _build_location_name_map(db)
    loc_query = (
        db.query(Review.location_id, func.count(Review.id))
        .filter(Review.sentiment == "negative", Review.location_id.isnot(None))
    )
    if loc_ids:
        loc_query = loc_query.filter(Review.location_id.in_(loc_ids))
    if dt_from:
        loc_query = loc_query.filter(Review.created_at >= dt_from)
    if dt_to:
        loc_query = loc_query.filter(Review.created_at < dt_to)
    loc_rows = loc_query.group_by(Review.location_id).all()

    loc_counter: Counter = Counter()
    for lid, c in loc_rows:
        loc_counter[loc_name_map.get(str(lid), "Unknown")] += c

    location_counts = [
        TopicCount(topic=t, count=c)
        for t, c in loc_counter.most_common()
    ]

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    reply_counts = dict(db.query(Reply.review_id, func.count(Reply.id)).filter(Reply.status == "sent").group_by(Reply.review_id).all())
    response_items = []
    for r in reviews:
        item = ReviewResponse.model_validate(r)
        item.reply_count = reply_counts.get(r.id, 0)
        response_items.append(item)

    return ComplaintListResponse(
        reviews=response_items,
        total=total,
        page=page,
        pages=pages,
        topic_counts=topic_counts,
        location_counts=location_counts,
    )
