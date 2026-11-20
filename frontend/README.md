# Banking CDC-ETL Data Warehouse - Frontend Dashboard

Enterprise analytical web interface for the **Change Data Capture (CDC) Incremental ETL Banking Data Warehouse**.

---

## 1. Overview & Architecture

The frontend is built using **React 19**, **Vite 8**, and **Tailwind CSS v4** with **Chart.js** for real-time telemetry and visualization. It provides data engineers, architects, and compliance officers with an executive command center to:
- Monitor live CDC mutation streams (`INSERT`, `UPDATE`, `DELETE`) with cryptographic SHA-256 idempotency verification.
- Ingest and validate heterogeneous datasets (CSV, JSON, Excel, Relational DB).
- Trigger on-demand CDC Incremental ETL and Full Warehouse Reloads.
- Execute automated scientific benchmarks measuring latency reduction and throughput speedup.
- Explore the Kimball Star Schema (`Fact_Transactions`, `Dim_Customer` [SCD Type 2], `Dim_Account`, `Dim_Branch`, `Dim_Date`).
- Mine customer behavioral segments, portfolio risk scores, and statistical anomaly indicators.
- Generate and stream financial compliance reports directly to **CSV** or **Excel (`.xlsx`)**.

---

## 2. Component Hierarchy

```
frontend/src/
├── components/
│   ├── Header.jsx              # Navigation header with fast-action triggers & status
│   └── Sidebar.jsx             # Collapsible primary module navigation & engine status
├── views/
│   ├── DashboardView.jsx       # Executive KPI cards, monthly flow, credit/debit liquidity
│   ├── DataSourcesView.jsx     # Disparate sources manager, drag-and-drop uploader
│   ├── CDCMonitorView.jsx      # Real-time CDC stream, payload diff viewer, mutation simulator
│   ├── PipelineView.jsx        # Benchmark comparison suite, metrics, execution audit history
│   ├── WarehouseView.jsx       # Star Schema topology, table viewer, interactive SQL console
│   ├── AnalyticsView.jsx       # Customer tier segmentation, risk scores, anomaly detection
│   ├── ReportsView.jsx         # Transaction ledgers, customer reports, CSV/Excel export
│   └── ArchitectureDocView.jsx # In-app system diagrams, SCD Type 2 mechanics, viva guide
├── services/
│   └── api.js                  # Centralized REST API client connected to FastAPI backend
├── utils/
│   └── chartSetup.js           # Chart.js registration (Line, Bar, Doughnut, Tooltip, Legend)
├── App.jsx                     # Layout shell, global notifications, and auto-refresh loop
├── index.css                   # Tailwind CSS v4 theme, banking navy color tokens
└── main.jsx                    # React 19 application entry point
```

---

## 3. Development & Build Commands

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
# Or on Windows PowerShell:
npm.cmd run dev
```
The application will launch on `http://localhost:5173`. API requests to `/api` are automatically proxied to the backend at `http://127.0.0.1:8000`.

### Production Build
```bash
npm run build
```
Generates an optimized, tree-shaken static production bundle in `dist/`.

### Preview Production Build
```bash
npm run preview
```
