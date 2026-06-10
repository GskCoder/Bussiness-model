from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class TransactionType(str, enum.Enum):
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    RETURN = "RETURN"
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT"


class InventoryTransaction(Base):
    """Stock ledger — every stock movement is recorded here."""
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    type = Column(SAEnum(TransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)  # positive = in, negative = out
    stock_after = Column(Integer, nullable=False)  # snapshot of stock after this transaction
    reference = Column(String(200), default="")  # invoice number, note, etc.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
