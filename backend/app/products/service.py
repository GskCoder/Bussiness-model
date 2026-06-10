from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.products.models import Product, Category
from app.products.schemas import ProductResponse
from app.audit.service import log_action
from app.auth.models import User


def _product_to_response(product: Product) -> dict:
    """Convert a Product to response dict with category_name."""
    data = {
        "id": product.id,
        "product_name": product.product_name,
        "category_id": product.category_id,
        "category_name": product.category.name if product.category else None,
        "brand": product.brand,
        "barcode": product.barcode,
        "hsn_code": product.hsn_code,
        "gst_percentage": product.gst_percentage,
        "purchase_price": product.purchase_price,
        "selling_price": product.selling_price,
        "stock_quantity": product.stock_quantity,
        "minimum_stock": product.minimum_stock,
        "expiry_date": product.expiry_date,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }
    return data


def _product_snapshot(product: Product) -> dict:
    """Snapshot for audit log."""
    return {
        "product_name": product.product_name,
        "selling_price": product.selling_price,
        "purchase_price": product.purchase_price,
        "stock_quantity": product.stock_quantity,
        "gst_percentage": product.gst_percentage,
    }


# --- Categories ---

def get_categories(db: Session) -> list:
    return db.query(Category).order_by(Category.name).all()


def create_category(db: Session, name: str, description: str = "") -> Category:
    existing = db.query(Category).filter(Category.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Category '{name}' already exists")
    cat = Category(name=name, description=description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


# --- Products ---

def get_products(
    db: Session,
    search: str | None = None,
    category_id: int | None = None,
    stock_status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple:
    """Get products with filters. Returns (products, total_count)."""
    query = db.query(Product)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Product.product_name.ilike(search_term))
            | (Product.barcode.ilike(search_term))
            | (Product.brand.ilike(search_term))
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if stock_status == "low":
        query = query.filter(
            Product.stock_quantity <= Product.minimum_stock,
            Product.stock_quantity > 0,
        )
    elif stock_status == "out":
        query = query.filter(Product.stock_quantity <= 0)

    total = query.count()
    products = query.order_by(Product.product_name).offset(skip).limit(limit).all()

    return products, total


def get_product(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def create_product(db: Session, data: dict, user: User) -> Product:
    # Check barcode uniqueness
    if data.get("barcode"):
        existing = db.query(Product).filter(Product.barcode == data["barcode"]).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Barcode '{data['barcode']}' already exists")

    product = Product(**data)
    db.add(product)
    db.flush()

    log_action(db, user, "CREATE", "product", product.id, new_values=_product_snapshot(product))
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, data: dict, user: User) -> Product:
    product = get_product(db, product_id)
    old_values = _product_snapshot(product)

    for key, value in data.items():
        if value is not None and hasattr(product, key):
            setattr(product, key, value)

    db.flush()
    log_action(db, user, "UPDATE", "product", product.id, old_values=old_values, new_values=_product_snapshot(product))
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int, user: User) -> None:
    product = get_product(db, product_id)
    old_values = _product_snapshot(product)
    log_action(db, user, "DELETE", "product", product.id, old_values=old_values)
    db.delete(product)
    db.commit()


def get_low_stock_products(db: Session) -> list:
    """Products where stock_quantity <= minimum_stock."""
    return (
        db.query(Product)
        .filter(Product.stock_quantity <= Product.minimum_stock)
        .order_by(Product.stock_quantity)
        .all()
    )
