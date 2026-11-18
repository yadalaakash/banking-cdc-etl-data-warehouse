import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search
} from 'lucide-react';
import { fetchReportData, getExportUrl } from '../services/api';

export default function ReportsView() {
  const [reportType, setReportType] = useState('transactions');
  const [reportData, setReportData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadReport = async (type, pg = 1) => {
    try {
      setLoading(true);
      const res = await fetchReportData(type, pg, 25);
      setReportData(res);
      setPage(pg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(reportType, 1);
  }, [reportType]);

  const handleExport = (format) => {
    const url = getExportUrl(reportType, format);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Compliance, Audit & Analytical Reports
          </h3>
          <p className="text-xs text-slate-400">
            Generate and export transaction ledgers, customer profiles, CDC audit traces, and pipeline execution logs.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export to CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-lg text-xs transition shadow-md flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export to Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex border-b border-slate-800 text-xs gap-6">
        <button
          onClick={() => setReportType('transactions')}
          className={`pb-3 font-semibold transition border-b-2 ${
            reportType === 'transactions'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Transaction Ledger Report
        </button>
        <button
          onClick={() => setReportType('customers')}
          className={`pb-3 font-semibold transition border-b-2 ${
            reportType === 'customers'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Customer KYC & Activity Report
        </button>
      </div>

      {/* Report Data Table Container */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{reportData?.data?.length || 0}</strong> records on page {page} of {reportData?.total_pages || 1}
            <span className="ml-2 text-cyan-400 font-bold">({reportData?.total_records?.toLocaleString() || 0} total)</span>
          </div>
          <button
            onClick={() => loadReport(reportType, page)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-800">
              {reportType === 'transactions' ? (
                <tr>
                  <th className="py-3 px-4">Txn ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">DW Loaded At</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Tier Segment</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">SCD Version</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {reportData?.data?.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  {reportType === 'transactions' ? (
                    <>
                      <td className="py-2.5 px-4 text-cyan-400 font-bold">{row.transaction_id}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-200">{row.customer_name} ({row.customer_id})</td>
                      <td className="py-2.5 px-4 font-sans text-slate-300">{row.type}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-400">{row.channel}</td>
                      <td className="py-2.5 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.direction === 'Credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {row.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-white font-bold">${row.amount?.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-slate-400">${row.balance_after?.toFixed(2)}</td>
                      <td className="py-2.5 px-4 font-sans text-emerald-400">{row.status}</td>
                      <td className="py-2.5 px-4 text-slate-400 font-sans text-[10px]">{row.loaded_at?.substring(0, 19)}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 px-4 text-cyan-400 font-bold">{row.customer_id}</td>
                      <td className="py-2.5 px-4 font-sans font-semibold text-white">{row.name}</td>
                      <td className="py-2.5 px-4 text-slate-400">{row.email}</td>
                      <td className="py-2.5 px-4 text-slate-400">{row.phone}</td>
                      <td className="py-2.5 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-cyan-400 border border-blue-500/20 font-bold">
                          {row.segment}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-emerald-400">{row.kyc_status}</td>
                      <td className="py-2.5 px-4 text-slate-300">{row.risk_score}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-300">{row.city}, {row.state}</td>
                      <td className="py-2.5 px-4 text-cyan-300 font-bold">v{row.version}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Page {page} of {Math.max(1, reportData?.total_pages || 1)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadReport(reportType, Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => loadReport(reportType, Math.min(reportData?.total_pages || 1, page + 1))}
              disabled={page >= (reportData?.total_pages || 1)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
