from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime


class CategoryCreate(BaseModel):
    name: str
    description: str = ""


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    product_name: str
    category_id: Optional[int] = None
    brand: str = ""
    barcode: Optional[str] = None
    hsn_code: str = ""
    gst_percentage: float = 18.0
    purchase_price: float
    selling_price: float
    stock_quantity: int = 0
    minimum_stock: int = 10
    expiry_date: Optional[date] = None

    @field_validator("gst_percentage")
    @classmethod
    def validate_gst(cls, v):
        if v not in (0, 5, 12, 18, 28):
            raise ValueError("GST percentage must be 0, 5, 12, 18, or 28")
        return v

    @field_validator("selling_price", "purchase_price")
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    gst_percentage: Optional[float] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    minimum_stock: Optional[int] = None
    expiry_date: Optional[date] = None


class ProductResponse(BaseModel):
    id: int
    product_name: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    brand: str
    barcode: Optional[str] = None
    hsn_code: str
    gst_percentage: float
    purchase_price: float
    selling_price: float
    stock_quantity: int
    minimum_stock: int
    expiry_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
