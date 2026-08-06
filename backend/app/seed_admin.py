"""Seed the admin user on first startup."""
import uuid

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@uppercrust.com").first()
        if not existing:
            user = User(
                email="admin@uppercrust.com",
                full_name="Admin",
                password_hash=hash_password("password123"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            print("Seeded admin user: admin@uppercrust.com / password123")
        else:
            print("Admin user already exists, skipping seed.")
    finally:
        db.close()
