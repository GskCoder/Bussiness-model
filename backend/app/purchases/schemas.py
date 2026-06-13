from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.purchases.models import PaymentStatus, PurchaseStatus


class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    total: float


class PurchaseCreate(BaseModel):
    supplier_invoice_number: str
    supplier_id: int
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    payment_status: PaymentStatus
    amount_paid: float
    items: List[PurchaseItemCreate]


class PurchaseItemResponse(PurchaseItemCreate):
    id: int
    purchase_id: int
    product_name: str  # Extra field enriched by service

    class Config:
        from_attributes = True


class PurchaseResponse(BaseModel):
    id: int
    supplier_invoice_number: str
    supplier_id: int
    supplier_name: str  # Extra field enriched by service
    user_id: int
    purchase_date: datetime
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    payment_status: PaymentStatus
    amount_paid: float
    status: PurchaseStatus
    created_at: datetime
    items: Optional[List[PurchaseItemResponse]] = None

    class Config:
        from_attributes = True


class PurchaseListResponse(BaseModel):
    total: int
    purchases: List[PurchaseResponse]
