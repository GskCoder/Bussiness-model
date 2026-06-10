from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class ShopSettings(Base):
    """Singleton table - only 1 row. Stores all shop-level configuration."""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, default=1)
    shop_name = Column(String(200), default="My Retail Store")
    shop_address = Column(String(500), default="")
    shop_phone = Column(String(20), default="")
    shop_email = Column(String(100), default="")
    shop_gstin = Column(String(15), default="")
    shop_state = Column(String(50), default="")
    shop_logo_path = Column(String(500), default="")
    invoice_prefix = Column(String(10), default="INV")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
