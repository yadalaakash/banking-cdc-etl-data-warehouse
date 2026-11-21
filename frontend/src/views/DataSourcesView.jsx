import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  AlertCircle,
  HardDrive,
  RefreshCw,
  Layers
} from 'lucide-react';
import { fetchSources, uploadSourceFile, generateSampleFiles, getSampleDownloadUrl } from '../services/api';

export default function DataSourcesView({ onRefreshAll }) {
  const [sourcesData, setSourcesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('customers');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await fetchSources();
      setSourcesData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', selectedEntity);

      const res = await uploadSourceFile(formData);
      setUploadResult(res);
      setSelectedFile(null);
      loadSources();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = async (filename) => {
    window.open(getSampleDownloadUrl(filename), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Heterogeneous Data Source Management</h3>
          <p className="text-xs text-slate-400">
            Ingest and harmonize disparate data from Relational OLTP databases, CSV batch files, JSON API streams, and Excel workbooks.
          </p>
        </div>
        <button
          onClick={loadSources}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Heterogeneous Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sourcesData?.sources?.map((src) => (
          <div key={src.id} className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {src.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">{src.format}</span>
              </div>
              <h4 className="text-sm font-semibold text-white leading-tight">{src.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{src.type}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Sync Strategy:</span>
                <span className="text-slate-300 font-medium text-[11px]">{src.sync_mode}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Records:</span>
                <span className="text-cyan-400 font-semibold">{src.record_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ingestion & Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload Box */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            Upload Heterogeneous Dataset (CSV, JSON, Excel)
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Uploaded records are normalized, staged into staging tables, and registered as CDC events for incremental warehouse loading.
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Entity Schema</label>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:border-cyan-500 outline-none"
                >
                  <option value="customers">Customers (Mapped to StgCustomer & Dim_Customer)</option>
                  <option value="transactions">Transactions (Mapped to StgTransaction & Fact_Transactions)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Select File (CSV, JSON, XLSX)</label>
                <input
                  type="file"
                  accept=".csv,.json,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs flex items-center justify-between">
                <span className="text-slate-300 font-mono">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <span className="text-cyan-400 font-semibold">Ready to Stage</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-lg text-xs transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Parsing & Staging Data...' : 'Upload & Generate CDC Delta'}</span>
            </button>
          </form>

          {/* Upload Success Feedback */}
          {uploadResult && (
            <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Upload & Staging Successful!
              </div>
              <p>Staged Records: <strong>{uploadResult.staged_records}</strong></p>
              <p>Registered CDC Events: <strong>{uploadResult.cdc_events_registered}</strong></p>
              <p className="text-[11px] text-emerald-400">Batch ID: {uploadResult.batch_id}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Download Ready-to-Test Sample Files */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              Pre-built Sample Test Files
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Download these sample datasets to test uploading heterogeneous formats without manual data creation.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">sample_customers.csv</div>
                    <div className="text-[10px] text-slate-400">CSV Customer Schema</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadSample('sample_customers.csv')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-medium border border-slate-700"
                >
                  Download
                </button>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">sample_transactions.json</div>
                    <div className="text-[10px] text-slate-400">JSON API Payload</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadSample('sample_transactions.json')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-medium border border-slate-700"
                >
                  Download
                </button>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">sample_customers.xlsx</div>
                    <div className="text-[10px] text-slate-400">Excel Spreadsheet</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadSample('sample_customers.xlsx')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-medium border border-slate-700"
                >
                  Download
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Current Staging Count: <strong className="text-white">{sourcesData?.staging_counts?.stg_customers || 0}</strong> customers, <strong className="text-white">{sourcesData?.staging_counts?.stg_transactions || 0}</strong> transactions.
          </div>
        </div>
      </div>
    </div>
  );
}
