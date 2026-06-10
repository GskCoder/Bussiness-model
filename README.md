# RetailERP Lite

> Complete GST Billing, Inventory, Customer & Sales Management System for Small Businesses

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Features

- **JWT Authentication** — Default admin account, admin creates staff, role-based access
- **Product Management** — CRUD with categories, barcode, HSN codes, GST rates (0/5/12/18/28%)
- **Customer Management** — State-based GST determination (CGST/SGST vs IGST)
- **POS-Style Billing** — Search products, build cart, live GST calculation
- **GST Engine** — Automatic CGST/SGST (intra-state) or IGST (inter-state)
- **PDF Invoices** — ReportLab-generated A4 invoices with QR codes
- **Payment Tracking** — Cash, UPI, Card, Credit with due dates
- **Credit Sales** — Track amount paid, amount due, record partial payments
- **Stock Ledger** — Every stock movement tracked (SALE, RETURN, PURCHASE, MANUAL)
- **Audit Trail** — Who did what, when, with old/new value snapshots
- **Shop Settings** — Editable from UI (name, address, GSTIN, state)

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | React 19, Tailwind CSS 4, Recharts, Lucide Icons |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Auth | JWT (python-jose), bcrypt |
| Database | SQLite (dev), PostgreSQL (prod) |
| PDF | ReportLab + qrcode |
| Deployment | Docker (Phase 4) |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Default Login
- **Username:** `admin`
- **Password:** `admin123`
- You will be prompted to change the password on first login.

## API Endpoints

| Module | Prefix | Key Endpoints |
|:-------|:-------|:-------------|
| Auth | `/api/auth` | `POST /login`, `POST /staff`, `GET /users` |
| Settings | `/api/settings` | `GET`, `PUT` |
| Products | `/api/products` | CRUD, `/categories`, `/low-stock` |
| Customers | `/api/customers` | CRUD, search |
| Inventory | `/api/inventory` | `/{id}/ledger`, `/adjust` |
| Sales | `/api/sales` | `POST`, `/{id}/return`, `/{id}/payment`, `/credit-pending` |
| Invoices | `/api/invoices` | `GET`, `/{sale_id}/pdf` |
| Audit | `/api/audit-logs` | `GET` (admin) |

## Project Structure

```
Papa_project/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/           # config, database, security, dependencies
│   │   ├── auth/           # User model, JWT auth, staff management
│   │   ├── settings/       # Shop settings (singleton DB table)
│   │   ├── audit/          # Audit log tracking
│   │   ├── products/       # Products + Categories
│   │   ├── customers/      # Customer CRM
│   │   ├── inventory/      # Stock ledger (every movement)
│   │   ├── sales/          # Sales + GST engine + payments
│   │   └── invoices/       # PDF generation + QR codes
│   ├── requirements.txt
│   └── seed.py
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, DataTable, Modal, StatsCard
│   │   ├── pages/          # Dashboard, Products, Customers, NewSale, Sales...
│   │   ├── context/        # AuthContext
│   │   ├── utils/          # GST calculator, formatters
│   │   └── api/            # Axios instance
│   └── ...
└── README.md
```

## License

MIT
