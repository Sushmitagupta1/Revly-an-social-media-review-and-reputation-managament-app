from app.core.database import SessionLocal
from app.models.location import Location
from app.core.constants import MOCK_BRAND_ID

LOCATIONS = [
    ("SG Highway", "SG Highway Road", "Ahmedabad"),
    ("Vastrapur", "Vastrapur Lake Road", "Ahmedabad"),
    ("Drive-In", "Drive-In Road", "Ahmedabad"),
    ("Bodakdev", "Bodakdev Cross Roads", "Ahmedabad"),
    ("Thaltej", "Thaltej Road", "Ahmedabad"),
]


def seed_locations():
    db = SessionLocal()
    try:
        if db.query(Location).count() > 0:
            print("Locations already seeded. Skipping.")
            return
        for name, address, city in LOCATIONS:
            db.add(Location(brand_id=MOCK_BRAND_ID, name=name, address=address, city=city))
        db.commit()
        print(f"Seeded {len(LOCATIONS)} locations.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_locations()
