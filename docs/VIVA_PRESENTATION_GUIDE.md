# Viva Voce & Major Project Presentation Defense Guide

## 1. 2-Minute Elevator Pitch (For Viva Opening)

> *"Good morning, respected external examiners. My major project is titled **'ETL/ELT Pipeline Optimization for Heterogeneous Sources via Change Data Capture (CDC) Based Incremental ETL, Applied to Banking Customer Transaction Warehousing Systems'**.*
>
> *In production banking architectures, financial institutions process millions of transactions 24/7 across disparate sources: core banking OLTP databases, ATM networks, mobile API backends, and external loan feeds. Traditional data warehousing architectures rely on nightly batch Full Reload ETL, which scans entire historical tables, locks OLTP resources, and consumes hours of execution time.*
>
> *To solve this, I designed and implemented an end-to-end data engineering system that captures row-level mutations (`INSERT`, `UPDATE`, `DELETE`) in real time using **Change Data Capture (CDC)**. By applying deterministic cryptographic idempotency hashing and **Slowly Changing Dimensions (SCD Type 2)**, our incremental pipeline processes only delta records into a centralized **Kimball Star Schema Data Warehouse**.*
>
> *Empirical benchmarking demonstrates that our CDC Incremental ETL achieves an **over 98% reduction in execution latency** (dropping from ~3,100 ms to ~60 ms) and provides a **51x throughput speedup** while guaranteeing zero data loss, full audit history, and continuous fraud anomaly detection."*

---

## 2. Step-by-Step Live Demonstration Script

When demonstrating the project live to examiners or evaluators, follow this exact sequence:

1. **Start on the Executive Admin Dashboard:**
   - Point out the KPI cards: Total Customers (1,000+), Accounts (1,423), Transactions (5,000+), and Total Volume ($4.9M+).
   - Show the Monthly Transaction Flow line chart and the Credit vs Debit Liquidity ratio.

2. **Demonstrate Heterogeneous Source Ingestion:**
   - Navigate to **Data Sources & Ingestion**.
   - Show the heterogeneous sources (Core PostgreSQL OLTP, ATM CSV, Mobile JSON, Partner Excel).
   - Download one of the pre-built sample files (`sample_customers.csv`).
   - Drag & drop it into the upload box and click **Upload & Generate CDC Delta**.
   - Show how the records land in `stg_customers` and automatically register corresponding CDC events!

3. **Demonstrate Change Data Capture (CDC) Monitoring:**
   - Navigate to **CDC Stream Monitor**.
   - Show the captured events in `cdc_change_log` with color-coded badges (Green INSERT, Yellow UPDATE, Red DELETE).
   - Click **Inspect** on any event to show the examiner the exact JSON Pre-Image (`old_data`) versus Post-Image (`new_data`) diff and SHA-256 idempotency checksum!
   - Click **Simulate Mutations** with custom parameters (e.g. 25 Inserts, 15 Updates, 5 Deletes) to show live mutation streaming.

4. **Demonstrate Pipeline Optimization & Scientific Benchmark:**
   - Navigate to **Pipeline & Optimization**.
   - Click **Run Benchmark Comparison**.
   - Explain the side-by-side results:
     - **Full Load ETL:** Processes 7,500+ records in ~3,100 ms ($\mathcal{O}(N)$ complexity).
     - **Incremental CDC ETL:** Processes only the delta (30-50 records) in ~60 ms ($\mathcal{O}(\Delta)$ complexity).
     - **Mathematical Gain:** **98.06% Time Saved**, **51.49x faster speedup**, and **99.6% I/O reduction**.
   - Review the persistent execution audit log in `pipeline_runs`.

5. **Demonstrate the Kimball Star Schema Warehouse:**
   - Navigate to **Star Schema Warehouse**.
   - Show the topology: central `Fact_Transactions` surrounded by `Dim_Customer` (SCD Type 2), `Dim_Account`, `Dim_Branch`, and `Dim_Date`.
   - Run the sample analytical query in the Interactive SQL Console to show real-time query execution.

6. **Demonstrate Data Mining & Reports:**
   - Navigate to **Data Mining & Analytics** to show customer RFM segmentation, risk distribution, and detected anomalies.
   - Navigate to **Reports & Exports** and click **Export to CSV** or **Export to Excel (.xlsx)** to show compliance audit reporting.

---

## 3. High-Frequency Viva Questions & Model Answers

### Q1: What is the primary difference between Full ETL and Incremental ETL?
**Answer:**
Full ETL extracts the entire source dataset from scratch, truncates or re-indexes the warehouse, and rebuilds all dimensions and facts. It has $\mathcal{O}(N)$ time and space complexity. Incremental ETL extracts only records that changed since the last execution watermark ($\mathcal{O}(\Delta)$ complexity), minimizing I/O, CPU, and network utilization.

### Q2: What is Change Data Capture (CDC) and how is it implemented here?
**Answer:**
CDC is a mechanism that detects and captures row-level mutations (`INSERT`, `UPDATE`, `DELETE`) as they happen. In PostgreSQL, it operates via Write-Ahead Log (WAL) logical replication or table audit triggers (`fn_cdc_capture_mutation`). The captured mutation records both the pre-image (`old_data`) and post-image (`new_data`) into `cdc_change_log`.

### Q3: How do you guarantee Idempotency in the pipeline?
**Answer:**
Idempotency ensures that executing the pipeline multiple times produces the identical state without duplicates. We achieve this by calculating a deterministic SHA-256 hash:
$$\text{Checksum} = \text{SHA-256}(\text{table} \mathbin{\Vert} \text{record\_id} \mathbin{\Vert} \text{operation} \mathbin{\Vert} \text{payload})$$
The pipeline uses unique constraints on `transaction_id` and checks checksums before processing.

### Q4: Explain how you implemented Slowly Changing Dimensions (SCD Type 2).
**Answer:**
In banking, customer attributes (risk score, KYC tier, address) evolve over time. If we overwrite them (SCD Type 1), historical transactions would misrepresent the customer's status at transaction time. In **SCD Type 2**, when a customer update CDC event occurs:
1. The active record's `is_current` is updated to `FALSE` and `scd_end_date` is stamped with the mutation timestamp.
2. A new dimension record is inserted with `is_current = TRUE`, `version = version + 1`, and `scd_start_date = timestamp`.
3. Fact transactions preserve surrogate key references to the exact historical dimension version.

### Q5: Why is a Kimball Star Schema preferred over a 3NF normalized schema for the Data Warehouse?
**Answer:**
Third Normal Form (3NF) reduces data redundancy for operational transactional updates, but requires complex, expensive multi-table JOINs for analytical aggregations. Kimball's Star Schema de-normalizes business context into Dimensions (`Dim_Customer`, `Dim_Date`, `Dim_Branch`) around a central numerical Fact table (`Fact_Transactions`), dramatically accelerating OLAP rollups, slicing, and dicing.

### Q6: How does the system handle heterogeneous sources?
**Answer:**
Data arrives in varied formats: CSV batch files from ATMs, JSON payloads from mobile APIs, and Excel spreadsheets from loan partners. The pipeline extracts them into transient staging tables (`stg_customers`, `stg_transactions`), cleanses and type-coerces attributes, validates required fields, and triggers standard CDC events.

### Q7: How does your Anomaly Detection Engine work?
**Answer:**
The anomaly detection module calculates statistical Z-scores based on historical transaction distribution. Any transaction with an amount significantly exceeding normal thresholds ($Z > 2.5$) or using high-risk channels (Wire transfers above threshold) is flagged with an anomaly score and `fraud_flag = TRUE` for audit.
