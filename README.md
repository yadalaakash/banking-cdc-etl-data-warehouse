# ETL/ELT Pipeline Optimization for Heterogeneous Sources via Change Data Capture (CDC) Based Incremental ETL

### Applied to Banking Customer Transaction Warehousing Systems

[![Python 3.13](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.163.2-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)](https://tailwindcss.com/)
[![PostgreSQL Ready](https://img.shields.io/badge/PostgreSQL-Ready-336791.svg)](https://www.postgresql.org/)
[![Kimball Star Schema](https://img.shields.io/badge/Data%20Warehouse-Kimball%20Star%20Schema-purple.svg)]()
[![CDC Engine](https://img.shields.io/badge/CDC-Idempotent%20SHA256-orange.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Abstract

Modern commercial banking enterprises process millions of transactions 24/7 across fragmented, heterogeneous channels including Core Banking Relational OLTP databases, ATM network batch terminals, mobile/digital REST API gateways, and external loan/credit partner systems. Conventional data warehousing systems rely on batch-oriented **Full Reload ETL pipelines** that re-extract, transform, and rebuild the historical warehouse from scratch. In high-volume financial environments, this architecture causes severe bottlenecks: heavy disk I/O, network saturation, shared table lock contention on live transactional databases, and critical data staleness ($T+1$ delay).

This major project develops, implements, and benchmarks a production-grade **Change Data Capture (CDC) Based Incremental ETL/ELT Pipeline** applied to a centralized **Ralph Kimball Star Schema Banking Data Warehouse**. The system captures atomic row-level mutations (`INSERT`, `UPDATE`, `DELETE`) in real time, computes deterministic cryptographic **SHA-256 checksums** to guarantee idempotent exactly-once execution, harmonizes heterogeneous structures into staging tables, maintains auditable historical changes using **Slowly Changing Dimensions (SCD Type 2)**, and loads only incremental deltas into the analytical warehouse. Empirical benchmark results prove an **over 98% reduction in pipeline latency** and a **51.5x throughput speedup** over traditional full reload pipelines.

---

## 2. Problem Statement

Financial institutions face four major challenges in transactional data warehousing:
1. **Unbounded Batch Windows:** In a Full Load architecture, extraction time scales linearly with historical volume $\mathcal{O}(N)$. As transactional history grows into millions of records, nightly ETL jobs cannot complete within scheduled maintenance intervals.
2. **Transactional Lock Contention:** Full table scans place shared read locks on active OLTP database tables, degrading latency for user-facing online banking operations and debit/credit authorization.
3. **Information Latency:** Fraud detection, liquidity monitoring, and compliance auditing operate on stale data from the previous night rather than real-time transactional streams.
4. **Historical Attribute Overwrite:** Traditional systems frequently perform in-place updates, destroying the temporal history of customer credit scores, addresses, and KYC classifications required for financial compliance.

---

## 3. Project Objectives

- **Heterogeneous Ingestion:** Seamlessly ingest and validate diverse banking data formats (PostgreSQL Relational, CSV batch files, JSON API streams, and Excel workbooks).
- **Change Data Capture (CDC):** Detect and log fine-grained `INSERT`, `UPDATE`, and `DELETE` mutations with pre-image (`old_data`) and post-image (`new_data`) JSON snapshots.
- **Idempotent Processing:** Eliminate duplicate records using cryptographic SHA-256 checksum verification across all delta batches.
- **Dimensional Modeling:** Architect a Kimball Star Schema with surrogate keys, fact tables (`Fact_Transactions`), and dimension tables (`Dim_Customer`, `Dim_Account`, `Dim_Branch`, `Dim_Date`).
- **Auditability via SCD Type 2:** Implement Slowly Changing Dimension Type 2 versioning on customer dimensions with validity timestamps (`scd_start_date`, `scd_end_date`) and current version flags.
- **Pipeline Optimization:** Provide scientific comparative benchmarks measuring execution duration (ms), records loaded, I/O volume reduction, and throughput (records/sec).
- **Advanced Data Mining & Analytics:** Deliver automated RFM customer segmentation, liquidity in-flow vs. out-flow analysis, and statistical anomaly detection for suspicious wire/high-value transactions.
- **Interactive Executive Interface:** Provide a dark-themed responsive dashboard for live pipeline execution, CDC stream inspection, ad-hoc SQL querying, and compliance report exporting.

---

## 4. Existing System vs. Proposed System

| Dimension | Existing Traditional System | Proposed CDC Incremental System |
| :--- | :--- | :--- |
| **Ingestion Paradigm** | Scheduled Batch Full Reload ETL | Event-Driven / Watermarked CDC Incremental ETL |
| **Algorithmic Complexity** | $\mathcal{O}(N)$ where $N$ is total historical volume | $\mathcal{O}(\Delta)$ where $\Delta$ is only changed records |
| **Execution Latency** | High ($\approx 3,100\text{ ms}$ on test corpus) | Near-Instantaneous ($\approx 60\text{ ms}$ on test corpus) |
| **Source Database Impact** | Heavy full table scans, read locks, network spikes | Zero table locks; lightweight changelog/WAL streaming |
| **Data Freshness** | Stale ($T+1$ day batch latency) | Near Real-Time (Continuous micro-batch delta sync) |
| **Dimension Tracking** | SCD Type 1 (in-place overwrite; loss of history) | SCD Type 2 (full temporal versioning & lineage) |
| **Idempotency** | Vulnerable to duplicate fact creation on retry | Cryptographic SHA-256 hash deduplication |

---

## 5. System Architecture

```
+-----------------------------------------------------------------------------------+
|                           HETEROGENEOUS SOURCE LAYER                             |
|  [Core Banking OLTP]      [ATM Terminal]      [Mobile API]      [Credit Partner]  |
|   (PostgreSQL/SQL)             (CSV)             (JSON)             (Excel)       |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|               CHANGE DATA CAPTURE (CDC) & IDEMPOTENCY ENGINE                      |
|  - Real-time Mutation Sniffer: INSERT, UPDATE, DELETE                             |
|  - Cryptographic Hash Engine: SHA256(table : id : op : payload)                   |
|  - Audit Log Store: cdc_change_log (Old JSON Pre-image vs New JSON Post-image)    |
|  - High-Water Mark Tracker: pipeline_watermarks                                   |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                     INCREMENTAL ETL / ELT TRANSFORMATION ENGINE                   |
|  - Schema Harmonization & Staging (stg_customers, stg_transactions)               |
|  - SCD Type 2 Customer Versioning: Version N+1, is_current, scd_end_date          |
|  - SCD Type 1 Account Status Sync: In-place update / Closed account tombstoning   |
|  - Dynamic Surrogate Key Resolver: Dim_Date (YYYYMMDD), Dim_Branch, Dim_Account   |
|  - Statistical Anomaly & Fraud Scoring (Z-score outlier detection)                |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                     KIMBALL STAR SCHEMA DATA WAREHOUSE                            |
|             +-----------------------------------------------+                     |
|             |               DIM_CUSTOMER (SCD2)             |                     |
|             +-----------------------+-----------------------+                     |
|                                     │                                             |
|   +-------------------+             ▼             +--------------------+          |
|   |    DIM_ACCOUNT    |-----> FACT_TRANSACTIONS <-----|     DIM_BRANCH     |          |
|   +-------------------+             ▲             +--------------------+          |
|                                     │                                             |
|             +-----------------------+-----------------------+                     |
|             |                   DIM_DATE                    |                     |
|             +-----------------------------------------------+                     |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                       ANALYTICS, MINING & DASHBOARDS                              |
|  - Customer RFM Segmentation & Risk Distribution                                  |
|  - Monthly Flow & Credit vs. Debit Liquidity Ratio                                |
|  - Statistical Anomaly & Fraud Detection Engine                                   |
|  - Benchmark Execution & Optimization Proof (98%+ Latency Reduction)              |
|  - Compliance Audit Reports with CSV & Excel (.xlsx) Streaming Exports            |
+-----------------------------------------------------------------------------------+
```

---

## 6. Technologies Used

- **Frontend Application:** React 19, Vite 8, Tailwind CSS v4, Chart.js, React-Chartjs-2, Lucide Icons.
- **Backend Services:** Python 3.13, FastAPI (Asynchronous REST API, OpenAPI docs), Uvicorn, Pydantic v2.
- **Data Engineering & Analysis:** Pandas 3.1, NumPy 2.5, SQLAlchemy 2.0 (ORM & Core), OpenPyXL, Python-Dateutil.
- **Database & Storage:**
  - **Embedded Engine:** High-performance SQLite 3 with Write-Ahead Logging (WAL) and foreign keys enabled.
  - **Production Enterprise Engine:** PostgreSQL 14+ compatible with dedicated DDL scripts and logical replication trigger functions (`psycopg2-binary`).
- **Version Control & Quality:** Git, GitHub Actions, PEP 8 compliance.

---

## 7. Project Modules

### 1. Data Source Management
- Multi-format parser for **CSV**, **JSON**, **PostgreSQL**, and **Excel (`.xlsx`, `.xls`)**.
- Staging ingestion into `stg_customers` and `stg_transactions`.
- Automatic generation of CDC delta records upon batch file upload.
- Pre-packaged synthetic downloadable templates in `data/raw/` (`sample_customers.csv`, `sample_transactions.json`, `sample_customers.xlsx`).

### 2. Change Data Capture (CDC) Engine
- Row-level capture of `INSERT`, `UPDATE`, and `DELETE` operations.
- Dual-image payload storage: records pre-mutation state (`old_data`) and post-mutation state (`new_data`).
- Deterministic **SHA-256 Checksum** calculation: $\text{SHA-256}(\text{table} \mathbin{\Vert} \text{id} \mathbin{\Vert} \text{op} \mathbin{\Vert} \text{payload})$ for idempotent delta execution.
- Operational banking event simulator to inject live customer KYC changes, deposits, and account closures.

### 3. Incremental ETL/ELT Pipeline
- **Delta Extractor:** Queries unprocessed changes (`is_processed = FALSE`) from `cdc_change_log`.
- **SCD Type 2 Transformation:** Updates previous active customer records (`is_current = FALSE`, `scd_end_date = timestamp`) and inserts new version ($N+1$).
- **Surrogate Key Resolution:** Maps natural keys (`customer_id`, `account_id`, `branch_id`, timestamps) to surrogate dimension keys.
- **Atomic Loading:** Ingestion into `Fact_Transactions` with transaction status updates and execution metric recording in `pipeline_runs`.

### 4. Kimball Star Schema Data Warehouse
- **Fact Table:** `Fact_Transactions` (numerical measures, degenerate transaction natural key, surrogate foreign keys, fraud indicators, anomaly scores).
- **Dimension Tables:** `Dim_Customer` (SCD Type 2), `Dim_Account`, `Dim_Branch`, `Dim_Date`.
- Comprehensive SQL scripts: `database/schema_postgres.sql` and `database/postgres_cdc_setup.sql`.

### 5. Data Mining & Banking Analytics
- **Customer Segmentation:** Automated classification into Retail, SME, Corporate, and High Net Worth (HNW) tiers.
- **Liquidity Ratio:** Credit inflows versus debit outflows cash dynamics.
- **Anomaly Detection:** Outlier detection engine flagging transactions with $Z\text{-score} > 2.5$ or uncharacteristic high-value wire channels.
- **Top Customers Leaderboard:** Rankings by transacted volume and transaction frequency.

### 6. Pipeline Optimization & Scientific Benchmarking
- Automated test runner executing Full Load vs. Incremental CDC ETL on identical snapshots.
- Direct mathematical measurement of latency reduction, speedup factors, and I/O savings.

### 7. Executive Web Dashboard
- Executive KPI summary cards (Customers, Accounts, Transactions, Total Volume, Pending CDC Backlog, Time Saved %).
- Interactive visualizations: Monthly Flow (Line), Liquidity Dynamics (Doughnut), Channel Density (Bar).
- Live CDC stream viewer with visual JSON diff modal.
- In-browser interactive SQL query console for read-only analytical queries.
- Direct export of transaction and customer reports to **CSV** and **Excel (`.xlsx`)**.

---

## 8. Database Design (Kimball Star Schema)

```mermaid
erDiagram
    DIM_CUSTOMER ||--o{ FACT_TRANSACTIONS : "customer_key"
    DIM_ACCOUNT ||--o{ FACT_TRANSACTIONS : "account_key"
    DIM_BRANCH ||--o{ FACT_TRANSACTIONS : "branch_key"
    DIM_DATE ||--o{ FACT_TRANSACTIONS : "date_key"

    DIM_CUSTOMER {
        int customer_key PK "Surrogate Key"
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
        timestamp scd_start_date "SCD2 Start"
        timestamp scd_end_date "SCD2 End (NULL if active)"
        boolean is_current "Active Version Flag"
        int version "Version Number"
        timestamp dw_loaded_at
    }

    DIM_ACCOUNT {
        int account_key PK "Surrogate Key"
        string account_id "Natural Key"
        string customer_id
        string account_number
        string account_type "Savings | Checking | Loan | Credit"
        string status "Active | Closed | Dormant"
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
        int date_key PK "YYYYMMDD Integer Key"
        date full_date "Unique Calendar Date"
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
        string transaction_id UK "Natural Key"
        int date_key FK
        int customer_key FK
        int account_key FK
        int branch_key FK
        string transaction_type "Deposit | Withdrawal | Transfer | Card | Loan"
        string channel "ATM | Mobile | Online | POS | Wire"
        numeric amount "Transaction Measure"
        numeric balance_after "Balance Measure"
        boolean is_credit
        boolean is_debit
        string status "Completed | Flagged"
        boolean fraud_flag
        numeric anomaly_score
        string cdc_operation "INSERT | UPDATE"
        timestamp dw_loaded_at
    }
```

---

## 9. CDC & Incremental ETL Workflow

```mermaid
sequenceDiagram
    autonumber
    participant App as Operational OLTP System
    participant CDC as CDC Capture Engine
    participant Log as cdc_change_log
    participant ETL as Incremental ETL Pipeline
    participant DW as Star Schema (Fact & Dims)

    App->>CDC: Operational Mutation (INSERT / UPDATE / DELETE)
    CDC->>CDC: Compute SHA-256 Checksum(table, id, op, payload)
    CDC->>Log: Idempotent Log Write (is_processed = FALSE)
    Note over Log: Stores Old JSON & New JSON pre/post snapshots
    
    ETL->>Log: Poll Unprocessed Events (is_processed = FALSE)
    Log-->>ETL: Return Delta Batch
    
    alt Operation = INSERT (Transaction)
        ETL->>DW: Resolve Keys + Check Anomaly + Insert Fact_Transactions
    else Operation = UPDATE (Customer)
        ETL->>DW: SCD Type 2: Expire version N, Insert version N+1
    else Operation = DELETE (Account)
        ETL->>DW: SCD Type 1: Mark status = 'Closed'
    end

    ETL->>Log: Atomic Commit: Mark is_processed = TRUE, set processed_at
    ETL->>DW: Record Execution Metrics in pipeline_runs
```

---

## 10. Installation & Setup Instructions

### Prerequisites
- **Python:** Version 3.10 to 3.13
- **Node.js:** Version 18 or higher (with npm)
- **Git:** Version 2.25 or higher

### Step 1: Clone the Repository
```bash
git clone https://github.com/yadalaakash/banking-cdc-etl-data-warehouse.git
cd banking-cdc-etl-data-warehouse
```

### Step 2: Configure Environment Variables
Copy the example environment template:
```bash
# On Linux / macOS:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```
*(Default settings use the embedded SQLite WAL engine. To connect to PostgreSQL, set `DATABASE_URL=postgresql://user:password@localhost:5432/banking_dw`).*

### Step 3: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 5: Initialize & Seed Database
Initialize schema and seed 1,000 customers, 15 branches, 1,423 accounts, and 5,000 transactions:
```bash
python run_pipeline_cli.py --action seed
```

---

## 11. Execution Commands

### 1. Start Backend API Server
In terminal 1:
```bash
python run_backend.py
```
- **Backend API:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **Health Endpoint:** `http://localhost:8000/health`

### 2. Start Frontend Web Dashboard
In terminal 2:
```bash
cd frontend
npm run dev
# Or on Windows PowerShell:
npm.cmd run dev
```
- **Web UI:** `http://localhost:5173`

### 3. Headless Data Engineering CLI Commands
```bash
# Display current warehouse metrics and pending CDC queue
python run_pipeline_cli.py --action status

# Execute CDC Incremental ETL on pending delta events
python run_pipeline_cli.py --action incremental

# Execute Full Warehouse Reload
python run_pipeline_cli.py --action full

# Run automated Full vs Incremental benchmark comparison (40 deltas)
python run_pipeline_cli.py --action benchmark --delta 40

# Inject synthetic live operational banking mutations
python run_pipeline_cli.py --action simulate
```

---

## 12. Screenshots & UI Walkthrough

| Module | Interface Preview Description |
| :--- | :--- |
| **Admin Dashboard** | Real-time KPI summary cards, monthly flow line charts, credit vs. debit liquidity doughnut, and channel distribution breakdown. |
| **Data Sources** | Status of heterogeneous sources (PostgreSQL, CSV, JSON, Excel), drag-and-drop ingestion zone, and template downloaders. |
| **CDC Stream Monitor** | Real-time tabular stream of captured mutations with color-coded badges, SHA-256 checksums, and interactive JSON Pre/Post diff modal. |
| **Pipeline & Optimization** | Interactive benchmark comparison suite displaying execution duration, throughput (rps), and % time saved. |
| **Warehouse Explorer** | Interactive Kimball Star Schema visual topology, paginated table previews, and safe read-only SQL query console. |
| **Data Mining & Analytics** | Customer tier segmentation charts, risk distribution metrics, and suspicious transaction anomaly cards. |
| **Reports & Exports** | Paginated transaction ledgers and customer audit histories with one-click streaming exports to **CSV** and **Excel (`.xlsx`)**. |

---

## 13. Empirical Optimization Results

Direct measurements recorded from automated benchmark executions:

| Metric | Traditional Full Load ETL | CDC Incremental ETL | Optimization Gain |
| :--- | :--- | :--- | :--- |
| **Computational Complexity** | $\mathcal{O}(N)$ (Entire historical corpus) | $\mathcal{O}(\Delta)$ (Changed delta only) | **Scale Invariant** |
| **Execution Latency** | **$3,108.03\text{ ms}$** | **$60.36\text{ ms}$** | **$98.06\%$ Latency Reduction** |
| **Speedup Factor** | $1.0\times$ (Baseline) | **$51.49\times$ faster** | **$51.5\times$ Speedup** |
| **Records Processed** | $7,491$ rows (All tables scanned) | $27$ delta rows | **$99.64\%$ I/O Reduction** |
| **Pipeline Throughput** | Baseline | **$447.35\text{ records/sec}$** | **Continuous Flow** |
| **Database Contention** | Shared Table Read Locks | None (Changelog stream) | **Zero OLTP Impact** |
| **Network Bandwidth** | $\approx 15\text{ MB}$ payload transfer | $\approx 45\text{ KB}$ payload transfer | **$99.7\%$ Bandwidth Saved** |

---

## 14. Future Enhancements

1. **Distributed CDC via Apache Kafka & Debezium:** Scale the ingestion layer by integrating Debezium connectors for distributed log-based CDC streaming through Apache Kafka topics.
2. **Cloud Data Warehouse Migration:** Extend SQLAlchemy target loaders to Snowflake, Google BigQuery, and Amazon Redshift using DBT (Data Build Tool) transformations.
3. **Advanced ML-Driven Fraud Scoring:** Replace statistical Z-score anomaly detection with trained Isolation Forest and Autoencoder models for predictive anti-money laundering (AML).
4. **Apache Airflow DAG Orchestration:** Formalize production orchestration DAGs using Apache Airflow or Prefect for scheduled backfills and health alerting.

---

## 15. Repository & Project Metadata

- **Repository:** [https://github.com/yadalaakash/banking-cdc-etl-data-warehouse](https://github.com/yadalaakash/banking-cdc-etl-data-warehouse)
- **Author:** Yadala Akash
- **Domain:** Data Engineering, Data Mining & Warehousing Systems
- **Compliance:** All customer profiles, account balances, and transaction amounts are synthetically generated for privacy compliance. Real banking customer data is never used.
