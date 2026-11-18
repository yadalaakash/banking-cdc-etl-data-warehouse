# ETL/ELT Pipeline Optimization for Heterogeneous Sources via Change Data Capture (CDC) Based Incremental ETL

### Applied to Banking Customer Transaction Warehousing Systems

[![Python 3.13](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.163.2-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)](https://tailwindcss.com/)
[![PostgreSQL Compatible](https://img.shields.io/badge/PostgreSQL-Ready-336791.svg)](https://www.postgresql.org/)
[![Kimball Star Schema](https://img.shields.io/badge/Data%20Warehouse-Kimball%20Star%20Schema-purple.svg)]()
[![CDC Engine](https://img.shields.io/badge/CDC-Idempotent%20SHA256-orange.svg)]()

---

## 1. Project Overview & Problem Statement

In modern financial ecosystems, banking institutions process millions of daily transactions across disparate, heterogeneous infrastructure:
- **Core Banking Relational OLTP Databases** (PostgreSQL / Oracle)
- **ATM Networks** (Scheduled CSV batch extracts)
- **Mobile & Digital Banking Platforms** (High-velocity JSON REST API events)
- **External Loan & Credit Partners** (Periodic Excel `.xlsx` / `.xls` spreadsheets)

Traditional enterprise data warehouses rely on scheduled batch **Full Reload ETL Pipelines**. In high-volume banking environments, this approach introduces critical bottlenecks:
1. **Excessive Resource & I/O Footprint:** Full table scans over millions of historical transactions require massive storage I/O and network bandwidth.
2. **Batch Window Depletion:** As data volume grows ($\mathcal{O}(N)$), nightly ETL jobs exceed the allotted batch window.
3. **Operational Database Lock Contention:** Table scans place shared locks on active OLTP database tables, impacting customer-facing services.
4. **Data Latency (T+1):** Analytics and fraud models run on stale data from the previous night rather than real-time streams.

### The Solution:
This project engineers a high-performance **Change Data Capture (CDC) based Incremental ETL/ELT Pipeline**. By capturing row-level mutations (`INSERT`, `UPDATE`, `DELETE`) as they happen, validating cryptographic SHA-256 checksums for idempotency, harmonizing heterogeneous schemas via transient staging, and applying **Slowly Changing Dimensions (SCD Type 2)**, the system achieves an **over 98% reduction in pipeline latency** and a **51x throughput speedup** over traditional full reloads.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Dashboard** | React 19, Vite 8, Tailwind CSS, Chart.js, Lucide Icons |
| **Backend REST API** | Python 3.13, FastAPI, Uvicorn, Pydantic, Python-Multipart |
| **Data Processing & ETL** | Python, Pandas, SQLAlchemy 2.0, NumPy, OpenPyXL |
| **CDC Engine** | Dual Mode: PostgreSQL Logical Replication / WAL Triggers & Audit Log Simulation |
| **Data Warehouse** | Dual Mode: Enterprise PostgreSQL Ready & Embedded SQLite WAL High-Performance Engine |
| **Dimensional Modeling** | Ralph Kimball Star Schema (`Fact_Transactions`, `Dim_Customer` SCD2, `Dim_Account`, `Dim_Branch`, `Dim_Date`) |

---

## 3. High-Level System Architecture

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
|  - Real-time Mutation Detection: INSERT, UPDATE, DELETE                           |
|  - Cryptographic Checksum Generation: SHA256(table : id : op : payload)           |
|  - Audit Log Storage: cdc_change_log (Old Data JSON vs New Data JSON pre/post)     |
|  - High-Water Mark Timestamp Tracker: pipeline_watermarks                         |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                     INCREMENTAL ETL / ELT PIPELINE ENGINE                         |
|  - Schema Harmonization & Validation (stg_customers, stg_transactions)           |
|  - SCD Type 2 Dimension Versioning: Version N+1, is_current, scd_end_date         |
|  - Dynamic Dim_Date & Dim_Branch Surrogate Key Resolution                         |
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
|  - Compliance Audit Reports with CSV & Excel Exports                              |
+-----------------------------------------------------------------------------------+
```

---

## 4. Project Directory Structure

```
major project/
├── backend/
│   └── app/
│       ├── __init__.py
│       ├── config.py                 # Paths, environment configs, DB connection URLs
│       ├── database.py               # SQLAlchemy engine, session maker, WAL pragmas
│       ├── models.py                 # Star Schema models (Staging, Dims, Facts, CDC log, Runs)
│       ├── cdc_engine.py             # CDC change detection, SHA256 idempotency, mutation simulator
│       ├── etl_pipeline.py           # Incremental ETL, Full ETL, SCD Type 2, heterogeneous ingestion
│       ├── optimizer.py              # Automated benchmark runner (Full vs Incremental comparison)
│       ├── analytics.py              # Customer segmentation, credit/debit ratio, anomaly detection
│       ├── generator.py              # Realistic synthetic data generator (>1k cust, >5k txns)
│       ├── main.py                   # FastAPI application, CORS, lifecycle hooks
│       └── routes/
│           ├── dashboard.py          # Summary KPIs, trend charts, system health
│           ├── sources.py            # Heterogeneous source management, CSV/JSON/Excel upload
│           ├── cdc.py                # CDC change stream, mutation injector, metrics
│           ├── pipeline.py           # Incremental/Full ETL triggers, benchmark runner, audit runs
│           ├── warehouse.py          # Star Schema explorer, metadata, safe SELECT query console
│           ├── analytics.py          # Segmentation, liquidity, anomalies, top customers
│           └── reports.py            # Report generation and streaming CSV/Excel export
├── data/
│   ├── raw/                          # Ready-to-use sample CSV, JSON, and Excel test files
│   ├── uploads/                      # Uploaded heterogeneous batch files
│   └── cdc_batches/                  # CDC batch export snapshots
├── database/
│   ├── schema_postgres.sql           # Complete PostgreSQL DDL (Staging, Star Schema, CDC)
│   └── postgres_cdc_setup.sql        # Trigger-based CDC function & WAL logical replication guide
├── docs/
│   ├── ARCHITECTURE_AND_DATA_FLOW.md # High-level architecture & Mermaid diagrams
│   ├── CDC_WORKFLOW_AND_OPTIMIZATION.md # CDC lifecycle, idempotency proof, mathematical model
│   └── VIVA_PRESENTATION_GUIDE.md    # Viva voce questions, defense speech, demonstration script
├── frontend/                         # Modern React 19 + Vite 8 + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx            # Quick actions (Run Incremental, Simulate CDC, Refresh)
│   │   │   └── Sidebar.jsx           # Core module navigation and system status indicator
│   │   ├── views/
│   │   │   ├── DashboardView.jsx     # Executive KPI cards, monthly trends, credit/debit doughnut
│   │   │   ├── DataSourcesView.jsx   # Source statuses, drag & drop uploader, sample downloads
│   │   │   ├── CDCMonitorView.jsx    # Live CDC mutation stream, payload diff inspector, simulator
│   │   │   ├── PipelineView.jsx      # Scientific benchmark comparison, time saved %, run history
│   │   │   ├── WarehouseView.jsx     # Star Schema topology, table preview, interactive SQL console
│   │   │   ├── AnalyticsView.jsx     # Segmentation tiers, risk scoring, anomaly detection cards
│   │   │   ├── ReportsView.jsx       # Transaction ledgers, customer reports, CSV/Excel export
│   │   │   └── ArchitectureDocView.jsx # In-app architectural documentation and viva guide
│   │   ├── services/api.js           # REST API client connecting frontend to backend
│   │   ├── utils/chartSetup.js       # Chart.js registration
│   │   ├── App.jsx                   # Main layout and global notification coordinator
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── run_backend.py                    # Server startup script (FastAPI on http://localhost:8000)
├── run_pipeline_cli.py               # Data engineering CLI utility tool
├── requirements.txt                  # Python dependencies
├── .env.example                      # Environment variables template
├── .env                              # Active configuration
└── README.md                         # Project documentation
```

---

## 5. Step-by-Step Installation & Execution Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ (Tested on Node.js v24)
- (Optional) PostgreSQL 14+ if deploying against a remote or local PostgreSQL server

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 3: Seed Synthetic Banking Data (CLI or Auto-Startup)
The database automatically seeds realistic banking data on first startup. You can also run the CLI tool directly:
```bash
python run_pipeline_cli.py --action seed --customers 1000 --transactions 5000
```
This generates:
- **1,000 Banking Customers** with diverse demographics, KYC statuses, risk scores, and cities.
- **15 Branches** (New York, San Francisco, Chicago, London, Dallas, etc.).
- **1,423 Accounts** (Savings, Checking, Fixed Deposit, Loan, Credit Card).
- **5,000 Historical Transactions** with realistic distributions across channels.
- **50+ Pre-staged CDC Events** (Inserts, Updates, Deletes) ready for live demonstration.

---

### Step 4: Run the Backend API Server
In terminal 1:
```bash
python run_backend.py
```
*The API will start at:* **`http://localhost:8000`**
*Interactive Swagger API Docs:* **`http://localhost:8000/docs`**

---

### Step 5: Run the Frontend User Interface
In terminal 2:
```bash
cd frontend
npm run dev
```
*The React Dashboard will be available at:* **`http://localhost:5173`**

---

## 6. Command-Line Interface (CLI) for Data Engineers

A CLI utility (`run_pipeline_cli.py`) is provided for automated headless execution:

| Command | Description |
| :--- | :--- |
| `python run_pipeline_cli.py --action status` | Displays current warehouse row counts, CDC queue, and savings % |
| `python run_pipeline_cli.py --action incremental` | Executes CDC-based Incremental ETL on pending delta events |
| `python run_pipeline_cli.py --action full` | Executes complete Full Load ETL across all historical tables |
| `python run_pipeline_cli.py --action benchmark --delta 40` | Runs automated benchmark comparing Full vs Incremental ETL |
| `python run_pipeline_cli.py --action simulate` | Injects synthetic live customer KYC changes and deposits |
| `python run_pipeline_cli.py --action seed` | Initializes sample customers, accounts, branches, and facts |

---

## 7. Empirical Optimization & Benchmarking Results

Benchmark tests run across the same operational database snapshot yielded the following metrics:

| Metric | Full Load ETL | CDC Incremental ETL | Optimization Gain |
| :--- | :--- | :--- | :--- |
| **Algorithmic Complexity** | $\mathcal{O}(N)$ (Entire historical corpus) | $\mathcal{O}(\Delta)$ (Changed delta only) | **Scale Invariance** |
| **Execution Latency** | **$3,108.03\text{ ms}$** | **$60.36\text{ ms}$** | **$98.06\%$ Time Saved** |
| **Speedup Factor** | $1.0\times$ (Baseline) | **$51.49\times$ faster** | **$51.5\times$ Speedup** |
| **Records Processed** | $7,491$ rows | $27$ delta rows | **$99.64\%$ I/O Reduction** |
| **Throughput** | Baseline | $447.35\text{ records/sec}$ | **High Delta Throughput** |
| **Database Locks** | Shared Table Read Locks | None (Changelog stream) | **Zero OLTP Disruption** |

---

## 8. Database Compatibility & PostgreSQL Setup

The project runs out-of-the-box using an optimized embedded SQLite database with **Write-Ahead Logging (WAL)** and foreign keys enabled.

To connect directly to an enterprise **PostgreSQL** instance:
1. Update `DATABASE_URL` in `.env`:
   ```ini
   DATABASE_URL=postgresql://postgres:password@localhost:5432/banking_dw
   ```
2. Execute the provided PostgreSQL DDL script:
   ```bash
   psql -U postgres -d banking_dw -f database/schema_postgres.sql
   ```
3. Enable trigger-based or logical replication CDC using `database/postgres_cdc_setup.sql`.

---

## 9. Academic Viva & Presentation Defense

Comprehensive viva preparation materials are available in the **Architecture & Viva Prep** tab inside the web UI, as well as in `docs/VIVA_PRESENTATION_GUIDE.md`:
- **Opening Elevator Pitch:** 2-minute project summary.
- **Live Demo Script:** Step-by-step guidance for demonstrating source ingestion, CDC stream inspection, benchmark comparison, and Star Schema exploration.
- **Top 12 Viva Voce Questions:** Detailed explanations of Kimball modeling, SCD Type 2 mechanics, SHA-256 idempotency, and statistical anomaly detection.

---

## 10. License & Author
Developed as an industry-level Major Academic Project in Data Engineering, Data Warehousing, and Pipeline Optimization. All customer and transaction records are synthetically generated for privacy compliance.
