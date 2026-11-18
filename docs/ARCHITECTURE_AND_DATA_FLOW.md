# System Architecture & Data Flow Specification

## 1. Project Overview & Objective
**Title:** ETL/ELT Pipeline Optimization for Heterogeneous Sources via Change Data Capture (CDC) Based Incremental ETL, Applied to Banking Customer Transaction Warehousing Systems.

**Domain:** Data Engineering, Data Warehousing, Data Mining & Financial Analytics.

**Core Problem Statement:**
Traditional banking data warehouses employ scheduled batch Full Reload ETL pipelines that re-extract all historical data. In large transactional banking environments, this leads to:
1. Massive redundant disk I/O and network bandwidth consumption.
2. Long extraction windows that cannot complete within operational nightly batch intervals.
3. Lock contention on core transactional OLTP databases.
4. High warehouse data latency (T+1 day delay), preventing real-time fraud and liquidity monitoring.

**The Solution:**
This system captures row-level mutations (`INSERT`, `UPDATE`, `DELETE`) as they occur using **Change Data Capture (CDC)**, calculates deterministic cryptographic checksums for idempotency, normalizes heterogeneous data formats (CSV, JSON, SQL, Excel) into a transient staging layer, applies **Slowly Changing Dimensions (SCD Type 2)**, and incrementally loads only changed records into a centralized Kimball Star Schema Data Warehouse.

---

## 2. High-Level Data Flow Diagram

```mermaid
flowchart TD
    subgraph Sources["Heterogeneous Operational Sources"]
        S1["Core Banking OLTP (PostgreSQL / Relational)"]
        S2["ATM Network (Batch CSV)"]
        S3["Mobile & Digital Banking (JSON API Stream)"]
        S4["Credit & Loan Partners (Excel .xlsx)"]
    end

    subgraph CDC_Layer["CDC & Idempotency Layer"]
        C1["Mutation Listener / Trigger"]
        C2["SHA256 Checksum Engine"]
        C3["cdc_change_log (Audit & Payload Store)"]
        C4["High-Water Mark Tracker"]
    end

    subgraph Staging_Layer["Staging & Cleansing Layer"]
        ST1["stg_customers"]
        ST2["stg_transactions"]
        CL["Data Cleansing & Validation Engine"]
    end

    subgraph ETL_Engine["Incremental ETL / ELT Engine"]
        E1["Delta Extractor (is_processed = FALSE)"]
        E2["SCD Type 2 Transformer (Dim_Customer)"]
        E3["SCD Type 1 Transformer (Dim_Account)"]
        E4["Surrogate Key Lookup & DimDate Resolver"]
        E5["Statistical Anomaly & Fraud Scorer"]
    end

    subgraph Star_Schema["Kimball Star Schema Data Warehouse"]
        F1["Fact_Transactions"]
        D1["Dim_Customer (SCD Type 2)"]
        D2["Dim_Account"]
        D3["Dim_Branch"]
        D4["Dim_Date"]
    end

    subgraph Analytics["Data Mining & Analytics Engine"]
        A1["Customer RFM Segmentation"]
        A2["Liquidity & Cash Flow Dynamics"]
        A3["Fraud / Anomaly Detection"]
        A4["Pipeline Latency & Optimization Metrics"]
    end

    S1 -->|Write-Ahead Log / Trigger| C1
    S2 -->|File Upload| ST2
    S3 -->|REST Stream| ST1
    S4 -->|Spreadsheet Upload| ST1

    C1 --> C2 --> C3
    ST1 & ST2 --> CL --> C2

    C3 --> E1
    C4 --> E1
    E1 --> E2 & E3 & E4 & E5

    E2 --> D1
    E3 --> D2
    E4 --> D3 & D4
    E5 --> F1

    D1 & D2 & D3 & D4 --> F1
    F1 & D1 & D2 --> A1 & A2 & A3 & A4
```

---

## 3. Entity-Relationship Diagram (ERD) - Kimball Star Schema

```mermaid
erDiagram
    DIM_CUSTOMER ||--o{ FACT_TRANSACTIONS : "customer_key"
    DIM_ACCOUNT ||--o{ FACT_TRANSACTIONS : "account_key"
    DIM_BRANCH ||--o{ FACT_TRANSACTIONS : "branch_key"
    DIM_DATE ||--o{ FACT_TRANSACTIONS : "date_key"

    DIM_CUSTOMER {
        int customer_key PK "Surrogate Key (Auto-increment)"
        string customer_id "Natural Key"
        string first_name
        string last_name
        string full_name
        string email
        string phone
        string segment "Retail | SME | Corporate | HNW"
        string kyc_status "Verified | Pending | Suspended"
        int risk_score "1 - 100"
        string city
        string state
        string country
        timestamp scd_start_date "SCD Type 2 Validity Start"
        timestamp scd_end_date "SCD Type 2 Validity End (NULL if current)"
        boolean is_current "Current Flag"
        int version "Version Number"
        timestamp dw_loaded_at
    }

    DIM_ACCOUNT {
        int account_key PK "Surrogate Key"
        string account_id "Natural Key"
        string customer_id
        string account_number
        string account_type "Savings | Checking | Loan | Credit"
        string status "Active | Dormant | Frozen | Closed"
        string currency
        string branch_id
        date opened_date
        timestamp dw_loaded_at
    }

    DIM_BRANCH {
        int branch_key PK "Surrogate Key"
        string branch_id "Natural Key"
        string branch_name
        string branch_code
        string city
        string state
        string region
        string manager_name
        timestamp dw_loaded_at
    }

    DIM_DATE {
        int date_key PK "YYYYMMDD Integer"
        date full_date "Unique Date"
        int day_of_week
        string day_name
        int day_of_month
        int month
        string month_name
        int quarter
        int year
        boolean is_weekend
        boolean is_holiday
    }

    FACT_TRANSACTIONS {
        bigint fact_id PK "Fact Surrogate Key"
        string transaction_id UK "Natural Transaction Key"
        int date_key FK
        int customer_key FK
        int account_key FK
        int branch_key FK
        string transaction_type "Deposit | Withdrawal | Transfer | Card | Loan"
        string channel "ATM | Mobile | Online | POS | Wire"
        numeric amount "Transaction Measure"
        numeric balance_after "Snapshot Measure"
        boolean is_credit
        boolean is_debit
        string status "Completed | Flagged | Reversed"
        boolean fraud_flag "Anomaly Indicator"
        numeric anomaly_score "Statistical Z-Score (0.0 - 1.0)"
        string cdc_operation "INSERT | UPDATE"
        timestamp dw_loaded_at
    }

    CDC_CHANGE_LOG {
        bigint change_id PK
        string table_name
        string record_id
        string operation "INSERT | UPDATE | DELETE"
        text old_data "JSON Pre-image"
        text new_data "JSON Post-image"
        timestamp captured_at
        boolean is_processed
        timestamp processed_at
        string batch_id
        string checksum "SHA256 Idempotency Hash"
    }
```
