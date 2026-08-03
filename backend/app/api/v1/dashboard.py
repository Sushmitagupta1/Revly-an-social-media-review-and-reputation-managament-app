from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

import json

from app.api.deps import get_db
from app.core.constants import TOPIC_LABELS
from app.models.review import Review
from app.schemas.dashboard import (
    DashboardResponse,
    KpiResponse,
    TrendPoint,
    RatingDistribution,
    PlatformBreakdown,
    SentimentBreakdown,
    LocationSummary,
    RecentReview,
    ComplaintLocation,
    PraiseLocation,
)

router = APIRouter()


def _build_location_resolver(db: Session) -> dict[str, str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    return {str(r.id): r.name for r in rows}


def _resolve_location_ids(db: Session, location_names: list[str]) -> list:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    name_to_id = {r.name: r.id for r in rows}
    return [name_to_id[n] for n in location_names if n in name_to_id]


def _to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Annotated[Session, Depends(get_db)],
    locations: Optional[str] = Query(None, description="Comma-separated location names to filter by"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
):
    now = datetime.now(timezone.utc)
    loc_resolver = _build_location_resolver(db)

    filters = []
    if locations:
        filter_names = [n.strip() for n in locations.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                filters.append(Review.location_id.in_(loc_ids))

    dt_from = None
    dt_to = None
    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            filters.append(Review.created_at >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
            filters.append(Review.created_at < dt_to)
        except ValueError:
            pass

    # Load every matching review once; all aggregations happen in Python.
    query = db.query(Review)
    for f in filters:
        query = query.filter(f)
    reviews = query.all()

    total = len(reviews)
    if total > 0:
        avg_rating = round(sum(r.rating for r in reviews) / total, 1)
    else:
        avg_rating = 0
    replied = sum(1 for r in reviews if r.is_resolved)
    response_rate = round(replied / total * 100, 1) if total > 0 else 0

    kpis = KpiResponse(
        total_reviews=total,
        average_rating=avg_rating,
        response_rate=response_rate,
        avg_response_hours=2.4,  # Mock — would come from reply timestamps in production
    )

    # ── Trend window ──
    # Explicit range → align trend buckets to that range (daily up to 45 days, weekly beyond).
    # No explicit range (e.g. "All Time") → cover the entire available history.
    if dt_from is None and dt_to is None:
        earliest = db.query(func.min(Review.created_at)).scalar()
        trend_start = _to_utc(earliest) if earliest else now - timedelta(days=30)
        trend_end = now
        range_days = (trend_end - trend_start).days
        granularity = "day" if range_days <= 45 else "week"
    else:
        trend_start = dt_from or (now - timedelta(days=30))
        trend_end = dt_to or now
        if trend_end > now:
            trend_end = now
        if trend_start >= trend_end:
            trend_start = trend_end - timedelta(days=1)
        range_days = (trend_end - trend_start).days
        granularity = "day" if range_days <= 45 else "week"

    sentiment_by_day: dict = defaultdict(lambda: [0, 0.0])  # [count, rating_sum]
    complaints_by_day: dict = defaultdict(int)
    praises_by_day: dict = defaultdict(int)
    for r in reviews:
        if r.created_at is None:
            continue
        ts = _to_utc(r.created_at)
        if ts < trend_start or ts >= trend_end:
            continue
        if granularity == "week":
            key = ts.date() - timedelta(days=ts.date().weekday())
        else:
            key = ts.date()
        sentiment_by_day[key][0] += 1
        sentiment_by_day[key][1] += r.rating
        if r.sentiment == "negative":
            complaints_by_day[key] += 1
        elif r.sentiment == "positive":
            praises_by_day[key] += 1

    sentiment_trend: list[TrendPoint] = []
    complaints_trend: list[TrendPoint] = []
    praises_trend: list[TrendPoint] = []

    def _append_bucket(day_key):
        count, rating_sum = sentiment_by_day.get(day_key, [0, 0.0])
        sentiment_trend.append(TrendPoint(
            date=day_key.isoformat(),
            count=count,
            avg_rating=round(rating_sum / count, 1) if count else 0,
        ))
        complaints_trend.append(TrendPoint(date=day_key.isoformat(), count=complaints_by_day.get(day_key, 0), avg_rating=0))
        praises_trend.append(TrendPoint(date=day_key.isoformat(), count=praises_by_day.get(day_key, 0), avg_rating=0))

    if granularity == "day":
        end_day = trend_end.date()
        if trend_end.hour == 0 and trend_end.minute == 0 and trend_end.second == 0:
            end_day = end_day - timedelta(days=1)
        day = trend_start.date()
        while day <= end_day:
            _append_bucket(day)
            day += timedelta(days=1)
    else:
        start_week = trend_start.date() - timedelta(days=trend_start.date().weekday())
        end_week = trend_end.date() - timedelta(days=1)
        end_week = end_week - timedelta(days=end_week.weekday())
        week = start_week
        while week <= end_week:
            _append_bucket(week)
            week += timedelta(days=7)

    # ── Rating distribution ──
    rating_map = defaultdict(int)
    for r in reviews:
        rating_map[r.rating] += 1
    rating_distribution = [
        RatingDistribution(rating=i, count=rating_map.get(i, 0)) for i in range(1, 6)
    ]

    # ── Platform breakdown ──
    platform_map: dict = defaultdict(lambda: [0, 0.0])
    for r in reviews:
        platform_map[r.platform][0] += 1
        platform_map[r.platform][1] += r.rating
    platform_breakdown = [
        PlatformBreakdown(platform=p, count=c, avg_rating=round(s / c, 1))
        for p, (c, s) in platform_map.items()
    ]

    # ── Sentiment breakdown ──
    sentiment_map = defaultdict(int)
    for r in reviews:
        if r.sentiment:
            sentiment_map[r.sentiment] += 1
    sentiment_breakdown = SentimentBreakdown(
        positive=sentiment_map.get("positive", 0),
        negative=sentiment_map.get("negative", 0),
        neutral=sentiment_map.get("neutral", 0),
    )

    # ── NPS score (mock calculation) ──
    promoters = sentiment_breakdown.positive
    detractors = sentiment_breakdown.negative
    nps_total = promoters + detractors + sentiment_breakdown.neutral
    nps_score = round(((promoters - detractors) / nps_total * 100)) if nps_total > 0 else 0

    # ── Recent reviews (last 5) ──
    recent = sorted(
        reviews,
        key=lambda r: _to_utc(r.created_at) if r.created_at else datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:5]
    recent_reviews = [
        RecentReview(
            id=str(r.id),
            reviewer_name=r.reviewer_name,
            platform=r.platform,
            rating=r.rating,
            text=r.text,
            sentiment=r.sentiment,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in recent
    ]

    # ── Location summary ──
    loc_map: dict = defaultdict(lambda: [0, 0.0])
    for r in reviews:
        if r.location_id is None:
            continue
        lid = str(r.location_id)
        loc_map[lid][0] += 1
        loc_map[lid][1] += r.rating
    locations_list = []
    for lid, (count, rating_sum) in loc_map.items():
        locations_list.append(LocationSummary(
            location_id=lid,
            location_name=loc_resolver.get(lid, f"Location {lid[:8]}"),
            review_count=count,
            average_rating=round(rating_sum / count, 1),
        ))
    locations_list.sort(key=lambda x: x.average_rating, reverse=True)
    top_locations = locations_list[:3]
    bottom_locations = locations_list[-3:] if len(locations_list) > 3 else []

    # ── Complaints/Praises by location ──
    complaints_count = sentiment_map.get("negative", 0)
    praises_count = sentiment_map.get("positive", 0)
    complaint_loc_map = defaultdict(int)
    praise_loc_map = defaultdict(int)
    for r in reviews:
        if r.location_id is None or not r.sentiment:
            continue
        lid = str(r.location_id)
        if r.sentiment == "negative":
            complaint_loc_map[lid] += 1
        elif r.sentiment == "positive":
            praise_loc_map[lid] += 1

    complaints_by_location = [
        ComplaintLocation(
            location_id=lid,
            location_name=loc_resolver.get(lid, f"Location {lid[:8]}"),
            count=c,
        )
        for lid, c in complaint_loc_map.items()
    ]
    complaints_by_location.sort(key=lambda x: x.count, reverse=True)

    praises_by_location = [
        PraiseLocation(
            location_id=lid,
            location_name=loc_resolver.get(lid, f"Location {lid[:8]}"),
            count=c,
        )
        for lid, c in praise_loc_map.items()
    ]
    praises_by_location.sort(key=lambda x: x.count, reverse=True)

    # ── Complaint/Praise topics ──
    topic_counter_complaints: dict[str, int] = {}
    topic_counter_praises: dict[str, int] = {}
    for r in reviews:
        if not r.topics or not r.sentiment:
            continue
        raw = r.topics
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                raw = []
        if not isinstance(raw, list):
            continue
        target = None
        if r.sentiment == "negative":
            target = topic_counter_complaints
        elif r.sentiment == "positive":
            target = topic_counter_praises
        if target is None:
            continue
        for t in raw:
            label = TOPIC_LABELS.get(t, t.replace("_", " ").title())
            target[label] = target.get(label, 0) + 1

    complaint_topics = [
        {"topic": t, "count": c}
        for t, c in sorted(topic_counter_complaints.items(), key=lambda x: x[1], reverse=True)
    ]
    praise_topics = [
        {"topic": t, "count": c}
        for t, c in sorted(topic_counter_praises.items(), key=lambda x: x[1], reverse=True)
    ]

    return DashboardResponse(
        kpis=kpis,
        sentiment_trend=sentiment_trend,
        rating_distribution=rating_distribution,
        platform_breakdown=platform_breakdown,
        sentiment_breakdown=sentiment_breakdown,
        nps_score=nps_score,
        recent_reviews=recent_reviews,
        top_locations=top_locations,
        bottom_locations=bottom_locations,
        complaints_count=complaints_count,
        praises_count=praises_count,
        complaints_by_location=complaints_by_location,
        praises_by_location=praises_by_location,
        complaints_trend=complaints_trend,
        praises_trend=praises_trend,
        complaint_topics=complaint_topics,
        praise_topics=praise_topics,
    )
