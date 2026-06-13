"""Expense service — CRUD + summaries."""

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.expenses.models import Expense, ExpenseCategory
from app.expenses.schemas import ExpenseCreate, ExpenseUpdate, ExpenseCategoryCreate
from app.audit.service import log_action
from app.auth.models import User


def _money(v):
    return float(Decimal(str(v)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


# --- Categories ---

def get_categories(db: Session) -> list[ExpenseCategory]:
    return db.query(ExpenseCategory).order_by(ExpenseCategory.name).all()


def create_category(db: Session, data: ExpenseCategoryCreate, user: User) -> ExpenseCategory:
    existing = db.query(ExpenseCategory).filter(ExpenseCategory.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    cat = ExpenseCategory(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)

    log_action(db, user, "CREATE", "expense_category", cat.id, new_values=data.model_dump())
    db.commit()
    return cat


def seed_default_categories(db: Session):
    """Seed default expense categories if none exist."""
    if db.query(ExpenseCategory).count() > 0:
        return

    defaults = [
        ("Rent", "Shop/office rent"),
        ("Salary", "Employee wages and salaries"),
        ("Utilities", "Electricity, water, internet bills"),
        ("Transport", "Delivery and transportation costs"),
        ("Maintenance", "Repairs and maintenance"),
        ("Supplies", "Office and shop supplies"),
        ("Marketing", "Advertising and promotion"),
        ("Miscellaneous", "Other business expenses"),
    ]
    for name, desc in defaults:
        db.add(ExpenseCategory(name=name, description=desc))
    db.commit()


# --- Expenses ---

def _enrich_expense(db: Session, expense: Expense) -> dict:
    """Convert expense to response dict with category name."""
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == expense.category_id).first()
    return {
        "id": expense.id,
        "category_id": expense.category_id,
        "category_name": cat.name if cat else "Unknown",
        "description": expense.description,
        "amount": float(expense.amount),
        "expense_date": expense.expense_date,
        "payment_method": expense.payment_method or "cash",
        "reference": expense.reference or "",
        "user_id": expense.user_id,
        "created_at": expense.created_at,
    }


def get_expenses(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    category_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict:
    query = db.query(Expense)

    if category_id:
        query = query.filter(Expense.category_id == category_id)

    # Filter by date range in Python for SQLite compat
    all_expenses = query.order_by(Expense.expense_date.desc()).all()

    if start_date or end_date:
        filtered = []
        for e in all_expenses:
            if start_date and e.expense_date < start_date:
                continue
            if end_date and e.expense_date > end_date:
                continue
            filtered.append(e)
        all_expenses = filtered

    total = len(all_expenses)
    page = all_expenses[skip:skip + limit]

    return {
        "total": total,
        "expenses": [_enrich_expense(db, e) for e in page],
    }


def create_expense(db: Session, data: ExpenseCreate, user: User) -> dict:
    # Validate category
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == data.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Expense category not found")

    expense = Expense(
        category_id=data.category_id,
        description=data.description,
        amount=data.amount,
        expense_date=data.expense_date,
        payment_method=data.payment_method or "cash",
        reference=data.reference or "",
        user_id=user.id,
    )
    db.add(expense)
    db.flush()

    log_action(db, user, "CREATE", "expense", expense.id, new_values={
        "description": data.description,
        "amount": data.amount,
        "category": cat.name,
    })

    db.commit()
    db.refresh(expense)
    return _enrich_expense(db, expense)


def update_expense(db: Session, expense_id: int, data: ExpenseUpdate, user: User) -> dict:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    old_values = {
        "description": expense.description,
        "amount": float(expense.amount),
    }

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)

    log_action(db, user, "UPDATE", "expense", expense.id,
               old_values=old_values, new_values=update_data)

    db.commit()
    db.refresh(expense)
    return _enrich_expense(db, expense)


def delete_expense(db: Session, expense_id: int, user: User) -> dict:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    log_action(db, user, "DELETE", "expense", expense_id, old_values={
        "description": expense.description,
        "amount": float(expense.amount),
    })

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


def get_expense_summary(db: Session, month: int | None = None, year: int | None = None) -> dict:
    """Monthly expense summary with category breakdown."""
    from datetime import date as dt_date

    today = dt_date.today()
    target_month = month or today.month
    target_year = year or today.year

    expenses = db.query(Expense).all()
    monthly = [
        e for e in expenses
        if e.expense_date.month == target_month and e.expense_date.year == target_year
    ]

    total = sum(float(e.amount) for e in monthly)

    by_category = defaultdict(float)
    for e in monthly:
        cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == e.category_id).first()
        cat_name = cat.name if cat else "Unknown"
        by_category[cat_name] += float(e.amount)

    category_breakdown = [
        {"category": k, "amount": _money(v)}
        for k, v in sorted(by_category.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "total_expenses": _money(total),
        "month": target_month,
        "year": target_year,
        "category_breakdown": category_breakdown,
        "monthly_total": _money(total),
    }
