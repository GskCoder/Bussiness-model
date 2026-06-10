from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(200), nullable=False, index=True)
    phone_number = Column(String(15), unique=True, nullable=True, index=True)
    email = Column(String(100), nullable=True)
    address = Column(String(500), default="")
    gstin = Column(String(15), nullable=True)
    state = Column(String(50), default="")  # For CGST/SGST vs IGST determination
    total_purchases = Column(
        Numeric(12, 2),
        default=0.00
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
