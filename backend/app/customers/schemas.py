from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CustomerCreate(BaseModel):
    customer_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: str = ""
    gstin: Optional[str] = None
    state: str = ""


class CustomerUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    state: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    customer_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: str
    gstin: Optional[str] = None
    state: str
    total_purchases: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
