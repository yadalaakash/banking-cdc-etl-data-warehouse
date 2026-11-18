from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import PipelineRun
from backend.app.etl_pipeline import ETLPipeline
from backend.app.optimizer import PipelineOptimizer

router = APIRouter(prefix="/api/pipeline", tags=["ETL Pipeline & Optimization"])

class BenchmarkRequest(BaseModel):
    delta_events: int = 40

@router.post("/run-incremental")
def trigger_incremental_pipeline(
    batch_limit: int = 2000,
    db: Session = Depends(get_db)
):
    """
    Triggers CDC-based Incremental ETL Pipeline:
    Extracts delta records from CDC change log, transforms using SCD Type 2 and cleansing rules,
    and loads into the Data Warehouse Star Schema.
    """
    try:
        result = ETLPipeline.run_incremental_etl(db, batch_limit=batch_limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Incremental ETL failed: {str(e)}")

@router.post("/run-full")
def trigger_full_pipeline(db: Session = Depends(get_db)):
    """
    Triggers Full Warehouse Rebuild ETL:
    Extracts complete operational tables, rebuilds dimension and fact tables from scratch,
    and records execution performance metrics.
    """
    try:
        result = ETLPipeline.run_full_etl(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Full ETL failed: {str(e)}")

@router.post("/benchmark")
def run_pipeline_benchmark(
    payload: BenchmarkRequest,
    db: Session = Depends(get_db)
):
    """
    Executes a rigorous benchmark comparing Full ETL vs Incremental CDC ETL:
    Calculates execution duration, records processed, percentage time saved,
    and throughput speedup factor.
    """
    try:
        benchmark = PipelineOptimizer.run_benchmark_comparison(
            db,
            simulated_delta_events=payload.delta_events
        )
        return benchmark
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark execution failed: {str(e)}")

@router.get("/runs")
def get_pipeline_runs(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    run_type: Optional[str] = None
):
    """
    Retrieves pipeline run history with performance telemetry.
    """
    query = db.query(PipelineRun)
    if run_type:
        query = query.filter(PipelineRun.run_type == run_type.upper())

    total_records = query.count()
    runs = query.order_by(desc(PipelineRun.start_time)).offset((page - 1) * limit).limit(limit).all()

    return {
        "page": page,
        "limit": limit,
        "total_records": total_records,
        "total_pages": (total_records + limit - 1) // limit,
        "runs": [
            {
                "run_id": r.run_id,
                "pipeline_name": r.pipeline_name,
                "run_type": r.run_type,
                "start_time": r.start_time.isoformat() if r.start_time else None,
                "end_time": r.end_time.isoformat() if r.end_time else None,
                "duration_ms": r.duration_ms,
                "records_extracted": r.records_extracted,
                "records_transformed": r.records_transformed,
                "records_loaded": r.records_loaded,
                "inserts": r.inserts_count,
                "updates": r.updates_count,
                "deletes": r.deletes_count,
                "status": r.status,
                "error_message": r.error_message,
                "source_type": r.source_type,
                "throughput_rps": r.throughput_rps,
                "memory_mb": r.memory_mb,
                "time_saved_percent": r.time_saved_percent
            }
            for r in runs
        ]
    }

@router.get("/optimization-stats")
def get_optimization_stats(db: Session = Depends(get_db)):
    """
    Returns aggregated historical comparison statistics between Full and Incremental pipelines.
    """
    return PipelineOptimizer.get_performance_history(db)
