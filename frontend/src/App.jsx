import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import DataSourcesView from './views/DataSourcesView';
import CDCMonitorView from './views/CDCMonitorView';
import PipelineView from './views/PipelineView';
import WarehouseView from './views/WarehouseView';
import AnalyticsView from './views/AnalyticsView';
import ReportsView from './views/ReportsView';
import ArchitectureDocView from './views/ArchitectureDocView';

import { fetchStats, fetchCharts, runIncrementalETL, simulateCDCEvents } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadGlobalData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([fetchStats(), fetchCharts()]);
      setStats(sRes);
      setCharts(cRes);
    } catch (err) {
      console.error('Failed to load global data', err);
    }
  };

  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(loadGlobalData, 12000); // Poll dashboard data every 12s
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRunIncremental = async () => {
    try {
      setIsRunning(true);
      const res = await runIncrementalETL();
      await loadGlobalData();
      showToast(`Incremental ETL: Processed ${res.records_loaded} delta records in ${res.duration_ms} ms!`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSimulateCDC = async () => {
    try {
      setIsRunning(true);
      const res = await simulateCDCEvents(30, 15, 5);
      await loadGlobalData();
      showToast(`CDC Simulator: Injected ${res.total_events} mutations (${res.captured.inserts} ins, ${res.captured.updates} upd, ${res.captured.deletes} del).`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const viewTitles = {
    dashboard: {
      title: 'Executive Admin Dashboard',
      subtitle: 'Overview of banking metrics, CDC change stream, and pipeline optimization statistics',
    },
    sources: {
      title: 'Heterogeneous Data Source Management',
      subtitle: 'Connect, upload, and validate CSV, JSON, Relational DB, and Excel source streams',
    },
    cdc: {
      title: 'Change Data Capture (CDC) Monitoring',
      subtitle: 'Real-time capture of INSERT, UPDATE, and DELETE mutations with cryptographic idempotency',
    },
    pipeline: {
      title: 'ETL/ELT Pipeline Execution & Optimization',
      subtitle: 'Scientific benchmarking comparing Full Warehouse Reload vs Incremental CDC ETL',
    },
    warehouse: {
      title: 'Star Schema Data Warehouse Explorer',
      subtitle: 'Inspect Kimball dimensional tables, SCD Type 2 history, and run analytical queries',
    },
    analytics: {
      title: 'Data Mining & Advanced Analytics',
      subtitle: 'Customer segmentation tiers, risk scoring distribution, and suspicious transaction anomaly detection',
    },
    reports: {
      title: 'Compliance & Analytical Reports',
      subtitle: 'Export transaction ledgers and customer activity directly to CSV or Excel (.xlsx)',
    },
    architecture: {
      title: 'Project Architecture & Viva Preparation',
      subtitle: 'System design diagrams, Kimball star schema models, and viva defense guidelines',
    },
  };

  return (
    <div className="flex min-h-screen bg-[#070d1e] text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        pendingCdcCount={stats?.cdc_events_pending || 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={viewTitles[currentView]?.title || 'Banking Data Warehouse'}
          subtitle={viewTitles[currentView]?.subtitle || ''}
          onRunIncremental={handleRunIncremental}
          onSimulateCDC={handleSimulateCDC}
          onRefresh={loadGlobalData}
          isRunning={isRunning}
          pendingCdcCount={stats?.cdc_events_pending || 0}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="mx-8 mt-4 p-3 bg-gradient-to-r from-blue-900/90 to-cyan-900/90 border border-cyan-500/40 rounded-lg text-xs font-semibold text-cyan-200 shadow-lg flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-cyan-400 hover:text-white ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Main View Container */}
        <main className="p-8 flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              charts={charts}
              onRunIncremental={handleRunIncremental}
              onSimulateCDC={handleSimulateCDC}
              setCurrentView={setCurrentView}
            />
          )}

          {currentView === 'sources' && <DataSourcesView onRefreshAll={loadGlobalData} />}

          {currentView === 'cdc' && <CDCMonitorView onRefreshAll={loadGlobalData} />}

          {currentView === 'pipeline' && <PipelineView onRefreshAll={loadGlobalData} />}

          {currentView === 'warehouse' && <WarehouseView />}

          {currentView === 'analytics' && <AnalyticsView />}

          {currentView === 'reports' && <ReportsView />}

          {currentView === 'architecture' && <ArchitectureDocView />}
        </main>
      </div>
    </div>
  );
}
