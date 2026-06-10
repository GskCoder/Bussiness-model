"""RetailERP Lite — FastAPI Backend Entry Point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables, SessionLocal
from app.auth.service import seed_default_admin
from app.settings.service import get_settings

# Import all routers
from app.auth.router import router as auth_router
from app.settings.router import router as settings_router
from app.audit.router import router as audit_router
from app.products.router import router as products_router
from app.customers.router import router as customers_router
from app.inventory.router import router as inventory_router
from app.sales.router import router as sales_router
from app.invoices.router import router as invoices_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables, seed admin, init settings."""
    create_tables()
    db = SessionLocal()
    try:
        seed_default_admin(db)
        get_settings(db)  # Creates default settings row
    finally:
        db.close()
    print("[OK] RetailERP Lite backend started!")
    yield
    print("[STOP] RetailERP Lite backend stopped.")


app = FastAPI(
    title="RetailERP Lite",
    description="Complete GST Billing, Inventory, Customer & Sales Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(invoices_router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "RetailERP Lite", "version": "1.0.0"}
