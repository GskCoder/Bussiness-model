from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.customers.models import Customer
from app.audit.service import log_action
from app.auth.models import User


def _customer_snapshot(c: Customer) -> dict:
    return {
        "customer_name": c.customer_name,
        "phone_number": c.phone_number,
        "state": c.state,
        "total_purchases": c.total_purchases,
    }


def get_customers(
    db: Session,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple:
    query = db.query(Customer)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (Customer.customer_name.ilike(term))
            | (Customer.phone_number.ilike(term))
            | (Customer.email.ilike(term))
        )
    total = query.count()
    customers = query.order_by(Customer.customer_name).offset(skip).limit(limit).all()
    return customers, total


def get_customer(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def create_customer(db: Session, data: dict, user: User) -> Customer:
    if data.get("phone_number"):
        existing = db.query(Customer).filter(Customer.phone_number == data["phone_number"]).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Phone number '{data['phone_number']}' already registered")
    customer = Customer(**data)
    db.add(customer)
    db.flush()
    log_action(db, user, "CREATE", "customer", customer.id, new_values=_customer_snapshot(customer))
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(db: Session, customer_id: int, data: dict, user: User) -> Customer:
    customer = get_customer(db, customer_id)
    old_values = _customer_snapshot(customer)
    for key, value in data.items():
        if value is not None and hasattr(customer, key):
            setattr(customer, key, value)
    db.flush()
    log_action(db, user, "UPDATE", "customer", customer.id, old_values=old_values, new_values=_customer_snapshot(customer))
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int, user: User) -> None:
    customer = get_customer(db, customer_id)
    log_action(db, user, "DELETE", "customer", customer.id, old_values=_customer_snapshot(customer))
    db.delete(customer)
    db.commit()


def get_customers_with_credit(db: Session) -> list:
    """Get customers who have outstanding credit (total_purchases is tracked separately)."""
    # This will be more useful when sales with credit are linked
    return db.query(Customer).filter(Customer.total_purchases > 0).order_by(Customer.total_purchases.desc()).all()
