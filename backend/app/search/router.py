"""Global Search API router — searches across Products, Customers, Sales, Suppliers."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.dependencies import get_db, get_current_user
from app.auth.models import User
from app.products.models import Product
from app.customers.models import Customer
from app.sales.models import Sale
from app.suppliers.models import Supplier

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search across all entities. Returns categorized results (max 5 per category)."""
    term = f"%{q}%"
    results = {}

    # Products
    products = (
        db.query(Product)
        .filter(
            or_(
                Product.product_name.ilike(term),
                Product.barcode.ilike(term),
                Product.brand.ilike(term),
                Product.hsn_code.ilike(term),
            )
        )
        .limit(5)
        .all()
    )
    results["products"] = [
        {
            "id": p.id,
            "title": p.product_name,
            "subtitle": f"₹{p.selling_price} • Stock: {p.stock_quantity}",
            "url": "/products",
        }
        for p in products
    ]

    # Customers
    customers = (
        db.query(Customer)
        .filter(
            or_(
                Customer.customer_name.ilike(term),
                Customer.phone_number.ilike(term),
                Customer.email.ilike(term),
                Customer.gstin.ilike(term),
            )
        )
        .limit(5)
        .all()
    )
    results["customers"] = [
        {
            "id": c.id,
            "title": c.customer_name,
            "subtitle": c.phone_number or c.email or "",
            "url": "/customers",
        }
        for c in customers
    ]

    # Sales
    sales = (
        db.query(Sale)
        .filter(Sale.invoice_number.ilike(term))
        .limit(5)
        .all()
    )
    results["sales"] = [
        {
            "id": s.id,
            "title": s.invoice_number,
            "subtitle": f"₹{s.total_amount} • {s.status.value if hasattr(s.status, 'value') else s.status}",
            "url": "/sales",
        }
        for s in sales
    ]

    # Suppliers
    suppliers = (
        db.query(Supplier)
        .filter(
            or_(
                Supplier.supplier_name.ilike(term),
                Supplier.phone_number.ilike(term),
                Supplier.gstin.ilike(term),
            )
        )
        .limit(5)
        .all()
    )
    results["suppliers"] = [
        {
            "id": s.id,
            "title": s.supplier_name,
            "subtitle": s.phone_number or "",
            "url": "/suppliers",
        }
        for s in suppliers
    ]

    # Total count
    total = sum(len(v) for v in results.values())
    return {"query": q, "total": total, "results": results}
