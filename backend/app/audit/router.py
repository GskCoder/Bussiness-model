from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db, require_admin
from app.audit import schemas, service

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=list[schemas.AuditLogResponse])
def list_audit_logs(
    entity_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List audit logs with optional filters (admin only)."""
    logs = service.get_audit_logs(db, entity_type, action, user_id, skip, limit)
    total = service.get_audit_log_count(db, entity_type, action, user_id)
    return [schemas.AuditLogResponse.model_validate(log) for log in logs]
