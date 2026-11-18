import os
import shutil
import json
import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.config import UPLOAD_DIR, RAW_DIR
from backend.app.models import (
    SourceCustomer, SourceAccount, SourceTransaction,
    StgCustomer, StgTransaction, CDCChangeLog
)
from backend.app.etl_pipeline import ETLPipeline

router = APIRouter(prefix="/api/sources", tags=["Data Sources"])

@router.get("/status")
def get_sources_status(db: Session = Depends(get_db)):
    """
    Returns connection and data status for all supported heterogeneous sources:
    PostgreSQL/OLTP Relational, CSV Batch, JSON API Stream, and Excel Loan/Credit.
    """
    total_cust = db.query(func.count(SourceCustomer.customer_id)).scalar() or 0
    total_acc = db.query(func.count(SourceAccount.account_id)).scalar() or 0
    total_tx = db.query(func.count(SourceTransaction.transaction_id)).scalar() or 0
    
    stg_cust = db.query(func.count(StgCustomer.stg_id)).scalar() or 0
    stg_tx = db.query(func.count(StgTransaction.stg_id)).scalar() or 0

    sources = [
        {
            "id": "src_relational_oltp",
            "name": "Core Banking OLTP (PostgreSQL / Relational)",
            "type": "Database / WAL CDC",
            "format": "SQL / Relational",
            "status": "ONLINE",
            "sync_mode": "Trigger & Change Log CDC",
            "record_count": total_tx,
            "last_active": "Real-time"
        },
        {
            "id": "src_atm_csv",
            "name": "ATM Network Batch Terminal",
            "type": "File System Batch",
            "format": "CSV",
            "status": "READY",
            "sync_mode": "Scheduled / Watermark Ingestion",
            "record_count": stg_tx,
            "last_active": "Hourly"
        },
        {
            "id": "src_mobile_json",
            "name": "Mobile & Digital Banking API",
            "type": "REST API Stream",
            "format": "JSON",
            "status": "READY",
            "sync_mode": "Event-driven CDC Watermark",
            "record_count": total_cust,
            "last_active": "Near Real-Time"
        },
        {
            "id": "src_credit_excel",
            "name": "External Credit & Loan Partner",
            "type": "External Spreadsheet Ingestion",
            "format": "Excel (.xlsx)",
            "status": "READY",
            "sync_mode": "Periodic Delta Load",
            "record_count": stg_cust,
            "last_active": "Daily"
        }
    ]

    return {
        "sources": sources,
        "staging_counts": {
            "stg_customers": stg_cust,
            "stg_transactions": stg_tx
        }
    }

@router.post("/upload")
async def upload_source_file(
    file: UploadFile = File(...),
    entity_type: str = Form("customers"), # customers or transactions
    db: Session = Depends(get_db)
):
    """
    Upload and ingest heterogeneous files (CSV, JSON, Excel) into Staging tables
    and register corresponding CDC events for incremental processing.
    """
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["csv", "json", "xlsx", "xls"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, JSON, or Excel (.xlsx, .xls) files.")

    saved_path = os.path.join(UPLOAD_DIR, filename)
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = ETLPipeline.ingest_heterogeneous_source(
            db=db,
            file_path=saved_path,
            format_type=ext,
            entity_type=entity_type
        )
        return {
            "success": True,
            "filename": filename,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.get("/generate-sample-files")
def generate_sample_files():
    """
    Creates ready-to-test sample CSV, JSON, and Excel files in data/raw
    for immediate demonstration of heterogeneous file uploads.
    """
    raw_path = str(RAW_DIR)
    os.makedirs(raw_path, exist_ok=True)

    # 1. Sample Customers CSV
    cust_csv_data = [
        {"customer_id": "CUST90001", "first_name": "Alexander", "last_name": "Hamilton", "email": "a.hamilton@treasury.gov", "phone": "+1-212-555-0199", "segment": "HNW", "kyc_status": "Verified", "risk_score": 15, "city": "New York", "state": "NY", "country": "United States"},
        {"customer_id": "CUST90002", "first_name": "Eleanor", "last_name": "Vance", "email": "e.vance@techcorp.io", "phone": "+1-415-555-0144", "segment": "Corporate", "kyc_status": "Verified", "risk_score": 22, "city": "San Francisco", "state": "CA", "country": "United States"},
        {"customer_id": "CUST90003", "first_name": "Marcus", "last_name": "Sterling", "email": "m.sterling@retailnet.com", "phone": "+1-312-555-0188", "segment": "SME", "kyc_status": "Pending Review", "risk_score": 45, "city": "Chicago", "state": "IL", "country": "United States"}
    ]
    csv_file = os.path.join(raw_path, "sample_customers.csv")
    pd.DataFrame(cust_csv_data).to_csv(csv_file, index=False)

    # 2. Sample Transactions JSON
    tx_json_data = [
        {"transaction_id": "TXN_EXT_7001", "account_id": "ACC000001", "customer_id": "CUST00001", "branch_id": "BR001", "transaction_type": "Deposit", "channel": "Mobile Banking", "amount": 3500.00, "balance_after": 28500.00, "is_credit": True, "is_debit": False},
        {"transaction_id": "TXN_EXT_7002", "account_id": "ACC000002", "customer_id": "CUST00002", "branch_id": "BR002", "transaction_type": "Transfer", "channel": "Wire", "amount": 12500.00, "balance_after": 45200.00, "is_credit": False, "is_debit": True},
        {"transaction_id": "TXN_EXT_7003", "account_id": "ACC000003", "customer_id": "CUST00003", "branch_id": "BR003", "transaction_type": "Card Payment", "channel": "Online Banking", "amount": 189.50, "balance_after": 5120.50, "is_credit": False, "is_debit": True}
    ]
    json_file = os.path.join(raw_path, "sample_transactions.json")
    with open(json_file, "w") as f:
        json.dump(tx_json_data, f, indent=2)

    # 3. Sample Customers Excel
    excel_file = os.path.join(raw_path, "sample_customers.xlsx")
    pd.DataFrame(cust_csv_data).to_excel(excel_file, index=False)

    return {
        "status": "SUCCESS",
        "message": "Sample CSV, JSON, and Excel files created in data/raw",
        "files": [
            {"filename": "sample_customers.csv", "type": "CSV", "entity": "customers", "path": csv_file},
            {"filename": "sample_transactions.json", "type": "JSON", "entity": "transactions", "path": json_file},
            {"filename": "sample_customers.xlsx", "type": "Excel", "entity": "customers", "path": excel_file}
        ]
    }

@router.get("/download-sample/{filename}")
def download_sample_file(filename: str):
    """
    Download sample template file for testing uploads.
    """
    file_path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(file_path):
        # generate first
        generate_sample_files()
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename)
