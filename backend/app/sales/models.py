from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    card = "card"
    credit = "credit"


class PaymentStatus(str, enum.Enum):
    paid = "paid"
    partial = "partial"
    unpaid = "unpaid"


class SaleStatus(str, enum.Enum):
    completed = "completed"
    returned = "returned"
    cancelled = "cancelled"


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sale_date = Column(DateTime(timezone=True), server_default=func.now())
    subtotal = Column(Numeric(12, 2), default=0.00)

    discount_amount = Column(
        Numeric(12, 2),
        default=0.00
    )

    cgst = Column(
        Numeric(12, 2),
        default=0.00
    )

    sgst = Column(
        Numeric(12, 2),
        default=0.00
    )

    igst = Column(
        Numeric(12, 2),
        default=0.00
    )

    total_amount = Column(
        Numeric(12, 2),
        default=0.00
    )

    profit = Column(
        Numeric(12, 2),
        default=0.00
    )

    # Payment tracking
    payment_method = Column(SAEnum(PaymentMethod), default=PaymentMethod.cash)
    payment_status = Column(SAEnum(PaymentStatus), default=PaymentStatus.paid)
    amount_paid = Column(
        Numeric(12, 2),
        default=0.00
    )

    amount_due = Column(
        Numeric(12, 2),
        default=0.00
    )

    due_date = Column(Date, nullable=True)

    status = Column(SAEnum(SaleStatus), default=SaleStatus.completed)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False)  # snapshot
    hsn_code = Column(String(20), default="")
    quantity = Column(Integer, nullable=False)
    unit_price = Column(
        Numeric(10, 2),
        nullable=False
    )

    discount = Column(
        Numeric(10, 2),
        default=0.00
    )

    gst_percentage = Column(
        Numeric(5, 2),
        default=18.00
    )

    cgst = Column(
        Numeric(10, 2),
        default=0.00
    )

    sgst = Column(
        Numeric(10, 2),
        default=0.00
    )

    igst = Column(
        Numeric(10, 2),
        default=0.00
    )

    total = Column(
        Numeric(12, 2),
        default=0.00
    )

    sale = relationship("Sale", back_populates="items")
