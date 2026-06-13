from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), default="")

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(200), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    brand = Column(String(100), default="")
    barcode = Column(String(50), unique=True, nullable=True, index=True)
    hsn_code = Column(String(20), default="")
    gst_percentage = Column(Numeric(5, 2), default=18.00)

    purchase_price = Column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    )

    selling_price = Column(
        Numeric(10, 2),
        nullable=False,
        default=0.00
    
    )
    stock_quantity = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=10)
    expiry_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
