import React from 'react';
import {
  BookOpen,
  Layers,
  Zap,
  Radio,
  Database,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  HelpCircle
} from 'lucide-react';

export default function ArchitectureDocView() {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title & Introduction */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-cyan-400 border border-blue-500/30 uppercase tracking-wider">
          Major Project Master Architecture
        </span>
        <h2 className="text-xl font-bold text-white mt-2 leading-snug">
          ETL/ELT Pipeline Optimization for Heterogeneous Sources via Change Data Capture (CDC) Based Incremental ETL, Applied to Banking Customer Transaction Warehousing Systems
        </h2>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          This project demonstrates the design and optimization of an enterprise banking analytical data warehouse.
          By replacing traditional, batch-oriented Full Reload ETL with continuous Change Data Capture (CDC) based Incremental ETL,
          the system achieves a <strong>95%–98% reduction in latency</strong>, eliminates redundant full-table database locks, and enforces dimensional auditability using Kimball Star Schema and SCD Type 2.
        </p>
      </div>

      {/* 1. End-to-End Data Pipeline Architecture */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          1. End-to-End System Data Flow Architecture
        </h3>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-2 leading-relaxed">
          <div className="text-cyan-400 font-bold">[Heterogeneous Ingestion Layer]</div>
          <div>  ├─ Core Banking OLTP (PostgreSQL / Relational WAL Log &amp; Triggers)</div>
          <div>  ├─ ATM Batch Terminal Network (CSV Ingestion)</div>
          <div>  ├─ Mobile &amp; Digital Banking APIs (JSON REST Payload Stream)</div>
          <div>  └─ External Partner Credit Feeds (Excel .xlsx / .xls Spreadsheets)</div>
          <div className="text-slate-600 pl-6">│  (Validation &amp; Type Sanitization)</div>
          <div className="text-amber-400 font-bold">▼</div>
          <div className="text-amber-400 font-bold">[Change Data Capture (CDC) Engine &amp; Idempotency Layer]</div>
          <div>  ├─ Mutation Event Sniffer (INSERT, UPDATE, DELETE)</div>
          <div>  ├─ SHA256 Checksum Calculation (sha256(table:id:op:payload))</div>
          <div>  ├─ cdc_change_log Table (old_data, new_data, captured_at, is_processed)</div>
          <div>  └─ High-Water Mark Timestamp Tracker (pipeline_watermarks)</div>
          <div className="text-slate-600 pl-6">│  (Delta Extraction: is_processed = FALSE)</div>
          <div className="text-blue-400 font-bold">▼</div>
          <div className="text-blue-400 font-bold">[Incremental ETL / ELT Transformation Engine]</div>
          <div>  ├─ Schema Harmonization: Staging (stg_customers, stg_transactions)</div>
          <div>  ├─ Customer Dimension SCD Type 2: Expire old record (scd_end_date), insert version N+1</div>
          <div>  ├─ Account Dimension SCD Type 1: In-place update / Soft-delete status</div>
          <div>  ├─ Dynamic Date Key Generator: YYYYMMDD lookup into dim_date</div>
          <div>  └─ Statistical Anomaly Engine: Z-score &amp; transaction velocity flags</div>
          <div className="text-slate-600 pl-6">│  (Idempotent Surrogate Key Upsert)</div>
          <div className="text-emerald-400 font-bold">▼</div>
          <div className="text-emerald-400 font-bold">[Kimball Star Schema Data Warehouse]</div>
          <div>  ├─ Fact_Transactions (transaction_id, date_key, customer_key, account_key, branch_key, measures)</div>
          <div>  ├─ Dim_Customer (Surrogate customer_key, natural ID, profile, validity dates, is_current)</div>
          <div>  ├─ Dim_Account (Surrogate account_key, status, type, branch)</div>
          <div>  ├─ Dim_Branch (Surrogate branch_key, geography, manager)</div>
          <div>  └─ Dim_Date (Date dimension with day, month, quarter, year, holidays)</div>
        </div>
      </div>

      {/* 2. CDC Mechanics & Mathematical Proof */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            2. Change Data Capture (CDC) Mechanics
          </h4>
          <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
            <li>
              <strong>Non-intrusive Mutation Capture:</strong> Operational transactions are tracked via database triggers or write-ahead logging (WAL) without locking source tables.
            </li>
            <li>
              <strong>Idempotency via Cryptographic Hashing:</strong> Each CDC mutation computes a SHA-256 hash over the composite key and JSON payload. Re-playing a batch never duplicates facts or corrupts dimensional history.
            </li>
            <li>
              <strong>Dual Snapshotting:</strong> Every event stores both <code>old_data</code> (pre-image) and <code>new_data</code> (post-image), enabling full historical lineage and rollback auditing.
            </li>
          </ul>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            3. Pipeline Optimization Formula
          </h4>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 space-y-1.5">
            <div>Time Saved (%) = ((T_full - T_inc) / T_full) * 100</div>
            <div>Speedup Factor = T_full / T_inc</div>
            <div>I/O Reduction (%) = 100 - (Records_delta / Records_total * 100)</div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In our banking benchmark, Full Load ETL scales as <code>O(N)</code> (e.g. 7,500+ records processed in ~3,100 ms).
            In contrast, Incremental CDC scales as <code>O(delta)</code> (e.g. 30-50 records in ~60-140 ms), achieving a
            <strong> ~98% latency reduction</strong> and <strong>50x speedup</strong>.
          </p>
        </div>
      </div>

      {/* 3. Viva Defense & Examination Guide */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          4. Viva Voce & Presentation Defense Q&amp;A Cheat Sheet
        </h3>

        <div className="space-y-4 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-cyan-400">Q1: Why use Change Data Capture (CDC) instead of scheduled Full ETL?</div>
            <p className="text-slate-300">
              Full ETL requires reading all historical rows (table scans), placing shared locks on the OLTP database, and rebuilding the warehouse.
              In 24/7 banking, full batch windows cannot complete in time. CDC captures row-level deltas in near real-time, reducing I/O, network bandwidth, and warehouse ingestion latency by &gt;95%.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-cyan-400">Q2: How does the pipeline handle Slowly Changing Dimensions (SCD)?</div>
            <p className="text-slate-300">
              For Customer profiles (address, tier, risk score), we use <strong>SCD Type 2</strong>: the existing record's <code>is_current</code> is set to False and <code>scd_end_date</code> is marked. A new record with <code>version = version + 1</code>, <code>scd_start_date = now</code>, and <code>is_current = True</code> is created.
              For Account attributes (status = Closed), we apply <strong>SCD Type 1</strong> (in-place update).
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-cyan-400">Q3: How is Idempotency guaranteed in this pipeline?</div>
            <p className="text-slate-300">
              Each CDC event computes a deterministic <code>SHA-256 checksum</code> over the tuple <code>(table, record_id, operation, payload)</code>.
              Before loading into Fact_Transactions or updating dimensions, the pipeline checks if the transaction ID or checksum has already been loaded, preventing duplicate record creation upon pipeline retries.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-cyan-400">Q4: What is the benefit of Kimball's Star Schema in Banking Analytics?</div>
            <p className="text-slate-300">
              A normalized (3NF) relational schema requires expensive multi-table JOINs across 10+ tables for simple aggregation queries.
              The Star Schema de-normalizes context into Dimensions (Customer, Account, Date, Branch) and concentrates numerical metrics in Fact_Transactions, enabling fast OLAP slicing, dicing, and drilldowns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
