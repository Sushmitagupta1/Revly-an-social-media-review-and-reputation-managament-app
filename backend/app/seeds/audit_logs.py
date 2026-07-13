import uuid
from app.core.database import SessionLocal
from app.models.audit_log import AuditLog
from app.core.constants import MOCK_BRAND_ID

ACTIONS = [
    ("reply_sent", "reply", "Sent auto-reply to review"),
    ("review_resolved", "review", "Resolved review manually"),
    ("location_added", "location", "Added new location: SG Highway"),
    ("competitor_tracked", "competitor", "Started tracking competitor: Taste of Punjab"),
    ("settings_updated", "settings", "Updated auto-response settings"),
    ("integration_connected", "integration", "Connected Google Business account"),
    ("auto_reply_triggered", "automation", "Auto-reply triggered for positive review"),
]

SEED_USER_ID = uuid.uuid4()


def seed_audit_logs():
    db = SessionLocal()
    try:
        if db.query(AuditLog).count() > 0:
            print("Audit logs already seeded. Skipping.")
            return
        for action, entity_type, details in ACTIONS:
            db.add(AuditLog(
                brand_id=MOCK_BRAND_ID,
                user_id=SEED_USER_ID,
                user_name="System",
                action=action,
                entity_type=entity_type,
                details=details,
            ))
        db.commit()
        print(f"Seeded {len(ACTIONS)} audit logs.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_audit_logs()
