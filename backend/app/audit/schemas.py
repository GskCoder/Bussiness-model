from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    username: str
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True
