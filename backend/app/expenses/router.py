"""Expense API router."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db, get_current_user, require_admin
from app.auth.models import User
from app.expenses import schemas, service

router = APIRouter(prefix="/expenses", tags=["Expenses"])


# --- Categories ---

@router.get("/categories", response_model=list[schemas.ExpenseCategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_categories(db)


@router.post("/categories", response_model=schemas.ExpenseCategoryResponse)
def create_category(
    data: schemas.ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_category(db, data, current_user)


# --- Expenses ---

@router.get("", response_model=schemas.ExpenseListResponse)
def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    category_id: Optional[int] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import date
    start_date = date.fromisoformat(start) if start else None
    end_date = date.fromisoformat(end) if end else None
    return service.get_expenses(db, skip, limit, category_id, start_date, end_date)


@router.post("", response_model=schemas.ExpenseResponse)
def create_expense(
    data: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_expense(db, data, current_user)


@router.put("/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(
    expense_id: int,
    data: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_expense(db, expense_id, data, current_user)


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return service.delete_expense(db, expense_id, current_user)


@router.get("/summary")
def expense_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_expense_summary(db, month, year)
