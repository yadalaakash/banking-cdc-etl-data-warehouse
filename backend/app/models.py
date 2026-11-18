import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

# ==========================================
# 1. OPERATIONAL / SOURCE TABLES (OLTP)
# ==========================================

class SourceCustomer(Base):
    __tablename__ = "source_customers"

    customer_id = Column(String(50), primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    segment = Column(String(50), default="Retail") # Retail, SME, Corporate, HNW
    kyc_status = Column(String(30), default="Verified") # Verified, Pending, Suspended
    risk_score = Column(Integer, default=25) # 1 - 100
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="United States")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, index=True)
    is_deleted = Column(Boolean, default=False)


class SourceAccount(Base):
    __tablename__ = "source_accounts"

    account_id = Column(String(50), primary_key=True, index=True)
    customer_id = Column(String(50), ForeignKey("source_customers.customer_id"), nullable=False, index=True)
    account_number = Column(String(50), unique=True, nullable=False)
    account_type = Column(String(50), default="Savings") # Savings, Checking, Fixed Deposit, Loan, Credit
    status = Column(String(30), default="Active") # Active, Dormant, Frozen, Closed
    balance = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    branch_id = Column(String(50), nullable=False)
    opened_date = Column(Date, default=datetime.date.today)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, index=True)
    is_deleted = Column(Boolean, default=False)


class SourceBranch(Base):
    __tablename__ = "source_branches"

    branch_id = Column(String(50), primary_key=True, index=True)
    branch_name = Column(String(100), nullable=False)
    branch_code = Column(String(30), unique=True, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    region = Column(String(50), nullable=False)
    manager_name = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class SourceTransaction(Base):
    __tablename__ = "source_transactions"

    transaction_id = Column(String(50), primary_key=True, index=True)
    account_id = Column(String(50), ForeignKey("source_accounts.account_id"), nullable=False, index=True)
    customer_id = Column(String(50), nullable=False, index=True)
    branch_id = Column(String(50), nullable=False)
    transaction_type = Column(String(50), nullable=False) # Deposit, Withdrawal, Transfer, Card Payment, Loan Repayment, Fee
    channel = Column(String(50), default="Online Banking") # ATM, Mobile Banking, Online Banking, Branch POS, Wire
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    is_credit = Column(Boolean, default=False)
    is_debit = Column(Boolean, default=True)
    status = Column(String(30), default="Completed") # Completed, Pending, Flagged, Failed
    transaction_timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_deleted = Column(Boolean, default=False)


# ==========================================
# 2. CHANGE DATA CAPTURE (CDC) LOG
# ==========================================

class CDCChangeLog(Base):
    __tablename__ = "cdc_change_log"

    change_id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(String(100), nullable=False, index=True)
    operation = Column(String(20), nullable=False, index=True) # INSERT, UPDATE, DELETE
    old_data = Column(Text, nullable=True) # JSON snapshot
    new_data = Column(Text, nullable=True) # JSON snapshot
    captured_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    is_processed = Column(Boolean, default=False, index=True)
    processed_at = Column(DateTime, nullable=True)
    batch_id = Column(String(100), nullable=True)
    checksum = Column(String(64), nullable=True, index=True) # SHA256 idempotency hash


# ==========================================
# 3. STAGING TABLES (ELT Raw Ingestion)
# ==========================================

class StgCustomer(Base):
    __tablename__ = "stg_customers"

    stg_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(100))
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(150))
    phone = Column(String(50))
    gender = Column(String(20))
    segment = Column(String(50))
    kyc_status = Column(String(30))
    risk_score = Column(Integer)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    source_format = Column(String(30)) # CSV, JSON, EXCEL, DB
    operation_type = Column(String(20), default="INSERT")
    ingested_at = Column(DateTime, default=datetime.datetime.utcnow)


class StgTransaction(Base):
    __tablename__ = "stg_transactions"

    stg_id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(100))
    account_id = Column(String(100))
    customer_id = Column(String(100))
    branch_id = Column(String(100))
    transaction_type = Column(String(50))
    channel = Column(String(50))
    amount = Column(Float)
    balance_after = Column(Float)
    is_credit = Column(Boolean)
    is_debit = Column(Boolean)
    status = Column(String(30))
    transaction_timestamp = Column(String(100))
    source_format = Column(String(30))
    operation_type = Column(String(20), default="INSERT")
    ingested_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==========================================
# 4. DIMENSIONAL DATA WAREHOUSE (STAR SCHEMA)
# ==========================================

