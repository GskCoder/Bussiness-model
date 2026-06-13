"""Analytics Service — aggregated data for dashboard charts."""

from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict
from sqlalchemy.orm import Session

from app.sales.models import Sale, SaleItem, SaleStatus
from app.products.models import Product, Category
from app.customers.models import Customer


def _money(v):
    return float(Decimal(str(v)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _get_date_range(period: str) -> tuple[date, date]:
    """Return (start, end) for a period string."""
    today = date.today()
    if period == "7d":
        return today - timedelta(days=6), today
    elif period == "30d":
        return today - timedelta(days=29), today
    elif period == "90d":
        return today - timedelta(days=89), today
    elif period == "1y":
        return today - timedelta(days=364), today
    else:
        return today - timedelta(days=29), today


def revenue_trend(db: Session, period: str = "30d") -> list[dict]:
    """Daily revenue for the given period — for line/area charts."""
    start, end = _get_date_range(period)

    sales = (
        db.query(Sale)
        .filter(Sale.status == SaleStatus.completed)
        .all()
    )

    daily = defaultdict(lambda: {"revenue": 0.0, "profit": 0.0, "count": 0})

    for s in sales:
        if s.created_at and start <= s.created_at.date() <= end:
            day_key = s.created_at.date().isoformat()
            daily[day_key]["revenue"] += float(s.total_amount or 0)
            daily[day_key]["profit"] += float(s.profit or 0)
            daily[day_key]["count"] += 1

    # Fill in missing days with zeros
    result = []
    current = start
    while current <= end:
        key = current.isoformat()
        entry = daily.get(key, {"revenue": 0.0, "profit": 0.0, "count": 0})
        result.append({
            "date": key,
            "label": current.strftime("%d %b"),
            "revenue": _money(entry["revenue"]),
            "profit": _money(entry["profit"]),
            "count": entry["count"],
        })
        current += timedelta(days=1)

    return result


def top_products(db: Session, period: str = "30d", limit: int = 10) -> list[dict]:
    """Top selling products by revenue."""
    start, end = _get_date_range(period)

    sales = (
        db.query(Sale)
        .filter(Sale.status == SaleStatus.completed)
        .all()
    )
    sale_ids = [
        s.id for s in sales
        if s.created_at and start <= s.created_at.date() <= end
    ]

    if not sale_ids:
        return []

    items = db.query(SaleItem).filter(SaleItem.sale_id.in_(sale_ids)).all()

    product_totals = defaultdict(lambda: {"name": "", "revenue": 0.0, "quantity": 0})
    for item in items:
        pid = item.product_id
        product_totals[pid]["name"] = item.product_name
        product_totals[pid]["revenue"] += float(item.total or 0)
        product_totals[pid]["quantity"] += item.quantity

    sorted_products = sorted(product_totals.values(), key=lambda x: x["revenue"], reverse=True)

    return [
        {"name": p["name"], "revenue": _money(p["revenue"]), "quantity": p["quantity"]}
        for p in sorted_products[:limit]
    ]


def top_customers(db: Session, period: str = "30d", limit: int = 10) -> list[dict]:
    """Top customers by purchase amount."""
    start, end = _get_date_range(period)

    sales = (
        db.query(Sale)
        .filter(Sale.status == SaleStatus.completed, Sale.customer_id.isnot(None))
        .all()
    )

    customer_totals = defaultdict(lambda: {"name": "", "total": 0.0, "count": 0})
    for s in sales:
        if s.created_at and start <= s.created_at.date() <= end:
            cid = s.customer_id
            customer_totals[cid]["total"] += float(s.total_amount or 0)
            customer_totals[cid]["count"] += 1

    # Resolve customer names
    for cid in customer_totals:
        customer = db.query(Customer).filter(Customer.id == cid).first()
        if customer:
            customer_totals[cid]["name"] = customer.customer_name

    sorted_customers = sorted(customer_totals.values(), key=lambda x: x["total"], reverse=True)

    return [
        {"name": c["name"] or "Unknown", "total": _money(c["total"]), "orders": c["count"]}
        for c in sorted_customers[:limit]
    ]


def sales_by_payment_method(db: Session, period: str = "30d") -> list[dict]:
    """Sales breakdown by payment method — for pie chart."""
    start, end = _get_date_range(period)

    sales = (
        db.query(Sale)
        .filter(Sale.status == SaleStatus.completed)
        .all()
    )

    methods = defaultdict(lambda: {"count": 0, "total": 0.0})
    for s in sales:
        if s.created_at and start <= s.created_at.date() <= end:
            method = s.payment_method.value if hasattr(s.payment_method, 'value') else str(s.payment_method)
            methods[method]["count"] += 1
            methods[method]["total"] += float(s.total_amount or 0)

    colors = {"cash": "#10B981", "upi": "#6366F1", "card": "#3B82F6", "credit": "#F59E0B"}

    return [
        {"name": m.upper(), "value": _money(d["total"]), "count": d["count"],
         "fill": colors.get(m, "#94A3B8")}
        for m, d in methods.items()
    ]


def sales_by_category(db: Session, period: str = "30d") -> list[dict]:
    """Sales breakdown by product category — for pie chart."""
    start, end = _get_date_range(period)

    sales = (
        db.query(Sale)
        .filter(Sale.status == SaleStatus.completed)
        .all()
    )
    sale_ids = [
        s.id for s in sales
        if s.created_at and start <= s.created_at.date() <= end
    ]

    if not sale_ids:
        return []

    items = db.query(SaleItem).filter(SaleItem.sale_id.in_(sale_ids)).all()

    category_totals = defaultdict(lambda: {"name": "", "revenue": 0.0, "count": 0})

    cat_colors = ["#4F46E5", "#10B981", "#F59E0B", "#3B82F6", "#F43F5E",
                  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1"]

    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product and product.category_id:
            cat = db.query(Category).filter(Category.id == product.category_id).first()
            cat_name = cat.name if cat else "Uncategorized"
        else:
            cat_name = "Uncategorized"
        category_totals[cat_name]["name"] = cat_name
        category_totals[cat_name]["revenue"] += float(item.total or 0)
        category_totals[cat_name]["count"] += item.quantity

    sorted_cats = sorted(category_totals.values(), key=lambda x: x["revenue"], reverse=True)

    return [
        {"name": c["name"], "value": _money(c["revenue"]), "count": c["count"],
         "fill": cat_colors[i % len(cat_colors)]}
        for i, c in enumerate(sorted_cats)
    ]


def overview_stats(db: Session, period: str = "30d") -> dict:
    """Summary stats for the analytics dashboard header."""
    start, end = _get_date_range(period)

    sales = db.query(Sale).filter(Sale.status == SaleStatus.completed).all()
    period_sales = [s for s in sales if s.created_at and start <= s.created_at.date() <= end]

    # Previous period for comparison
    period_days = (end - start).days + 1
    prev_start = start - timedelta(days=period_days)
    prev_end = start - timedelta(days=1)
    prev_sales = [s for s in sales if s.created_at and prev_start <= s.created_at.date() <= prev_end]

    current_revenue = sum(float(s.total_amount or 0) for s in period_sales)
    prev_revenue = sum(float(s.total_amount or 0) for s in prev_sales)
    current_profit = sum(float(s.profit or 0) for s in period_sales)
    prev_profit = sum(float(s.profit or 0) for s in prev_sales)

    def calc_trend(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)

    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()

    return {
        "revenue": _money(current_revenue),
        "revenue_trend": calc_trend(current_revenue, prev_revenue),
        "profit": _money(current_profit),
        "profit_trend": calc_trend(current_profit, prev_profit),
        "orders": len(period_sales),
        "orders_trend": calc_trend(len(period_sales), len(prev_sales)),
        "avg_order": _money(current_revenue / len(period_sales)) if period_sales else 0,
        "total_products": total_products,
        "total_customers": total_customers,
    }
