from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.database import get_db
from backend.app.models import CDCChangeLog
from backend.app.cdc_engine import CDCEngine

router = APIRouter(prefix="/api/cdc", tags=["Change Data Capture (CDC)"])

class SimulateEventsRequest(BaseModel):
    insert_count: int = 25
    update_count: int = 15
    delete_count: int = 5

@router.get("/events")
def get_cdc_events(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=200),
    operation: Optional[str] = None,
    table_name: Optional[str] = None,
    is_processed: Optional[bool] = None
):
    """
    Fetch paginated CDC events from cdc_change_log with real-time state and payloads.
    """
    query = db.query(CDCChangeLog)

    if operation:
        query = query.filter(CDCChangeLog.operation == operation.upper())
    if table_name:
        query = query.filter(CDCChangeLog.table_name.ilike(f"%{table_name}%"))
    if is_processed is not None:
        query = query.filter(CDCChangeLog.is_processed == is_processed)

    total_records = query.count()
    events = query.order_by(desc(CDCChangeLog.captured_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "page": page,
        "limit": limit,
        "total_records": total_records,
        "total_pages": (total_records + limit - 1) // limit,
        "events": [
            {
                "change_id": e.change_id,
                "table_name": e.table_name,
                "record_id": e.record_id,
                "operation": e.operation,
                "old_data": e.old_data,
                "new_data": e.new_data,
                "captured_at": e.captured_at.isoformat() if e.captured_at else None,
                "is_processed": e.is_processed,
                "processed_at": e.processed_at.isoformat() if e.processed_at else None,
                "batch_id": e.batch_id,
                "checksum": e.checksum
            }
            for e in events
        ]
    }

@router.post("/simulate")
def simulate_cdc_stream(
    payload: SimulateEventsRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates operational OLTP banking events:
    - INSERTS: New transactions & accounts
    - UPDATES: Customer profiles, addresses, KYC verification, tiers
    - DELETES: Soft-deleted/closed accounts
    All changes are logged idempotently into cdc_change_log.
    """
    try:
        result = CDCEngine.simulate_events(
            db=db,
            insert_count=payload.insert_count,
            update_count=payload.update_count,
            delete_count=payload.delete_count
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CDC Simulation failed: {str(e)}")

@router.get("/metrics")
def get_cdc_metrics(db: Session = Depends(get_db)):
    """
    Returns CDC operational telemetry: total captured events, operation breakdown,
    processed vs pending backlog, and idempotency status.
    """
    total = db.query(func.count(CDCChangeLog.change_id)).scalar() or 0
    pending = db.query(func.count(CDCChangeLog.change_id)).filter(CDCChangeLog.is_processed == False).scalar() or 0
    processed = db.query(func.count(CDCChangeLog.change_id)).filter(CDCChangeLog.is_processed == True).scalar() or 0

    op_counts = db.query(
        CDCChangeLog.operation,
        func.count(CDCChangeLog.change_id).label("count")
    ).group_by(CDCChangeLog.operation).all()

    tables = db.query(
        CDCChangeLog.table_name,
        func.count(CDCChangeLog.change_id).label("count")
    ).group_by(CDCChangeLog.table_name).all()

    return {
        "total_events": total,
        "pending_events": pending,
        "processed_events": processed,
        "operations": {o.operation: o.count for o in op_counts},
        "tables": {t.table_name: t.count for t in tables}
    }
