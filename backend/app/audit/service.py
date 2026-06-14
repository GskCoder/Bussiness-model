import json
from decimal import Decimal
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.audit.models import AuditLog
from app.auth.models import User

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def log_action(
    db: Session,
    user: User,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    old_values: dict | None = None,
    new_values: dict | None = None,
):
    """Record an audit log entry. Called from services on every mutation."""
    entry = AuditLog(
        user_id=user.id,
        username=user.username,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=json.dumps(old_values, cls=CustomJSONEncoder) if old_values else None,
        new_values=json.dumps(new_values, cls=CustomJSONEncoder) if new_values else None,
    )
    db.add(entry)
    # Don't commit here — let the caller's transaction commit it
    db.flush()


def get_audit_logs(
    db: Session,
    entity_type: str | None = None,
    action: str | None = None,
    user_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list:
    """Get audit logs with optional filters."""
    query = db.query(AuditLog)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


def get_audit_log_count(
    db: Session,
    entity_type: str | None = None,
    action: str | None = None,
    user_id: int | None = None,
) -> int:
    """Count audit logs with optional filters."""
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    return query.count()
