"""Seed all data for local development."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
SQLiteTypeCompiler.visit_JSONB = lambda self, type_, **kw: "JSON"
SQLiteTypeCompiler.visit_UUID = lambda self, type_, **kw: "CHAR(36)"

from app.core.database import engine, Base, SessionLocal
from app.core.constants import MOCK_BRAND_ID

# Import all models to register them with Base
from app.models.user import User
from app.models.review import Review
from app.models.reply import Reply
from app.models.chat_message import ChatMessage
from app.models.notification import Notification
from app.models.location import Location
from app.models.competitor import Competitor
from app.models.audit_log import AuditLog
from app.models.automation_rule import AutomationRule
from app.models.auto_response import AutoResponse
from app.models.integration import Integration
from app.models.resolve_policy import ResolvePolicy


def seed_all():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()
    try:
        # Check if already seeded
        from app.models.review import Review
        if db.query(Review).count() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding reviews...")
        from app.seeds.reviews import seed_reviews
        seed_reviews()

        print("Seeding locations...")
        from app.seeds.locations import seed_locations
        seed_locations()

        print("Seeding competitors...")
        from app.seeds.competitors import seed_competitors
        seed_competitors()

        print("Seeding audit logs...")
        from app.seeds.audit_logs import seed_audit_logs
        seed_audit_logs()

        print("Seeding automation rules...")
        from app.seeds.automation_rules import seed_automation_rules
        seed_automation_rules()

        print("Seeding auto-responses...")
        from app.seeds.auto_responses import seed_auto_responses
        seed_auto_responses()

        print("Seeding integrations...")
        from app.seeds.integrations import seed_integrations
        seed_integrations()

        print("Seeding resolve policies...")
        from app.seeds.resolve_policies import seed_resolve_policies
        seed_resolve_policies()

        print("\nAll seeds complete!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
