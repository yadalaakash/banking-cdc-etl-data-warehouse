import io
import datetime
import pandas as pd
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import FactTransactions, DimCustomer, DimAccount, CDCChangeLog, PipelineRun

router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])

@router.get("/transactions")
def get_transaction_report(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    transaction_type: Optional[str] = None,
    channel: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Paginated banking transaction report with customer details and channel info.
    """
    query = db.query(
        FactTransactions.transaction_id,
        FactTransactions.amount,
        FactTransactions.balance_after,
        FactTransactions.transaction_type,
        FactTransactions.channel,
        FactTransactions.is_credit,
        FactTransactions.is_debit,
        FactTransactions.status,
        FactTransactions.fraud_flag,
        FactTransactions.dw_loaded_at,
        DimCustomer.customer_id,
        DimCustomer.full_name.label("customer_name"),
        DimCustomer.segment
    ).join(DimCustomer, FactTransactions.customer_key == DimCustomer.customer_key)

    if transaction_type:
        query = query.filter(FactTransactions.transaction_type == transaction_type)
    if channel:
        query = query.filter(FactTransactions.channel == channel)

    total = query.count()
    rows = query.order_by(desc(FactTransactions.fact_id)).offset((page - 1) * limit).limit(limit).all()

    return {
        "page": page,
        "limit": limit,
        "total_records": total,
        "total_pages": (total + limit - 1) // limit,
        "data": [
            {
                "transaction_id": r.transaction_id,
                "customer_id": r.customer_id,
                "customer_name": r.customer_name,
                "segment": r.segment,
                "amount": round(float(r.amount), 2),
                "balance_after": round(float(r.balance_after), 2),
                "type": r.transaction_type,
                "channel": r.channel,
                "direction": "Credit" if r.is_credit else "Debit",
                "status": r.status,
                "fraud_flag": r.fraud_flag,
                "loaded_at": r.dw_loaded_at.isoformat() if r.dw_loaded_at else None
            }
            for r in rows
        ]
    }

@router.get("/customers")
def get_customer_report(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    segment: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Customer activity and KYC status report.
    """
    query = db.query(DimCustomer).filter(DimCustomer.is_current == True)
    if segment:
        query = query.filter(DimCustomer.segment == segment)

    total = query.count()
    rows = query.order_by(DimCustomer.customer_id.asc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "page": page,
        "limit": limit,
        "total_records": total,
        "total_pages": (total + limit - 1) // limit,
        "data": [
            {
                "customer_id": c.customer_id,
                "name": c.full_name,
                "email": c.email,
                "phone": c.phone,
                "segment": c.segment,
                "kyc_status": c.kyc_status,
                "risk_score": c.risk_score,
                "city": c.city,
                "state": c.state,
                "version": c.version
            }
            for c in rows
        ]
    }

@router.get("/export")
def export_report_file(
    report_type: str = Query("transactions"), # transactions, customers, cdc, pipeline
    export_format: str = Query("csv"), # csv or xlsx
    db: Session = Depends(get_db)
):
    """
    Exports full analytical reports directly into CSV or Excel (.xlsx) file stream.
    """
    report_type = report_type.lower()
    export_format = export_format.lower()

    if report_type == "transactions":
        rows = db.query(
            FactTransactions.transaction_id,
            DimCustomer.customer_id,
            DimCustomer.full_name.label("customer_name"),
            DimCustomer.segment,
            FactTransactions.transaction_type,
            FactTransactions.channel,
            FactTransactions.amount,
            FactTransactions.balance_after,
            FactTransactions.is_credit,
            FactTransactions.status,
            FactTransactions.fraud_flag,
            FactTransactions.dw_loaded_at
        ).join(
            DimCustomer, FactTransactions.customer_key == DimCustomer.customer_key
        ).limit(5000).all()
        df = pd.DataFrame(rows)

    elif report_type == "customers":
        rows = db.query(
            DimCustomer.customer_id,
            DimCustomer.full_name,
            DimCustomer.email,
            DimCustomer.phone,
            DimCustomer.segment,
            DimCustomer.kyc_status,
            DimCustomer.risk_score,
            DimCustomer.city,
            DimCustomer.state,
            DimCustomer.version,
            DimCustomer.is_current
        ).filter(DimCustomer.is_current == True).limit(5000).all()
        df = pd.DataFrame(rows)

    elif report_type == "cdc":
        rows = db.query(
            CDCChangeLog.change_id,
            CDCChangeLog.table_name,
            CDCChangeLog.record_id,
            CDCChangeLog.operation,
            CDCChangeLog.captured_at,
            CDCChangeLog.is_processed,
            CDCChangeLog.processed_at,
            CDCChangeLog.batch_id
        ).limit(5000).all()
        df = pd.DataFrame(rows)

    elif report_type == "pipeline":
        rows = db.query(
            PipelineRun.run_id,
            PipelineRun.pipeline_name,
            PipelineRun.run_type,
            PipelineRun.start_time,
            PipelineRun.end_time,
            PipelineRun.duration_ms,
            PipelineRun.records_extracted,
            PipelineRun.records_loaded,
            PipelineRun.inserts_count,
            PipelineRun.updates_count,
            PipelineRun.deletes_count,
            PipelineRun.status,
            PipelineRun.throughput_rps,
            PipelineRun.time_saved_percent
        ).limit(1000).all()
        df = pd.DataFrame(rows)
    else:
        raise HTTPException(status_code=400, detail="Invalid report type.")

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    base_name = f"{report_type}_report_{timestamp}"

    if export_format == "csv":
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        return Response(
            content=csv_buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={base_name}.csv"}
        )
    elif export_format in ["xlsx", "excel"]:
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name=report_type.capitalize(), index=False)
        excel_buffer.seek(0)
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={base_name}.xlsx"}
        )
    else:
        raise HTTPException(status_code=400, detail="Export format must be csv or xlsx.")
