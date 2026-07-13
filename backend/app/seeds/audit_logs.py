import uuid
from app.core.database import SessionLocal
from app.models.audit_log import AuditLog
from app.core.constants import MOCK_BRAND_ID

ACTIONS = [
    ("reply_sent", "reply", "uuid-rep-1", "Sent auto-reply to review"),
    ("review_resolved", "review", "uuid-rev-1", "Resolved review manually"),
    ("location_added", "location", "uuid-loc-1", "Added new location: SG Highway"),
    ("competitor_tracked", "competitor", "uuid-comp-1", "Started tracking competitor: Taste of Punjab"),
    ("settings_updated", "settings", None, "Updated auto-response settings"),
    ("integration_connected", "integration", "uuid-int-1", "Connected Google Business account"),
    ("auto_reply_triggered", "automation", "uuid-auto-1", "Auto-reply triggered for positive review"),
]

SEED_USER_ID = uuid.uuid4()


def seed_audit_logs():
    db = SessionLocal()
    try:
        if db.query(AuditLog).count() > 0:
            print("Audit logs already seeded. Skipping.")
            return
        for action, entity_type, entity_id, details in ACTIONS:
            db.add(AuditLog(
                brand_id=MOCK_BRAND_ID,
                user_id=SEED_USER_ID,
                user_name="System",
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details,
            ))
        db.commit()
        print(f"Seeded {len(ACTIONS)} audit logs.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_audit_logs()
