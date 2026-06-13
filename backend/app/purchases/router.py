from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.auth.models import User
from app.purchases import schemas, service

router = APIRouter(prefix="/purchases", tags=["Purchases"])


@router.get("", response_model=schemas.PurchaseListResponse)
def list_purchases(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_purchases(db, skip=skip, limit=limit)


@router.post("", response_model=schemas.PurchaseResponse)
def create_purchase(
    purchase: schemas.PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.create_purchase(db, purchase, current_user)


@router.get("/{purchase_id}", response_model=schemas.PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_purchase_by_id(db, purchase_id)
