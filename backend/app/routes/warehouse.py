from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect

from backend.app.database import get_db, engine
from backend.app.models import (
    DimCustomer, DimAccount, DimBranch, DimDate, FactTransactions,
    StgCustomer, StgTransaction, CDCChangeLog, PipelineRun
)

router = APIRouter(prefix="/api/warehouse", tags=["Data Warehouse Star Schema"])

class QueryRequest(BaseModel):
    query: str
    limit: int = 50

STAR_SCHEMA_TABLES = [
    {
        "table_name": "fact_transactions",
        "display_name": "Fact_Transactions",
        "type": "FACT",
        "description": "Central fact table storing banking transaction events, measures, flags, and surrogate keys.",
        "grain": "One row per financial transaction event",
        "foreign_keys": ["date_key -> dim_date", "customer_key -> dim_customer", "account_key -> dim_account", "branch_key -> dim_branch"]
    },
    {
        "table_name": "dim_customer",
        "display_name": "Dim_Customer",
        "type": "DIMENSION (SCD Type 2)",
        "description": "Customer dimensional profile with versioning, validity intervals (scd_start_date, scd_end_date), and KYC tiers.",
        "grain": "One row per customer version",
        "foreign_keys": []
    },
    {
        "table_name": "dim_account",
        "display_name": "Dim_Account",
        "type": "DIMENSION",
        "description": "Banking accounts dimension (Savings, Checking, FD, Loan, Credit Card).",
        "grain": "One row per account",
        "foreign_keys": []
    },
    {
        "table_name": "dim_branch",
        "display_name": "Dim_Branch",
        "type": "DIMENSION",
        "description": "Geographical and organizational bank branch dimension.",
        "grain": "One row per physical or digital branch",
        "foreign_keys": []
    },
    {
        "table_name": "dim_date",
        "display_name": "Dim_Date",
        "type": "DIMENSION",
        "description": "Calendar date dimension enabling time-series rollups, quarter/year drilldowns, and holiday analysis.",
        "grain": "One row per calendar day",
        "foreign_keys": []
    },
    {
        "table_name": "stg_customers",
        "display_name": "Staging: Customers",
        "type": "STAGING",
        "description": "Landing table for heterogeneous incoming customer records.",
        "grain": "One row per raw record",
        "foreign_keys": []
    },
    {
        "table_name": "stg_transactions",
        "display_name": "Staging: Transactions",
        "type": "STAGING",
        "description": "Landing table for raw uploaded transaction batches.",
        "grain": "One row per raw record",
        "foreign_keys": []
    },
    {
        "table_name": "cdc_change_log",
        "display_name": "CDC Change Log",
        "type": "AUDIT / CDC",
        "description": "System-wide Change Data Capture transaction log tracking inserts, updates, and deletes with checksums.",
        "grain": "One row per captured operational mutation",
        "foreign_keys": []
    }
]

@router.get("/tables")
def get_warehouse_tables(db: Session = Depends(get_db)):
    """
    Returns star schema architecture metadata, table classifications, row counts, and column lists.
    """
    inspector = inspect(engine)
    available_tables = inspector.get_table_names()

    result = []
    for meta in STAR_SCHEMA_TABLES:
        t_name = meta["table_name"]
        if t_name in available_tables:
            columns_info = inspector.get_columns(t_name)
            count = db.execute(text(f"SELECT COUNT(*) FROM {t_name}")).scalar() or 0

            result.append({
                **meta,
                "row_count": count,
                "columns": [{"name": c["name"], "type": str(c["type"])} for c in columns_info]
            })

    return {"tables": result}

@router.get("/preview/{table_name}")
def preview_table_data(
    table_name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns paginated rows and column names for any star schema or staging table.
    """
    inspector = inspect(engine)
    available = inspector.get_table_names()
    if table_name not in available:
        raise HTTPException(status_code=404, detail=f"Table {table_name} not found in warehouse.")

    total = db.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar() or 0
    offset = (page - 1) * limit

    rows_proxy = db.execute(text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset"), {"limit": limit, "offset": offset})
    columns = list(rows_proxy.keys())
    data = [dict(zip(columns, row)) for row in rows_proxy.fetchall()]

    return {
        "table_name": table_name,
        "page": page,
        "limit": limit,
        "total_rows": total,
        "total_pages": (total + limit - 1) // limit,
        "columns": columns,
        "rows": data
    }

@router.post("/query")
def execute_safe_query(
    payload: QueryRequest,
    db: Session = Depends(get_db)
):
    """
    Allows executing safe analytical SELECT queries on the Data Warehouse.
    Blocks any DDL/DML mutations (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE).
    """
    sql = payload.query.strip()
    forbidden = ["insert", "update", "delete", "drop", "alter", "truncate", "create", "replace"]
    first_word = sql.split()[0].lower() if sql else ""

    if first_word != "select" or any(f in sql.lower().split() for f in forbidden):
        raise HTTPException(status_code=400, detail="Only analytical SELECT queries are permitted in the warehouse explorer.")

    try:
        # Enforce limit
        if "limit" not in sql.lower():
            sql += f" LIMIT {min(payload.limit, 100)}"

        res = db.execute(text(sql))
        columns = list(res.keys())
        rows = [dict(zip(columns, r)) for r in res.fetchmany(100)]

        return {
            "columns": columns,
            "rows": rows,
            "row_count": len(rows)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query error: {str(e)}")
