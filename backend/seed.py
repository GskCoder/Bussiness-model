"""Seed script — can be run independently to seed the database."""
from app.core.database import create_tables, SessionLocal
from app.auth.service import seed_default_admin
from app.settings.service import get_settings

if __name__ == "__main__":
    print("Seeding database...")
    create_tables()
    db = SessionLocal()
    try:
        seed_default_admin(db)
        get_settings(db)
        print("[OK] Database seeded successfully!")
    finally:
        db.close()
