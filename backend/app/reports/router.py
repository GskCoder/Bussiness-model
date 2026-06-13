"""Reports API router — JSON data, Excel download, PDF download."""

from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.auth.models import User
from app.settings.service import get_settings
from app.reports import service

router = APIRouter(prefix="/reports", tags=["Reports"])


def _parse_dates(start: str | None, end: str | None) -> tuple[date, date]:
    """Parse date strings or default to current month."""
    if start:
        start_date = date.fromisoformat(start)
    else:
        today = date.today()
        start_date = today.replace(day=1)

    if end:
        end_date = date.fromisoformat(end)
    else:
        end_date = date.today()

    return start_date, end_date


# ---- JSON Endpoints ----

@router.get("/sales")
def sales_report(
    start: str = Query(None, description="Start date (YYYY-MM-DD)"),
    end: str = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = _parse_dates(start, end)
    return service.sales_report(db, start_date, end_date)


@router.get("/inventory")
def inventory_report(
    stock_filter: str = Query("all", description="all|low|out"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.inventory_report(db, stock_filter)


@router.get("/gst")
def gst_report(
    start: str = Query(None),
    end: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = _parse_dates(start, end)
    return service.gst_report(db, start_date, end_date)


@router.get("/customers")
def customer_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.customer_report(db)


@router.get("/profit-loss")
def profit_loss_report(
    start: str = Query(None),
    end: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = _parse_dates(start, end)
    return service.profit_loss_report(db, start_date, end_date)


# ---- Excel Export ----

@router.get("/export/excel/{report_type}")
def export_excel(
    report_type: str,
    start: str = Query(None),
    end: str = Query(None),
    stock_filter: str = Query("all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download report as Excel file."""
    start_date, end_date = _parse_dates(start, end)

    if report_type == "sales":
        data = service.sales_report(db, start_date, end_date)
    elif report_type == "inventory":
        data = service.inventory_report(db, stock_filter)
    elif report_type == "gst":
        data = service.gst_report(db, start_date, end_date)
    elif report_type == "customers":
        data = service.customer_report(db)
    elif report_type == "profit_loss":
        data = service.profit_loss_report(db, start_date, end_date)
    else:
        return {"error": "Invalid report type"}

    buffer = service.generate_excel(data)
    filename = f"{report_type}_report_{date.today().isoformat()}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---- PDF Export ----

@router.get("/export/pdf/{report_type}")
def export_pdf(
    report_type: str,
    start: str = Query(None),
    end: str = Query(None),
    stock_filter: str = Query("all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download report as PDF file."""
    start_date, end_date = _parse_dates(start, end)
    shop = get_settings(db)

    if report_type == "sales":
        data = service.sales_report(db, start_date, end_date)
    elif report_type == "inventory":
        data = service.inventory_report(db, stock_filter)
    elif report_type == "gst":
        data = service.gst_report(db, start_date, end_date)
    elif report_type == "customers":
        data = service.customer_report(db)
    elif report_type == "profit_loss":
        data = service.profit_loss_report(db, start_date, end_date)
    else:
        return {"error": "Invalid report type"}

    buffer = service.generate_report_pdf(data, shop)
    filename = f"{report_type}_report_{date.today().isoformat()}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
