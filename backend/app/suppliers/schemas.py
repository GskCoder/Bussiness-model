from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SupplierBase(BaseModel):
    supplier_name: str = Field(..., min_length=1)
    contact_person: Optional[str] = ""
    phone_number: str = Field(..., min_length=1)
    email: Optional[str] = ""
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    state: Optional[str] = ""


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    supplier_name: Optional[str] = None
    phone_number: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SupplierListResponse(BaseModel):
    total: int
    suppliers: list[SupplierResponse]
