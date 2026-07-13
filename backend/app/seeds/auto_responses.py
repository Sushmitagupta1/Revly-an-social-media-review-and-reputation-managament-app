from app.core.constants import MOCK_BRAND_ID
from app.core.database import SessionLocal
from app.models.auto_response import AutoResponse

AUTO_RESPONSES = [
    ("positive", "food", "Thank you for the wonderful feedback about our food! We're thrilled you enjoyed it."),
    ("positive", "service", "Thanks for the kind words about our service! Our team works hard to make every visit special."),
    ("positive", "ambiance", "We're so glad you loved the ambiance! We put a lot of thought into creating a great atmosphere."),
    ("negative", "food", "We're sorry the food didn't meet your expectations. Please reach out so we can make it right."),
    ("negative", "service", "We apologize for the service experience. This isn't up to our standards and we'll address it."),
    ("negative", "delivery", "We're sorry about the delivery issue. We're working with our delivery partners to improve."),
    ("neutral", "general", "Thank you for your feedback! We appreciate you taking the time to share your experience."),
]


def seed_auto_responses():
    db = SessionLocal()
    try:
        if db.query(AutoResponse).count() > 0:
            print("Auto-responses already seeded. Skipping.")
            return
        for sentiment, topic, template in AUTO_RESPONSES:
            db.add(
                AutoResponse(
                    brand_id=MOCK_BRAND_ID,
                    sentiment=sentiment,
                    topic=topic,
                    template=template,
                )
            )
        db.commit()
        print(f"Seeded {len(AUTO_RESPONSES)} auto-responses.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_auto_responses()
