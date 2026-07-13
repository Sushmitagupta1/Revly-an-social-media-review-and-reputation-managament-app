import io
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func

from app.api.deps import CurrentUser, DbSession
from app.models.review import Review
from app.core.csv_export import export_reviews_csv

router = APIRouter()


@router.get("/summary")
def report_summary(db: DbSession, _user: CurrentUser):
    total = db.query(func.count(Review.id)).scalar() or 0
    avg = db.query(func.avg(Review.rating)).scalar() or 0

    platform_rows = db.query(Review.platform, func.count(Review.id)).group_by(Review.platform).all()
    by_platform = {p: c for p, c in platform_rows}

    sentiment_rows = db.query(Review.sentiment, func.count(Review.id)).group_by(Review.sentiment).all()
    by_sentiment = {s: c for s, c in sentiment_rows if s}

    rating_rows = db.query(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
    by_rating = {r: c for r, c in rating_rows}

    return {
        "total_reviews": total,
        "average_rating": round(float(avg), 1),
        "by_sentiment": by_sentiment,
        "by_platform": by_platform,
        "by_rating": by_rating,
    }


@router.get("/export")
def export_report(
    db: DbSession,
    _user: CurrentUser,
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
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=report.csv"},
    )
