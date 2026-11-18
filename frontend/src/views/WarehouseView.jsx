import React, { useState, useEffect } from 'react';
import {
  Layers,
  Database,
  Table,
  Play,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Key,
  Shield,
  Code
} from 'lucide-react';
import { fetchWarehouseTables, fetchTablePreview, executeWarehouseQuery } from '../services/api';

export default function WarehouseView() {
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState('fact_transactions');
  const [tableData, setTableData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // SQL Query Console state
  const [querySql, setQuerySql] = useState("SELECT channel, COUNT(*) as tx_count, ROUND(SUM(amount), 2) as total_volume FROM fact_transactions GROUP BY channel;");
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await fetchWarehouseTables();
      setTables(res.tables);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTablePreview = async (tbl, pg = 1) => {
    try {
      setLoading(true);
      const data = await fetchTablePreview(tbl, pg, 15);
      setTableData(data);
      setPage(pg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (activeTable) {
      loadTablePreview(activeTable, 1);
    }
  }, [activeTable]);

  const handleExecuteQuery = async (e) => {
    if (e) e.preventDefault();
    try {
      setQueryLoading(true);
      setQueryError(null);
      const res = await executeWarehouseQuery(querySql);
      setQueryResult(res);
    } catch (err) {
      setQueryError(err.message);
      setQueryResult(null);
    } finally {
      setQueryLoading(false);
    }
  };

  const currentTableMeta = tables.find((t) => t.table_name === activeTable);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Banking Data Warehouse Explorer (Kimball Star Schema)
          </h3>
          <p className="text-xs text-slate-400">
            Dimensional modeling featuring Fact_Transactions, SCD Type 2 Dim_Customer, Dim_Account, Dim_Branch, and Dim_Date.
          </p>
        </div>
        <button
          onClick={() => { loadTables(); loadTablePreview(activeTable, page); }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Visual Star Schema Topology Cards */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" /> Star Schema Architectural Topology
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {tables.map((t) => {
            const isFact = t.type.includes('FACT');
            const isSelected = activeTable === t.table_name;
            return (
              <button
                key={t.table_name}
                onClick={() => setActiveTable(t.table_name)}
                className={`text-left p-3 rounded-lg border transition ${
                  isSelected
                    ? 'bg-blue-600/20 border-cyan-500 shadow-md'
                    : isFact
                    ? 'bg-slate-900 border-indigo-500/40 hover:border-indigo-400'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isFact ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.type.split(' ')[0]}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-cyan-400">
                    {t.row_count?.toLocaleString()} rows
                  </span>
                </div>
                <div className="font-bold text-white text-xs">{t.display_name}</div>
                <p className="text-[10px] text-slate-400 truncate mt-1">{t.grain}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Table Details & Data Viewer */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        {/* Table Meta Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" />
              {currentTableMeta?.display_name || activeTable}
              <span className="text-xs font-normal text-slate-400 font-mono">({activeTable})</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">{currentTableMeta?.description}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Columns: {tableData?.columns?.length || 0}</span>
            <span>|</span>
            <span>Total Rows: {tableData?.total_rows?.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-800">
              <tr>
                {tableData?.columns?.map((col) => (
                  <th key={col} className="py-2.5 px-3.5 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {tableData?.rows?.length === 0 ? (
                <tr>
                  <td colSpan={tableData?.columns?.length || 1} className="py-6 text-center text-slate-400 font-sans">
                    No records found in {activeTable}.
                  </td>
                </tr>
              ) : (
                tableData?.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    {tableData.columns.map((col) => {
                      const val = row[col];
                      const isKey = col.includes('_key') || col.includes('_id');
                      return (
                        <td
                          key={col}
                          className={`py-2 px-3.5 whitespace-nowrap ${
                            isKey ? 'text-cyan-400 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {val === null || val === undefined ? (
                            <span className="text-slate-600">null</span>
                          ) : typeof val === 'boolean' ? (
                            val ? (
                              <span className="text-emerald-400">TRUE</span>
                            ) : (
                              <span className="text-slate-500">FALSE</span>
                            )
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Page {page} of {Math.max(1, tableData?.total_pages || 1)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTablePreview(activeTable, Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => loadTablePreview(activeTable, Math.min(tableData?.total_pages || 1, page + 1))}
              disabled={page >= (tableData?.total_pages || 1)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytical SQL Query Console */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Interactive Analytical SQL Query Console</h4>
          </div>
          <span className="text-[11px] text-slate-400">Read-Only Analytical SELECT Queries</span>
        </div>

        {/* Sample query shortcuts */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Sample Queries:</span>
          <button
            onClick={() => setQuerySql("SELECT channel, COUNT(*) as tx_count, ROUND(SUM(amount), 2) as total_volume FROM fact_transactions GROUP BY channel;")}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px]"
          >
            Volume by Channel
          </button>
          <button
            onClick={() => setQuerySql("SELECT segment, COUNT(*) as count, ROUND(AVG(risk_score), 1) as avg_risk FROM dim_customer WHERE is_current = 1 GROUP BY segment;")}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px]"
          >
            Customer Segment Risk
          </button>
          <button
            onClick={() => setQuerySql("SELECT transaction_type, COUNT(*) as count, ROUND(AVG(amount), 2) as avg_amount FROM fact_transactions GROUP BY transaction_type;")}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px]"
          >
            Transaction Type Breakdown
          </button>
        </div>

        <form onSubmit={handleExecuteQuery} className="space-y-3">
          <textarea
            rows="3"
            value={querySql}
            onChange={(e) => setQuerySql(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-cyan-300 font-mono text-xs focus:border-cyan-500 outline-none"
            placeholder="Enter SELECT query..."
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={queryLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-lg text-xs transition shadow-md flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{queryLoading ? 'Executing Query...' : 'Execute SQL Query'}</span>
            </button>
          </div>
        </form>

        {queryError && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 font-mono">
            Error: {queryError}
          </div>
        )}

        {/* Query Results */}
        {queryResult && (
          <div className="border border-slate-800 rounded-lg overflow-hidden mt-3">
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 font-medium">
              Returned {queryResult.row_count} rows
            </div>
            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    {queryResult.columns.map((col) => (
                      <th key={col} className="py-2 px-3">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {queryResult.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      {queryResult.columns.map((col) => (
                        <td key={col} className="py-2 px-3 text-slate-200">
                          {String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
