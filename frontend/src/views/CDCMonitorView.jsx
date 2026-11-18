import React, { useState, useEffect } from 'react';
import {
  Radio,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
  Hash
} from 'lucide-react';
import { fetchCDCEvents, simulateCDCEvents, fetchCDCMetrics } from '../services/api';

export default function CDCMonitorView({ onRefreshAll }) {
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [operationFilter, setOperationFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [processedFilter, setProcessedFilter] = useState('');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [insertCount, setInsertCount] = useState(25);
  const [updateCount, setUpdateCount] = useState(15);
  const [deleteCount, setDeleteCount] = useState(5);

  const loadData = async () => {
    try {
      setLoading(true);
      const isProcVal = processedFilter === '' ? null : processedFilter === 'true';
      const [eventsRes, metricsRes] = await Promise.all([
        fetchCDCEvents(page, 20, operationFilter, tableFilter, isProcVal),
        fetchCDCMetrics()
      ]);
      setEvents(eventsRes.events);
      setTotalPages(eventsRes.total_pages);
      setTotalRecords(eventsRes.total_records);
      setMetrics(metricsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, operationFilter, tableFilter, processedFilter]);

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      await simulateCDCEvents(insertCount, updateCount, deleteCount);
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const getOpBadge = (op) => {
    switch (op) {
      case 'INSERT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">INSERT</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">UPDATE</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">DELETE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400">{op}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* CDC Header & Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Captured Events</span>
          <div className="text-2xl font-bold text-white mt-1">{metrics?.total_events || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Full CDC History</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Pending Delta Backlog</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{metrics?.pending_events || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting Incremental ETL</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Processed & Synchronized</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics?.processed_events || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Loaded into Star Schema</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">Operations Breakdown</span>
          <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
            <span className="text-emerald-400">+{metrics?.operations?.INSERT || 0} Ins</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400">~{metrics?.operations?.UPDATE || 0} Upd</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">-{metrics?.operations?.DELETE || 0} Del</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">SHA256 Idempotency Enabled</span>
        </div>
      </div>

      {/* Simulator Control Box */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Live Banking CDC Mutation Generator</h4>
            <p className="text-xs text-slate-400">Inject synthetic online banking deposits, customer address changes, and account closures.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-400">Inserts:</label>
            <input
              type="number"
              value={insertCount}
              onChange={(e) => setInsertCount(Number(e.target.value))}
              className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-400">Updates:</label>
            <input
              type="number"
              value={updateCount}
              onChange={(e) => setUpdateCount(Number(e.target.value))}
              className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-400">Deletes:</label>
            <input
              type="number"
              value={deleteCount}
              onChange={(e) => setDeleteCount(Number(e.target.value))}
              className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition disabled:opacity-50"
          >
            {isSimulating ? 'Injecting...' : 'Simulate Mutations'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Operation:</span>
            <select
              value={operationFilter}
              onChange={(e) => { setOperationFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
            >
              <option value="">ALL Operations</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Table:</span>
            <input
              type="text"
              placeholder="e.g. customers, transactions"
              value={tableFilter}
              onChange={(e) => { setTableFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Status:</span>
            <select
              value={processedFilter}
              onChange={(e) => { setProcessedFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
            >
              <option value="">ALL Statuses</option>
              <option value="false">Pending Delta</option>
              <option value="true">Processed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>Showing {events.length} of {totalRecords} events</span>
          <button
            onClick={loadData}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CDC Events Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Change ID</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Source Table</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Captured At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Checksum (SHA256)</th>
                <th className="py-3 px-4 text-right">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {events.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-sans">
                    No CDC events found matching criteria.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.change_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-300 font-bold">#{e.change_id}</td>
                    <td className="py-3 px-4">{getOpBadge(e.operation)}</td>
                    <td className="py-3 px-4 text-cyan-400 font-sans font-medium">{e.table_name}</td>
                    <td className="py-3 px-4 text-slate-200">{e.record_id}</td>
                    <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">
                      {e.captured_at?.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {e.is_processed ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Processed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px]" title={e.checksum}>
                      {e.checksum?.substring(0, 12)}...
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedEvent(e)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Page {page} of {Math.max(1, totalPages)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Payload Diff Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  CDC Mutation Event #{selectedEvent.change_id}
                  {getOpBadge(selectedEvent.operation)}
                </h4>
                <p className="text-xs text-slate-400">
                  Table: <strong className="text-white">{selectedEvent.table_name}</strong> | Record ID: <strong className="text-white">{selectedEvent.record_id}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Snapshot */}
                <div>
                  <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5">
                    Before Mutation (Old State)
                  </div>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {selectedEvent.old_data ? JSON.stringify(JSON.parse(selectedEvent.old_data), null, 2) : 'null (New Record INSERT)'}
                  </pre>
                </div>

                {/* New Snapshot */}
                <div>
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                    After Mutation (New State)
                  </div>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {selectedEvent.new_data ? JSON.stringify(JSON.parse(selectedEvent.new_data), null, 2) : 'null (Record DELETED)'}
                  </pre>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg text-slate-400 space-y-1 font-sans text-[11px]">
                <div>Idempotency Checksum: <code className="text-cyan-400 font-mono">{selectedEvent.checksum}</code></div>
                <div>Captured At: <span className="text-slate-300">{selectedEvent.captured_at}</span></div>
                <div>Processing Status: <span className="text-slate-300">{selectedEvent.is_processed ? `Processed at ${selectedEvent.processed_at}` : 'Pending Delta'}</span></div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
