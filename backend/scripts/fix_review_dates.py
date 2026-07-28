"""One-time script to fix existing Zomato review dates from zomato_reviews.json"""
import json
import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.review import Review


def _parse_display_date(display_date: str | None) -> datetime | None:
    if not display_date:
        return None
    display_date = display_date.strip()
    now = datetime.now(timezone.utc)
    if display_date.lower() == "yesterday":
        return (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    if display_date.lower() == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    try:
        dt = datetime.strptime(display_date, "%d %b %Y")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        pass
    try:
        dt = datetime.strptime(display_date, "%d %B %Y")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        pass
    return None


def main():
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "zomato_reviews.json")
    json_path = os.path.normpath(json_path)
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return

    with open(json_path) as f:
        reviews_data = json.load(f)

    date_map = {}
    for r in reviews_data:
        pid = r.get("platform_review_id", "")
        dd = r.get("display_date", "")
        if pid and dd:
            date_map[pid] = dd

    print(f"Loaded {len(date_map)} review dates from JSON")

    db = SessionLocal()
    updated = 0
    try:
        zomato_reviews = db.query(Review).filter(Review.platform == "zomato").all()
        for rev in zomato_reviews:
            if rev.platform_review_id in date_map:
                dt = _parse_display_date(date_map[rev.platform_review_id])
                if dt:
                    rev.created_at = dt
                    updated += 1
        db.commit()
        print(f"Updated {updated} review dates")
    finally:
        db.close()


if __name__ == "__main__":
    main()
