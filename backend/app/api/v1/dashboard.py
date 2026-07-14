from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
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

MOCK_LOCATIONS = {
    "loc_1": "Upper Crust Vastrapur",
    "loc_2": "Upper Crust SG Highway",
    "loc_3": "Upper Crust Drive-In",
    "loc_4": "Upper Crust Bodakdev",
    "loc_5": "Upper Crust Thaltej",
}


def _resolve_location_ids(db: Session, location_names: list[str]) -> list[str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    name_to_id = {r.name: str(r.id) for r in rows}
    return [name_to_id[n] for n in location_names if n in name_to_id]


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Annotated[Session, Depends(get_db)],
    locations: Optional[str] = Query(None, description="Comma-separated location names to filter by"),
):
    now = datetime.now(timezone.utc)

    base_query = db.query(Review)
    if locations:
        filter_names = [n.strip() for n in locations.split(",") if n.strip()]
        if filter_names:
            loc_ids = _resolve_location_ids(db, filter_names)
            if loc_ids:
                base_query = base_query.filter(Review.location_id.in_(loc_ids))

    # ── KPIs ──
    total = base_query.count()
    avg_rating = base_query.with_entities(func.avg(Review.rating)).scalar() or 0

    replied = base_query.filter(Review.is_resolved == True).count()
    response_rate = (replied / total * 100) if total > 0 else 0

    avg_response_hours = 2.4  # Mock — would come from reply timestamps in production

    kpis = KpiResponse(
        total_reviews=total,
        average_rating=round(float(avg_rating), 1),
        response_rate=round(response_rate, 1),
        avg_response_hours=avg_response_hours,
    )

    # ── Sentiment trend (last 30 days) ──
    sentiment_trend = []
    for i in range(29, -1, -1):
        day = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        day_count = base_query.filter(
            Review.created_at >= day_start, Review.created_at < day_end
        ).count()
        day_avg = base_query.filter(
            Review.created_at >= day_start, Review.created_at < day_end
        ).with_entities(func.avg(Review.rating)).scalar() or 0
        sentiment_trend.append(TrendPoint(
            date=day.isoformat(),
            count=day_count,
            avg_rating=round(float(day_avg), 1) if day_avg else 0,
        ))

    # ── Rating distribution ──
    rating_rows = base_query.with_entities(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
    rating_map = {r: c for r, c in rating_rows}
    rating_distribution = [
        RatingDistribution(rating=i, count=rating_map.get(i, 0)) for i in range(1, 6)
    ]

    # ── Platform breakdown ──
    platform_rows = base_query.with_entities(
        Review.platform, func.count(Review.id), func.avg(Review.rating)
    ).group_by(Review.platform).all()
    platform_breakdown = [
        PlatformBreakdown(platform=p, count=c, avg_rating=round(float(a), 1))
        for p, c, a in platform_rows
    ]

    # ── Sentiment breakdown ──
    sentiment_rows = base_query.with_entities(Review.sentiment, func.count(Review.id)).group_by(Review.sentiment).all()
    sentiment_map = {s: c for s, c in sentiment_rows if s}
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
    recent = base_query.order_by(Review.created_at.desc()).limit(5).all()
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
    location_rows = base_query.with_entities(
        Review.location_id, func.count(Review.id), func.avg(Review.rating)
    ).group_by(Review.location_id).all()

    locations = []
    for loc_id, count, avg in location_rows:
        loc_id_str = str(loc_id) if loc_id else "unknown"
        locations.append(LocationSummary(
            location_id=loc_id_str,
            location_name=MOCK_LOCATIONS.get(loc_id_str, f"Location {loc_id_str[:8]}"),
            review_count=count,
            average_rating=round(float(avg), 1),
        ))
    locations.sort(key=lambda x: x.average_rating, reverse=True)
    top_locations = locations[:3]
    bottom_locations = locations[-3:] if len(locations) > 3 else []

    # ── Complaints count and by location ──
    complaints_count = base_query.filter(Review.sentiment == "negative").count()
    complaints_location_rows = base_query.with_entities(
        Review.location_id, func.count(Review.id)
    ).filter(Review.sentiment == "negative").group_by(Review.location_id).all()
    complaints_by_location = [
        ComplaintLocation(
            location_id=str(loc_id) if loc_id else "unknown",
            location_name=MOCK_LOCATIONS.get(str(loc_id) if loc_id else "unknown", f"Location {str(loc_id)[:8]}"),
            count=count,
        )
        for loc_id, count in complaints_location_rows
    ]
    complaints_by_location.sort(key=lambda x: x.count, reverse=True)

    # ── Praises count and by location ──
    praises_count = base_query.filter(Review.sentiment == "positive").count()
    praises_location_rows = base_query.with_entities(
        Review.location_id, func.count(Review.id)
    ).filter(Review.sentiment == "positive").group_by(Review.location_id).all()
    praises_by_location = [
        PraiseLocation(
            location_id=str(loc_id) if loc_id else "unknown",
            location_name=MOCK_LOCATIONS.get(str(loc_id) if loc_id else "unknown", f"Location {str(loc_id)[:8]}"),
            count=count,
        )
        for loc_id, count in praises_location_rows
    ]
    praises_by_location.sort(key=lambda x: x.count, reverse=True)

    # ── Complaints/Praises trend (last 30 days) ──
    complaints_trend = []
    praises_trend = []
    for i in range(29, -1, -1):
        day = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        day_complaints = base_query.filter(
            Review.sentiment == "negative",
            Review.created_at >= day_start, Review.created_at < day_end,
        ).count()
        day_praises = base_query.filter(
            Review.sentiment == "positive",
            Review.created_at >= day_start, Review.created_at < day_end,
        ).count()
        complaints_trend.append(TrendPoint(date=day.isoformat(), count=day_complaints, avg_rating=0))
        praises_trend.append(TrendPoint(date=day.isoformat(), count=day_praises, avg_rating=0))

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
    )
