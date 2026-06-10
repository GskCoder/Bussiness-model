from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    discount: float = 0  # discount per item


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: list[SaleItemCreate]
    discount_amount: float = 0  # overall discount
    payment_method: str = "cash"  # cash, upi, card, credit
    amount_paid: Optional[float] = None  # for credit/partial payments
    due_date: Optional[date] = None  # for credit sales


class RecordPaymentRequest(BaseModel):
    amount: float


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    hsn_code: str
    quantity: int
    unit_price: float
    discount: float
    gst_percentage: float
    cgst: float
    sgst: float
    igst: float
    total: float

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    user_id: int
    sale_date: Optional[datetime] = None
    subtotal: float
    discount_amount: float
    cgst: float
    sgst: float
    igst: float
    total_amount: float
    profit: float
    payment_method: str
    payment_status: str
    amount_paid: float
    amount_due: float
    due_date: Optional[date] = None
    status: str
    items: list[SaleItemResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
