from app.api.deps import DbSession, CurrentUser
from app.models.review import Review
from fastapi import APIRouter
from sqlalchemy import func

router = APIRouter()


@router.get("")
def get_leaderboard(db: DbSession, _user: CurrentUser):
    # Single query: group by location_id + sentiment
    sentiment_rows = (
        db.query(
            Review.location_id,
            Review.sentiment,
            func.count(Review.id).label("cnt"),
        )
        .filter(Review.location_id.isnot(None))
        .group_by(Review.location_id, Review.sentiment)
        .all()
    )

    # Aggregate in Python
    sentiment_map: dict[str, dict[str, int]] = {}
    for row in sentiment_rows:
        lid = str(row.location_id)
        if lid not in sentiment_map:
            sentiment_map[lid] = {}
        if row.sentiment:
            sentiment_map[lid][row.sentiment] = row.cnt

    # Rating aggregation
    rating_rows = (
        db.query(
            Review.location_id,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .filter(Review.location_id.isnot(None))
        .group_by(Review.location_id)
        .all()
    )

    locations = []
    for row in rating_rows:
        lid = str(row.location_id)
        sentiment = sentiment_map.get(lid, {})
        total = sum(sentiment.values()) or 1
        positive_pct = round(sentiment.get("positive", 0) / total * 100, 1)
        locations.append({
            "location_id": lid,
            "avg_rating": round(float(row.avg_rating), 1),
            "review_count": row.review_count,
            "sentiment_breakdown": sentiment,
            "positive_percentage": positive_pct,
        })

    locations.sort(key=lambda x: (-x["avg_rating"], -x["review_count"]))
    for i, loc in enumerate(locations):
        loc["rank"] = i + 1

    return {"locations": locations}
