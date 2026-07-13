from app.core.database import SessionLocal
from app.models.resolve_policy import ResolvePolicy
from app.core.constants import MOCK_BRAND_ID

POLICIES = [
    ("Standard", True, 48, 72),
    ("VIP Customers", False, 24, 48),
    ("Urgent Complaints", False, 12, 24),
]


def seed_resolve_policies():
    db = SessionLocal()
    try:
        if db.query(ResolvePolicy).count() > 0:
            print("Resolve policies already seeded. Skipping.")
            return
        for name, auto_resolve, sla, escalate in POLICIES:
            db.add(ResolvePolicy(brand_id=MOCK_BRAND_ID, name=name, auto_resolve_after_reply=auto_resolve, sla_hours=sla, escalate_after_hours=escalate))
        db.commit()
        print(f"Seeded {len(POLICIES)} resolve policies.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_resolve_policies()
