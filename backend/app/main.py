import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.config import ENVIRONMENT
from backend.app.database import engine, Base, SessionLocal
from backend.app.generator import SyntheticDataGenerator

from backend.app.routes.dashboard import router as dashboard_router
from backend.app.routes.sources import router as sources_router
from backend.app.routes.cdc import router as cdc_router
from backend.app.routes.pipeline import router as pipeline_router
from backend.app.routes.warehouse import router as warehouse_router
from backend.app.routes.analytics import router as analytics_router
from backend.app.routes.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed Database with Realistic Synthetic Data if empty
    db: Session = SessionLocal()
    try:
        SyntheticDataGenerator.generate_all(
            db=db,
            customer_count=1000,
            transaction_count=5000,
            sample_cdc_delta=40
        )
    finally:
        db.close()

    yield

app = FastAPI(
    title="Banking Customer Transaction Data Warehouse CDC-ETL Engine",
    description="ETL/ELT Pipeline Optimization for Heterogeneous Sources via Change Data Capture (CDC) Based Incremental ETL",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration supporting deployed frontend, Render domains, and local development
cors_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if cors_origins_env and cors_origins_env != "*":
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"https://.*\.onrender\.com",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_origin_regex=r"https://.*\.onrender\.com",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register API Routers
app.include_router(dashboard_router)
app.include_router(sources_router)
app.include_router(cdc_router)
app.include_router(pipeline_router)
app.include_router(warehouse_router)
app.include_router(analytics_router)
app.include_router(reports_router)

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "service": "Banking Customer Transaction Data Warehouse CDC-ETL Engine",
        "version": "2.0.0",
        "documentation": "/docs",
        "health": "/health",
        "endpoints": {
            "dashboard_stats": "/api/dashboard/stats",
            "dashboard_charts": "/api/dashboard/charts",
            "cdc_events": "/api/cdc/events",
            "pipeline_runs": "/api/pipeline/runs",
            "warehouse_tables": "/api/warehouse/tables",
            "analytics_segmentation": "/api/analytics/segmentation"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Banking_CDC_Warehouse_Pipeline",
        "environment": ENVIRONMENT
    }

@app.get("/api/info")
def system_info():
    return {
        "project": "ETL/ELT Pipeline Optimization for Heterogeneous Sources via CDC Based Incremental ETL",
        "domain": "Banking Customer Transaction Warehousing Systems",
        "architecture": "Kimball Star Schema with Staging and CDC Stream Log",
        "version": "2.0.0",
        "cdc_mode": "Log and Timestamp Trigger Emulation with Idempotent Hashing",
        "scd_strategy": "SCD Type 2 for Customer Dimension, SCD Type 1 for Accounts"
    }
