from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    username = Column(String(50), nullable=False)
    action = Column(String(20), nullable=False)  # CREATE, UPDATE, DELETE, CANCEL, RETURN
    entity_type = Column(String(50), nullable=False)  # product, sale, customer, settings
    entity_id = Column(Integer, nullable=True)
    old_values = Column(Text, nullable=True)  # JSON string
    new_values = Column(Text, nullable=True)  # JSON string
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
