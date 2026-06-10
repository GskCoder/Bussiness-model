from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, require_admin
from app.settings import schemas, service

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=schemas.ShopSettingsResponse)
def get_settings(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get shop settings."""
    return schemas.ShopSettingsResponse.model_validate(service.get_settings(db))


@router.put("", response_model=schemas.ShopSettingsResponse)
def update_settings(
    data: schemas.ShopSettingsUpdate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update shop settings (admin only)."""
    updated = service.update_settings(db, data.model_dump(exclude_unset=True))
    return schemas.ShopSettingsResponse.model_validate(updated)
