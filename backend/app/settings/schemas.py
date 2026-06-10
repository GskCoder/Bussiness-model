from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ShopSettingsResponse(BaseModel):
    id: int
    shop_name: str
    shop_address: str
    shop_phone: str
    shop_email: str
    shop_gstin: str
    shop_state: str
    shop_logo_path: str
    invoice_prefix: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ShopSettingsUpdate(BaseModel):
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    shop_phone: Optional[str] = None
    shop_email: Optional[str] = None
    shop_gstin: Optional[str] = None
    shop_state: Optional[str] = None
    shop_logo_path: Optional[str] = None
    invoice_prefix: Optional[str] = None
