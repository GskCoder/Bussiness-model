from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db, get_current_user, require_admin
from app.sales import schemas, service
from app.auth.models import User

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("", response_model=schemas.SaleResponse)
def create_sale(
    data: schemas.SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new sale with GST calculation and stock deduction."""
    sale = service.create_sale(db, data.model_dump(), current_user)
    return service.get_sale_with_customer_name(db, sale)


@router.get("", response_model=dict)
def list_sales(
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List sales with filters and pagination."""
    sales, total = service.get_sales(db, status, payment_status, customer_id, skip, limit)
    return {
        "sales": [service.get_sale_with_customer_name(db, s) for s in sales],
        "total": total,
    }


@router.get("/credit-pending", response_model=list[schemas.SaleResponse])
def credit_pending(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all sales with outstanding credit."""
    sales = service.get_credit_pending(db)
    return [service.get_sale_with_customer_name(db, s) for s in sales]


@router.get("/today-summary")
def today_summary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get today's sales summary."""
    return service.get_today_sales_summary(db)


@router.get("/{sale_id}", response_model=schemas.SaleResponse)
def get_sale(
    sale_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get sale detail with items."""
    sale = service.get_sale(db, sale_id)
    return service.get_sale_with_customer_name(db, sale)


@router.post("/{sale_id}/return", response_model=schemas.SaleResponse)
def return_sale(
    sale_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return a sale — restore stock (admin only)."""
    sale = service.return_sale(db, sale_id, admin)
    return service.get_sale_with_customer_name(db, sale)


@router.post("/{sale_id}/cancel", response_model=schemas.SaleResponse)
def cancel_sale(
    sale_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Cancel a sale — restore stock (admin only)."""
    sale = service.cancel_sale(db, sale_id, admin)
    return service.get_sale_with_customer_name(db, sale)


@router.post("/{sale_id}/payment", response_model=schemas.SaleResponse)
def record_payment(
    sale_id: int,
    data: schemas.RecordPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a payment against a credit sale."""
    sale = service.record_payment(db, sale_id, data.amount, current_user)
    return service.get_sale_with_customer_name(db, sale)
