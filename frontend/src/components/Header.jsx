import React from 'react';
import { Play, Sparkles, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export default function Header({
  title,
  subtitle,
  onRunIncremental,
  onSimulateCDC,
  onRefresh,
  isRunning,
  pendingCdcCount
}) {
  return (
    <header className="h-18 bg-[#0a1128]/90 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRunning}
          title="Refresh Dashboard Data"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Simulate CDC Events Button */}
        <button
          onClick={onSimulateCDC}
          disabled={isRunning}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulate CDC Events</span>
        </button>

        {/* Run Incremental ETL Button */}
        <button
          onClick={onRunIncremental}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50"
        >
          <Zap className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
          <span>{isRunning ? 'Processing...' : 'Run Incremental ETL'}</span>
          {pendingCdcCount > 0 && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingCdcCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
