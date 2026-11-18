# Banking CDC-Based Incremental ETL Data Warehouse

## Project Overview

**Project Title:** ETL/ELT Pipeline Optimization for Heterogeneous
Sources via Change Data Capture (CDC) Based Incremental ETL, Applied to
Banking Customer Transaction Warehousing Systems

**Domain:** Data Engineering & Pipelines; Data Mining & Warehousing

This project focuses on a banking customer transaction data warehousing
workflow. It is intended to bring data from heterogeneous sources into a
centralized warehouse and demonstrate how Change Data Capture (CDC) can
identify data changes so incremental ETL processes can process changed
records.

> Update this README to match the exact modules and source connectors
> implemented in your final project. Use synthetic banking data only. Do
> not publish real customer records, credentials, or secrets.

## Problem Statement

Banking data may come from multiple sources and formats. Repeatedly
extracting and processing all records can increase processing time and
resource usage. A CDC-based incremental ETL approach identifies
inserted, updated, and deleted records and processes the changes
required for the warehouse.

## Objectives

-   Work with heterogeneous banking data sources and formats.
-   Validate and prepare source data before loading.
-   Capture data changes such as inserts, updates, and deletes.
-   Process changed records through an incremental ETL workflow.
-   Organize customer and transaction information for analytical
    queries.
-   Monitor pipeline execution and compare full-load and
    incremental-load performance.

## High-Level Workflow

``` text
Heterogeneous Data Sources
          |
          v
   Source Data Validation
          |
          v
 Change Data Capture (CDC)
          |
          v
 Incremental ETL / ELT
          |
          v
 Staging and Data Warehouse
          |
          v
 Banking Analytics and Reports
```

## Technology Stack

The setup process for this repository confirmed:

-   **Backend:** Python with FastAPI/Uvicorn
-   **Frontend:** React with Vite
-   **Database:** A SQLite database file named `banking_dw.db` was
    present in the project folder.

Confirm the exact data-processing libraries in `requirements.txt`. Add
other tools only if they are actually configured and used in your
implementation.

## Project Structure

  Folder/File          Purpose
  -------------------- -----------------------------------
  `backend/`           Backend application code
  `frontend/`          Web frontend application
  `data/`              Project datasets or sample data
  `database/`          Database-related files or scripts
  `docs/`              Project documentation
  `run_backend.py`     Backend startup script
  `run_pipeline.py`    Pipeline execution script
  `requirements.txt`   Python dependencies

## Local Setup and Execution

### Prerequisites

-   Python
-   Node.js and npm
-   Git (optional, for version control)

### 1. Clone the repository

``` bash
git clone https://github.com/yadalaakash/banking-cdc-etl-data-warehouse.git
cd banking-cdc-etl-data-warehouse
```

### 2. Create and activate a Python virtual environment

**Windows CMD:**

``` cmd
python -m venv venv
venv\Scripts\activate
```

### 3. Install Python dependencies

``` cmd
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Start the backend

From the project root, with the virtual environment activated:

``` cmd
python run_backend.py
```

During setup, the backend started with Uvicorn on port `8000`. Open the
API documentation:

http://127.0.0.1:8000/docs

Keep this terminal window open.

### 5. Start the frontend

Open a second terminal window:

``` cmd
cd frontend
npm run dev
```

Open the local address printed by Vite in the terminal (commonly
`http://localhost:5173/`).

Keep both backend and frontend terminals running.

## Run the ETL Pipeline

The repository contains a root-level `run_pipeline.py` script. From the
project root, with the virtual environment activated, run:

``` cmd
python run_pipeline.py
```

Check the terminal output and the project code for the script's exact
input requirements and behavior.

## Security and Data Privacy

-   Use synthetic or anonymized data for demonstrations.
-   Never commit `.env` files, passwords, API keys, database
    credentials, or private customer information.
-   Check `.gitignore` before every push.
-   Do not expose real banking account numbers, personal identifiers, or
    transaction records in screenshots or reports.

## Performance Evaluation

For a meaningful full-ETL versus incremental-ETL comparison, record
actual measurements such as:

-   Number of source records scanned
-   Number of inserted, updated, and deleted records detected
-   Number of records loaded
-   Pipeline execution time
-   Throughput (records processed per second)

Report only results measured from your own runs. Do not invent
performance percentages.

## Future Enhancements

Potential extensions, if not already implemented:

-   Additional CSV, JSON, Excel, and relational database connectors
-   Log-based CDC and automated change-stream processing
-   Workflow scheduling with Apache Airflow
-   Data quality checks and retry handling
-   Role-based access control and audit logging
-   Advanced customer analytics and anomaly detection

## Author

**Yadala Akash**
