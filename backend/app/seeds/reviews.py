import uuid
import random
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.review import Review


BRAND_ID = uuid.uuid4()
LOCATIONS = [uuid.uuid4() for _ in range(5)]

REVIEWERS = [
    "John Smith", "Jane Doe", "Alex Johnson", "Sarah Williams", "Mike Brown",
    "Emily Davis", "Chris Wilson", "Lisa Anderson", "David Martinez", "Anna Taylor",
    "James Thomas", "Maria Garcia", "Robert Lee", "Jennifer White", "Michael Clark",
    "Patricia Harris", "Daniel Lewis", "Nancy Robinson", "Matthew Walker", "Linda Hall",
]

PLATFORMS = ["google", "zomato", "reelo"]

POSITIVE_REVIEWS = [
    "Absolutely love this place! The food is always fresh and the service is excellent.",
    "Best bakery in town. Their croissants are to die for!",
    "Amazing quality ingredients. You can taste the difference.",
    "Friendly staff, great ambiance, and the coffee is perfect.",
    "My go-to spot for breakfast. Never disappointed.",
    "The pasta here is incredible. Highly recommend!",
    "Consistent quality every single visit. That's why I keep coming back.",
    "Perfect spot for a casual dinner. Food was outstanding.",
    "The dessert menu is phenomenal. Try the tiramisu!",
    "Great portion sizes and reasonable prices. What more could you ask for?",
]

NEGATIVE_REVIEWS = [
    "The delivery took forever. Food arrived cold and soggy.",
    "Way too expensive for the portion sizes. Not worth it.",
    "Staff was rude and inattentive. Won't be coming back.",
    "Food quality has gone downhill recently. Very disappointing.",
    "Waited 30 minutes even though the restaurant was empty.",
    "The food was bland and tasteless. Expected much better.",
    "Order was wrong and they refused to fix it. Terrible service.",
    "Found a hair in my food. Absolutely disgusting.",
    "Overpriced and underwhelming. There are better options nearby.",
    "The hygiene standards here are questionable at best.",
]

NEUTRAL_REVIEWS = [
    "It was okay. Nothing special but not bad either.",
    "Food was decent but the wait was a bit long.",
    "Average experience. The food was fine but the service could be better.",
    "Not bad for a quick meal. Nothing to write home about though.",
    "The ambiance is nice but the food doesn't quite match the price.",
]

SENTIMENTS = {"positive": POSITIVE_REVIEWS, "negative": NEGATIVE_REVIEWS, "neutral": NEUTRAL_REVIEWS}
RATING_MAP = {"positive": (4, 5), "negative": (1, 2), "neutral": (3, 3)}
TOPICS = ["food_quality", "service", "delivery", "ambience", "pricing", "staff", "cleanliness", "wait_time"]


def seed_reviews():
    db = SessionLocal()
    try:
        existing = db.query(Review).count()
        if existing > 0:
            print(f"Already {existing} reviews seeded. Skipping.")
            return

        reviews = []
        for _ in range(75):
            sentiment = random.choices(["positive", "negative", "neutral"], weights=[60, 25, 15])[0]
            rating = random.randint(*RATING_MAP[sentiment])
            text = random.choice(SENTIMENTS[sentiment])
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)

            review = Review(
                brand_id=BRAND_ID,
                location_id=random.choice(LOCATIONS),
                platform=random.choice(PLATFORMS),
                platform_review_id=f"mock_{random.randint(10000, 99999)}",
                reviewer_name=random.choice(REVIEWERS),
                rating=rating,
                text=text,
                sentiment=sentiment,
                topics=random.sample(TOPICS, k=random.randint(1, 3)),
                created_at=datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago),
            )
            reviews.append(review)

        db.add_all(reviews)
        db.commit()
        print(f"Seeded {len(reviews)} reviews.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_reviews()
