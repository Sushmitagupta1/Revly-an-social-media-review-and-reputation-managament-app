from fastapi import APIRouter
from sqlalchemy import func

from app.api.deps import DbSession, CurrentUser
from app.models.review import Review

router = APIRouter()


@router.get("")
def get_leaderboard(
    db: DbSession,
    _user: CurrentUser,
):
    rows = (
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
    for row in rows:
        sentiment_rows = (
            db.query(Review.sentiment, func.count(Review.id))
            .filter(Review.location_id == row.location_id)
            .group_by(Review.sentiment)
            .all()
        )
        sentiment = {s: c for s, c in sentiment_rows if s}
        total = sum(sentiment.values()) or 1
        positive_pct = round(sentiment.get("positive", 0) / total * 100, 1)

        locations.append({
            "location_id": str(row.location_id),
            "avg_rating": round(float(row.avg_rating), 1),
            "review_count": row.review_count,
            "sentiment_breakdown": sentiment,
            "positive_percentage": positive_pct,
        })

    locations.sort(key=lambda x: x["avg_rating"], reverse=True)

    for i, loc in enumerate(locations):
        loc["rank"] = i + 1

    return {"locations": locations}
