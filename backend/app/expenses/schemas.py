"""Expense schemas."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


# --- Expense Category ---

class ExpenseCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""


class ExpenseCategoryResponse(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True


# --- Expense ---

class ExpenseCreate(BaseModel):
    category_id: int
    description: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    expense_date: date
    payment_method: Optional[str] = "cash"
    reference: Optional[str] = ""


class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    expense_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    category_id: int
    category_name: str = ""
    description: str
    amount: float
    expense_date: date
    payment_method: str
    reference: str
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    total: int
    expenses: list[ExpenseResponse]


class ExpenseSummary(BaseModel):
    total_expenses: float
    category_breakdown: list[dict]
    monthly_total: float
