import uuid
from app.core.database import SessionLocal
from app.models.competitor import Competitor

MOCK_BRAND_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

COMPETITORS = [
    ("Food Bazaar", "google", 4.2, 150),
    ("Baker's Corner", "google", 3.8, 89),
    ("Sweet Crumbs", "zomato", 4.5, 210),
    ("Urban Bites", "google", 3.6, 67),
    ("The Bread Factory", "reelo", 4.1, 120),
]


def seed_competitors():
    db = SessionLocal()
    try:
        if db.query(Competitor).count() > 0:
            print("Competitors already seeded. Skipping.")
            return
        for name, platform, rating, count in COMPETITORS:
            db.add(Competitor(
                brand_id=MOCK_BRAND_ID, name=name, platform=platform,
                avg_rating=rating, review_count=count,
            ))
        db.commit()
        print(f"Seeded {len(COMPETITORS)} competitors.")
    finally:
        db.close()
