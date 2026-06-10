from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, require_admin
from app.inventory import schemas, service
from app.auth.models import User

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/{product_id}/ledger", response_model=list[schemas.InventoryTransactionResponse])
def get_stock_ledger(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get stock movement history for a product."""
    txns = service.get_product_ledger(db, product_id, skip, limit)
    return [schemas.InventoryTransactionResponse.model_validate(t) for t in txns]


@router.post("/adjust", response_model=schemas.InventoryTransactionResponse)
def manual_stock_adjustment(
    data: schemas.ManualAdjustmentRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Manually adjust stock (admin only)."""
    txn = service.manual_adjustment(db, data.product_id, data.quantity, data.reason, admin)
    return schemas.InventoryTransactionResponse.model_validate(txn)
