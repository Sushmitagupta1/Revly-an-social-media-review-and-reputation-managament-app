from app.core.database import SessionLocal
from app.models.integration import Integration
from app.core.constants import MOCK_BRAND_ID

INTEGRATIONS = [
    ("google", "Upper Crust - Google Business", "active", True),
    ("zomato", "Upper Crust - Zomato", "active", True),
    ("swiggy", "Upper Crust - Swiggy", "active", True),
    ("reelo", "Upper Crust - Reelo", "active", True),
]


def seed_integrations():
    db = SessionLocal()
    try:
        if db.query(Integration).count() > 0:
            print("Integrations already seeded. Skipping.")
            return
        for platform, account_name, status, is_connected in INTEGRATIONS:
            db.add(Integration(brand_id=MOCK_BRAND_ID, platform=platform, account_name=account_name, status=status, is_connected=is_connected))
        db.commit()
        print(f"Seeded {len(INTEGRATIONS)} integrations.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_integrations()
