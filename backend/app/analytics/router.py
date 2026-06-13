"""Analytics API router — chart-ready data for the analytics dashboard."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.auth.models import User
from app.analytics import service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
def overview(
    period: str = Query("30d", description="7d|30d|90d|1y"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.overview_stats(db, period)


@router.get("/revenue-trend")
def revenue_trend(
    period: str = Query("30d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.revenue_trend(db, period)


@router.get("/top-products")
def top_products(
    period: str = Query("30d"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.top_products(db, period, limit)


@router.get("/top-customers")
def top_customers(
    period: str = Query("30d"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.top_customers(db, period, limit)


@router.get("/by-payment-method")
def by_payment_method(
    period: str = Query("30d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.sales_by_payment_method(db, period)


@router.get("/by-category")
def by_category(
    period: str = Query("30d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.sales_by_category(db, period)
