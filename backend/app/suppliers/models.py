from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(200), nullable=False)
    contact_person = Column(String(100), default="")
    phone_number = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(100), default="")
    address = Column(String(500), default="")
    gstin = Column(String(20), default="")
    state = Column(String(50), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="supplier")
