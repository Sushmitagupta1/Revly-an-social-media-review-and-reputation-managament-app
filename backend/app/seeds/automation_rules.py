from app.core.constants import MOCK_BRAND_ID
from app.core.database import SessionLocal
from app.models.automation_rule import AutomationRule

RULES = [
    ("Auto-reply to positive reviews", "sentiment_positive", "auto_reply", "Thank you for the wonderful feedback! We're glad you enjoyed your experience."),
    ("Auto-reply to negative reviews", "sentiment_negative", "auto_reply", "We're sorry to hear about your experience. Please contact us so we can make it right."),
    ("Flag urgent complaints", "topic_urgent", "flag_urgent", None),
    ("Assign delivery issues to manager", "topic_delivery", "assign_team", None),
]


def seed_automation_rules():
    db = SessionLocal()
    try:
        if db.query(AutomationRule).count() > 0:
            print("Automation rules already seeded. Skipping.")
            return
        for name, trigger, action, template in RULES:
            db.add(AutomationRule(
                brand_id=MOCK_BRAND_ID,
                name=name,
                trigger=trigger,
                action=action,
                template=template,
            ))
        db.commit()
        print(f"Seeded {len(RULES)} automation rules.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_automation_rules()
