from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy.orm import joinedload

from app.purchases.models import Purchase, PurchaseItem, PurchaseStatus
from app.purchases.schemas import PurchaseCreate
from app.inventory.service import record_movement
from app.inventory.models import TransactionType
from app.products.models import Product
from app.suppliers.models import Supplier
from app.audit.service import log_action
from app.auth.models import User


def get_purchases(db: Session, skip: int = 0, limit: int = 100):
    query = db.query(Purchase).order_by(Purchase.created_at.desc())
    total = query.count()
    purchases = query.offset(skip).limit(limit).all()

    # Enrich with supplier names
    enriched = []
    for p in purchases:
        supplier = db.query(Supplier).filter(Supplier.id == p.supplier_id).first()
        p_dict = {c.name: getattr(p, c.name) for c in p.__table__.columns}
        p_dict["supplier_name"] = supplier.supplier_name if supplier else "Unknown"
        enriched.append(p_dict)

    return {"total": total, "purchases": enriched}


def create_purchase(db: Session, purchase_data: PurchaseCreate, user: User):
    # 1. Create Purchase
    db_purchase = Purchase(
        supplier_invoice_number=purchase_data.supplier_invoice_number,
        supplier_id=purchase_data.supplier_id,
        user_id=user.id,
        subtotal=purchase_data.subtotal,
        discount_amount=purchase_data.discount_amount,
        tax_amount=purchase_data.tax_amount,
        total_amount=purchase_data.total_amount,
        payment_status=purchase_data.payment_status,
        amount_paid=purchase_data.amount_paid
    )
    db.add(db_purchase)
    db.flush()

    # 2. Add Items and update stock via ledger
    for item in purchase_data.items:
        db_item = PurchaseItem(
            purchase_id=db_purchase.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.total
        )
        db.add(db_item)
        db.flush()

        # Update stock ledger (increase stock)
        record_movement(
            db=db,
            product_id=item.product_id,
            transaction_type=TransactionType.PURCHASE,
            quantity=item.quantity,  # positive quantity for purchase
            reference=f"Purchase #{db_purchase.id} (Inv: {db_purchase.supplier_invoice_number})",
            user=user
        )

        # Update product's purchase_price to reflect latest cost
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.purchase_price = item.unit_price

    log_action(
        db, user, "CREATE", "purchase", db_purchase.id,
        new_values={"total_amount": float(purchase_data.total_amount), "items": len(purchase_data.items)}
    )

    db.commit()
    db.refresh(db_purchase)

    # Return enriched representation
    supplier = db.query(Supplier).filter(Supplier.id == db_purchase.supplier_id).first()
    response = {c.name: getattr(db_purchase, c.name) for c in db_purchase.__table__.columns}
    response["supplier_name"] = supplier.supplier_name if supplier else "Unknown"
    return response


def get_purchase_by_id(db: Session, purchase_id: int):
    purchase = db.query(Purchase).options(joinedload(Purchase.items)).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    supplier = db.query(Supplier).filter(Supplier.id == purchase.supplier_id).first()
    p_dict = {c.name: getattr(purchase, c.name) for c in purchase.__table__.columns}
    p_dict["supplier_name"] = supplier.supplier_name if supplier else "Unknown"
    
    # Enrich items with product names
    enriched_items = []
    for item in purchase.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        i_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        i_dict["product_name"] = product.product_name if product else "Unknown"
        enriched_items.append(i_dict)
    
    p_dict["items"] = enriched_items
    return p_dict
