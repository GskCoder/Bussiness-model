from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InventoryTransactionResponse(BaseModel):
    id: int
    product_id: int
    type: str
    quantity: int
    stock_after: int
    reference: str
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ManualAdjustmentRequest(BaseModel):
    product_id: int
    quantity: int  # positive to add, negative to remove
    reason: str
