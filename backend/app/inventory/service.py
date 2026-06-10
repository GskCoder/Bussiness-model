from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.inventory.models import InventoryTransaction, TransactionType
from app.products.models import Product
from app.audit.service import log_action
from app.auth.models import User


def record_movement(
    db: Session,
    product_id: int,
    transaction_type: TransactionType,
    quantity: int,
    reference: str,
    user: User,
) -> InventoryTransaction:
    """Record a stock movement and update product stock.

    Args:
        quantity: positive = stock in, negative = stock out
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")

    new_stock = product.stock_quantity + quantity
    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for '{product.product_name}'. Available: {product.stock_quantity}, Requested: {abs(quantity)}",
        )

    product.stock_quantity = new_stock

    txn = InventoryTransaction(
        product_id=product_id,
        type=transaction_type,
        quantity=quantity,
        stock_after=new_stock,
        reference=reference,
        user_id=user.id,
    )
    db.add(txn)
    db.flush()
    return txn


def get_product_ledger(
    db: Session,
    product_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list:
    """Get stock movement history for a product."""
    return (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.product_id == product_id)
        .order_by(InventoryTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def manual_adjustment(
    db: Session,
    product_id: int,
    quantity: int,
    reason: str,
    user: User,
) -> InventoryTransaction:
    """Manually adjust stock (admin only). Logs audit trail."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old_stock = product.stock_quantity
    txn = record_movement(db, product_id, TransactionType.MANUAL_ADJUSTMENT, quantity, reason, user)

    log_action(
        db, user, "UPDATE", "inventory", product_id,
        old_values={"stock_quantity": old_stock},
        new_values={"stock_quantity": txn.stock_after, "adjustment": quantity, "reason": reason},
    )
    db.commit()
    return txn
