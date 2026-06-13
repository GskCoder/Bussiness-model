"""Backup/Restore API router."""

import json
from fastapi import APIRouter, Depends, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date

from app.core.dependencies import get_db, require_admin
from app.auth.models import User
from app.backup import service

router = APIRouter(prefix="/backup", tags=["Backup"])


@router.get("/export/json")
def export_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Export all data as JSON."""
    buffer = service.export_json(db)
    filename = f"retailerp_backup_{date.today().isoformat()}.json"
    return StreamingResponse(
        buffer,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Export all data as Excel (multi-sheet)."""
    buffer = service.export_excel(db)
    filename = f"retailerp_backup_{date.today().isoformat()}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/csv/{table_name}")
def export_csv(
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Export a single table as CSV."""
    try:
        buffer = service.export_csv(db, table_name)
    except ValueError as e:
        return {"error": str(e)}

    filename = f"{table_name}_{date.today().isoformat()}.csv"
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/import/json")
async def import_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Import data from a JSON backup file."""
    content = await file.read()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON file"}

    result = service.import_json(db, data)
    return result
