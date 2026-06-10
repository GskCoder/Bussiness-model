from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db, get_current_user, require_admin
from app.products import schemas, service
from app.auth.models import User

router = APIRouter(prefix="/products", tags=["Products"])


# --- Categories ---
@router.get("/categories", response_model=list[schemas.CategoryResponse])
def list_categories(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all product categories."""
    cats = service.get_categories(db)
    return [schemas.CategoryResponse.model_validate(c) for c in cats]


@router.post("/categories", response_model=schemas.CategoryResponse)
def create_category(
    data: schemas.CategoryCreate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new category (admin only)."""
    cat = service.create_category(db, data.name, data.description)
    return schemas.CategoryResponse.model_validate(cat)


# --- Products ---
@router.get("", response_model=dict)
def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    stock_status: Optional[str] = Query(None, regex="^(low|out)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List products with search, filters, and pagination."""
    products, total = service.get_products(db, search, category_id, stock_status, skip, limit)
    return {
        "products": [service._product_to_response(p) for p in products],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/low-stock", response_model=list[schemas.ProductResponse])
def low_stock_products(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get products with stock at or below minimum level."""
    products = service.get_low_stock_products(db)
    return [service._product_to_response(p) for p in products]


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(
    product_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single product by ID."""
    product = service.get_product(db, product_id)
    return service._product_to_response(product)


@router.post("", response_model=schemas.ProductResponse)
def create_product(
    data: schemas.ProductCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new product (admin only)."""
    product = service.create_product(db, data.model_dump(), admin)
    return service._product_to_response(product)


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    data: schemas.ProductUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a product (admin only)."""
    product = service.update_product(db, product_id, data.model_dump(exclude_unset=True), admin)
    return service._product_to_response(product)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a product (admin only)."""
    service.delete_product(db, product_id, admin)
    return {"message": "Product deleted successfully"}
