import React from 'react';
import {
  LayoutDashboard,
  Database,
  Radio,
  Zap,
  Layers,
  BarChart3,
  FileSpreadsheet,
  BookOpen,
  Server,
  Activity
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, pendingCdcCount }) {
  const menuItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'sources', label: 'Data Sources & Ingestion', icon: Database },
    { id: 'cdc', label: 'CDC Stream Monitor', icon: Radio, badge: pendingCdcCount },
    { id: 'pipeline', label: 'Pipeline & Optimization', icon: Zap },
    { id: 'warehouse', label: 'Star Schema Warehouse', icon: Layers },
    { id: 'analytics', label: 'Data Mining & Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet },
    { id: 'architecture', label: 'Architecture & Viva Prep', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-[#0a1128] border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
              FIN-DW <span className="text-xs bg-blue-500/20 text-cyan-400 font-semibold px-1.5 py-0.5 rounded border border-cyan-500/30">CDC</span>
            </h1>
            <p className="text-[11px] text-slate-400">Enterprise Banking DW</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-2">
            Core Modules
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Pipeline Engine
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">ONLINE</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>CDC Mode:</span>
              <span className="text-slate-300">WAL & Log Sim</span>
            </div>
            <div className="flex justify-between">
              <span>Warehouse:</span>
              <span className="text-slate-300">Kimball Star Schema</span>
            </div>
            <div className="flex justify-between">
              <span>SCD Strategy:</span>
              <span className="text-slate-300">SCD Type 2 (Cust)</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
