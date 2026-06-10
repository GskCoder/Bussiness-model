from sqlalchemy.orm import Session
from app.settings.models import ShopSettings


def get_settings(db: Session) -> ShopSettings:
    """Get the singleton settings row. Create default if missing."""
    settings = db.query(ShopSettings).first()
    if not settings:
        settings = ShopSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_settings(db: Session, data: dict) -> ShopSettings:
    """Update shop settings with provided fields."""
    settings = get_settings(db)
    for key, value in data.items():
        if value is not None and hasattr(settings, key):
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
