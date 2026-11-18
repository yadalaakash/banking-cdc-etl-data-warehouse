-- ============================================================================
-- BANKING CUSTOMER TRANSACTION DATA WAREHOUSE (POSTGRESQL STAR SCHEMA DDL)
-- Project: ETL/ELT Pipeline Optimization for Heterogeneous Sources via CDC
-- ============================================================================

-- 1. Create Staging Tables
CREATE TABLE IF NOT EXISTS stg_customers (
    stg_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    gender VARCHAR(20),
    segment VARCHAR(50),
    kyc_status VARCHAR(30),
    risk_score INT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    source_format VARCHAR(30),
    operation_type VARCHAR(20) DEFAULT 'INSERT',
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stg_transactions (
    stg_id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100),
    account_id VARCHAR(100),
    customer_id VARCHAR(100),
    branch_id VARCHAR(100),
    transaction_type VARCHAR(50),
    channel VARCHAR(50),
    amount NUMERIC(15, 2),
    balance_after NUMERIC(15, 2),
    is_credit BOOLEAN,
    is_debit BOOLEAN,
    status VARCHAR(30),
    transaction_timestamp VARCHAR(100),
    source_format VARCHAR(30),
    operation_type VARCHAR(20) DEFAULT 'INSERT',
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Dimension Tables

CREATE TABLE IF NOT EXISTS dim_date (
    date_key INT PRIMARY KEY,
    full_date DATE NOT NULL UNIQUE,
    day_of_week INT NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    day_of_month INT NOT NULL,
    month INT NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    quarter INT NOT NULL,
    year INT NOT NULL,
    is_weekend BOOLEAN DEFAULT FALSE,
    is_holiday BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS dim_branch (
    branch_key SERIAL PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL UNIQUE,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(30) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    manager_name VARCHAR(100),
    dw_loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dim_customer (
    customer_key SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    gender VARCHAR(20),
    segment VARCHAR(50) NOT NULL, -- Retail, SME, Corporate, HNW
    kyc_status VARCHAR(30) NOT NULL, -- Verified, Pending, Suspended
    risk_score INT DEFAULT 25,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'United States',
    
    -- SCD Type 2 Attributes
    scd_start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scd_end_date TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    dw_loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dim_cust_lookup ON dim_customer(customer_id, is_current);

CREATE TABLE IF NOT EXISTS dim_account (
    account_key SERIAL PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    branch_id VARCHAR(50) NOT NULL,
    opened_date DATE NOT NULL,
    dw_loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dim_acc_lookup ON dim_account(account_id);

-- 3. Create Fact Table (Kimball Star Schema Core)

CREATE TABLE IF NOT EXISTS fact_transactions (
    fact_id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- Foreign Keys
    date_key INT NOT NULL REFERENCES dim_date(date_key),
    customer_key INT NOT NULL REFERENCES dim_customer(customer_key),
    account_key INT NOT NULL REFERENCES dim_account(account_key),
    branch_key INT NOT NULL REFERENCES dim_branch(branch_key),
    
    -- Measures and Attributes
    transaction_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    is_credit BOOLEAN DEFAULT FALSE,
    is_debit BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'Completed',
    fraud_flag BOOLEAN DEFAULT FALSE,
    anomaly_score NUMERIC(5, 2) DEFAULT 0.05,
    cdc_operation VARCHAR(20) DEFAULT 'INSERT',
    dw_loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fact_date ON fact_transactions(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_cust ON fact_transactions(customer_key);
CREATE INDEX IF NOT EXISTS idx_fact_acc ON fact_transactions(account_key);
CREATE INDEX IF NOT EXISTS idx_fact_branch ON fact_transactions(branch_key);
CREATE INDEX IF NOT EXISTS idx_fact_type ON fact_transactions(transaction_type);

-- 4. Pipeline Metadata & Audit Log Tables

CREATE TABLE IF NOT EXISTS cdc_change_log (
    change_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data TEXT,
    new_data TEXT,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    batch_id VARCHAR(100),
    checksum VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS idx_cdc_pending ON cdc_change_log(is_processed, captured_at);
CREATE INDEX IF NOT EXISTS idx_cdc_checksum ON cdc_change_log(checksum);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id VARCHAR(50) PRIMARY KEY,
    pipeline_name VARCHAR(100) DEFAULT 'Banking_Incremental_CDC_Pipeline',
    run_type VARCHAR(30) NOT NULL, -- FULL or INCREMENTAL
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_ms NUMERIC(10, 2) DEFAULT 0.0,
    records_extracted INT DEFAULT 0,
    records_transformed INT DEFAULT 0,
    records_loaded INT DEFAULT 0,
    inserts_count INT DEFAULT 0,
    updates_count INT DEFAULT 0,
    deletes_count INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'RUNNING',
    error_message TEXT,
    source_type VARCHAR(50) DEFAULT 'Heterogeneous',
    throughput_rps NUMERIC(10, 2) DEFAULT 0.0,
    memory_mb NUMERIC(10, 2) DEFAULT 0.0,
    time_saved_percent NUMERIC(5, 2) DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS pipeline_watermarks (
    source_name VARCHAR(100) PRIMARY KEY,
    last_watermark_timestamp TIMESTAMP NOT NULL,
    last_record_id VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
