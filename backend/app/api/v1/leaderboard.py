from app.api.deps import DbSession, CurrentUser
from app.models.review import Review
from app.models.location import Location
from fastapi import APIRouter
from sqlalchemy import func

router = APIRouter()


@router.get("")
def get_leaderboard(db: DbSession, _user: CurrentUser):
    loc_rows = db.query(Location.id, Location.name).all()
    loc_names = {str(r.id): r.name for r in loc_rows}

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

    sentiment_map: dict[str, dict[str, int]] = {}
    for row in sentiment_rows:
        lid = str(row.location_id)
        if lid not in sentiment_map:
            sentiment_map[lid] = {}
        if row.sentiment:
            sentiment_map[lid][row.sentiment] = row.cnt

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
            "location_name": loc_names.get(lid, f"Location {lid[:8]}"),
            "avg_rating": round(float(row.avg_rating), 1),
            "review_count": row.review_count,
            "sentiment_breakdown": sentiment,
            "positive_percentage": positive_pct,
        })

    locations.sort(key=lambda x: (-x["avg_rating"], -x["review_count"]))
    for i, loc in enumerate(locations):
        loc["rank"] = i + 1

    return {"locations": locations}
