from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.suppliers.models import Supplier
from app.suppliers.schemas import SupplierCreate, SupplierUpdate
from app.audit.service import log_action
from app.auth.models import User


def get_suppliers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str = None
):
    query = db.query(Supplier)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Supplier.supplier_name.ilike(search_term),
                Supplier.phone_number.ilike(search_term),
                Supplier.gstin.ilike(search_term)
            )
        )

    total = query.count()
    suppliers = query.order_by(Supplier.supplier_name).offset(skip).limit(limit).all()

    return {"total": total, "suppliers": suppliers}


def get_supplier_by_id(db: Session, supplier_id: int):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


def create_supplier(db: Session, supplier: SupplierCreate, user: User):
    # Check if phone number already exists
    existing = db.query(Supplier).filter(Supplier.phone_number == supplier.phone_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="A supplier with this phone number already exists")

    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)

    log_action(
        db, user, "CREATE", "supplier", db_supplier.id,
        new_values=supplier.model_dump()
    )
    db.commit()

    return db_supplier


def update_supplier(db: Session, supplier_id: int, supplier_update: SupplierUpdate, user: User):
    db_supplier = get_supplier_by_id(db, supplier_id)

    # Check phone number uniqueness if changing
    if supplier_update.phone_number and supplier_update.phone_number != db_supplier.phone_number:
        existing = db.query(Supplier).filter(Supplier.phone_number == supplier_update.phone_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="A supplier with this phone number already exists")

    old_values = {
        "supplier_name": db_supplier.supplier_name,
        "contact_person": db_supplier.contact_person,
        "phone_number": db_supplier.phone_number,
        "email": db_supplier.email,
        "address": db_supplier.address,
        "gstin": db_supplier.gstin,
        "state": db_supplier.state
    }

    update_data = supplier_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)

    db.commit()
    db.refresh(db_supplier)

    log_action(
        db, user, "UPDATE", "supplier", db_supplier.id,
        old_values=old_values,
        new_values=update_data
    )
    db.commit()

    return db_supplier


def delete_supplier(db: Session, supplier_id: int, user: User):
    db_supplier = get_supplier_by_id(db, supplier_id)

    # Check if supplier has linked products
    if db_supplier.products:
        raise HTTPException(status_code=400, detail="Cannot delete supplier with linked products")

    old_values = {
        "supplier_name": db_supplier.supplier_name,
        "phone_number": db_supplier.phone_number
    }

    db.delete(db_supplier)
    
    log_action(
        db, user, "DELETE", "supplier", supplier_id,
        old_values=old_values
    )
    db.commit()

    return {"message": "Supplier deleted successfully"}