class DimDate(Base):
    __tablename__ = "dim_date"

    date_key = Column(Integer, primary_key=True) # e.g. 20261118
    full_date = Column(Date, unique=True, nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False) # 1-7
    day_name = Column(String(20), nullable=False)
    day_of_month = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False) # 1-12
    month_name = Column(String(20), nullable=False)
    quarter = Column(Integer, nullable=False) # 1-4
    year = Column(Integer, nullable=False)
    is_weekend = Column(Boolean, default=False)
    is_holiday = Column(Boolean, default=False)


class DimBranch(Base):
    __tablename__ = "dim_branch"

    branch_key = Column(Integer, primary_key=True, autoincrement=True)
    branch_id = Column(String(50), unique=True, nullable=False, index=True) # Natural key
    branch_name = Column(String(100), nullable=False)
    branch_code = Column(String(30), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    region = Column(String(50), nullable=False)
    manager_name = Column(String(100), nullable=True)
    dw_loaded_at = Column(DateTime, default=datetime.datetime.utcnow)


class DimCustomer(Base):
    __tablename__ = "dim_customer"

    customer_key = Column(Integer, primary_key=True, autoincrement=True) # Surrogate Key
    customer_id = Column(String(50), nullable=False, index=True) # Natural Key
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    full_name = Column(String(200), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    segment = Column(String(50), nullable=False) # Retail, SME, Corporate, HNW
    kyc_status = Column(String(30), nullable=False)
    risk_score = Column(Integer, default=25)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="United States")
    
    # Slowly Changing Dimension (SCD Type 2) tracking
    scd_start_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    scd_end_date = Column(DateTime, nullable=True) # Null if current record
    is_current = Column(Boolean, default=True, index=True)
    version = Column(Integer, default=1)
    dw_loaded_at = Column(DateTime, default=datetime.datetime.utcnow)


class DimAccount(Base):
    __tablename__ = "dim_account"

    account_key = Column(Integer, primary_key=True, autoincrement=True) # Surrogate Key
    account_id = Column(String(50), nullable=False, index=True) # Natural Key
    customer_id = Column(String(50), nullable=False, index=True)
    account_number = Column(String(50), nullable=False)
    account_type = Column(String(50), nullable=False)
    status = Column(String(30), nullable=False)
    currency = Column(String(10), default="USD")
    branch_id = Column(String(50), nullable=False)
    opened_date = Column(Date, nullable=False)
    dw_loaded_at = Column(DateTime, default=datetime.datetime.utcnow)


class FactTransactions(Base):
    __tablename__ = "fact_transactions"

    fact_id = Column(Integer, primary_key=True, autoincrement=True) # Fact Surrogate Key
    transaction_id = Column(String(50), unique=True, nullable=False, index=True) # Degenerate Dim / Nat Key
    
    # Foreign Keys referencing Dimension Surrogate Keys
    date_key = Column(Integer, ForeignKey("dim_date.date_key"), nullable=False, index=True)
    customer_key = Column(Integer, ForeignKey("dim_customer.customer_key"), nullable=False, index=True)
    account_key = Column(Integer, ForeignKey("dim_account.account_key"), nullable=False, index=True)
    branch_key = Column(Integer, ForeignKey("dim_branch.branch_key"), nullable=False, index=True)

    # Dimensional attributes & measures
    transaction_type = Column(String(50), nullable=False, index=True)
    channel = Column(String(50), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    is_credit = Column(Boolean, default=False)
    is_debit = Column(Boolean, default=True)
    status = Column(String(30), default="Completed")
    fraud_flag = Column(Boolean, default=False, index=True)
    anomaly_score = Column(Float, default=0.0) # Statistical Z-score normalized
    cdc_operation = Column(String(20), default="INSERT")
    dw_loaded_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==========================================
# 5. PIPELINE AUDIT, METADATA & BENCHMARKING
# ==========================================

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    run_id = Column(String(50), primary_key=True)
    pipeline_name = Column(String(100), default="Banking_Incremental_CDC_Pipeline")
    run_type = Column(String(30), nullable=False) # FULL or INCREMENTAL
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_ms = Column(Float, default=0.0)
    records_extracted = Column(Integer, default=0)
    records_transformed = Column(Integer, default=0)
    records_loaded = Column(Integer, default=0)
    inserts_count = Column(Integer, default=0)
    updates_count = Column(Integer, default=0)
    deletes_count = Column(Integer, default=0)
    status = Column(String(30), default="RUNNING") # SUCCESS, FAILED, RUNNING
    error_message = Column(Text, nullable=True)
    source_type = Column(String(50), default="Heterogeneous")
    throughput_rps = Column(Float, default=0.0) # Records / second
    memory_mb = Column(Float, default=0.0)
    time_saved_percent = Column(Float, default=0.0)


class PipelineWatermark(Base):
    __tablename__ = "pipeline_watermarks"

    source_name = Column(String(100), primary_key=True)
    last_watermark_timestamp = Column(DateTime, nullable=False)
    last_record_id = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
