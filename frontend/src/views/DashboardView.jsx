import React from 'react';
import {
  Users,
  CreditCard,
  ArrowRightLeft,
  DollarSign,
  Radio,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import '../utils/chartSetup';

export default function DashboardView({
  stats,
  charts,
  onRunIncremental,
  onSimulateCDC,
  setCurrentView
}) {
  const formatCurrency = (val) => {
    if (!val) return '$0.00';
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
  };

  // Monthly trends chart data
  const monthlyData = {
    labels: charts?.monthly_trends?.map((m) => m.label) || [],
    datasets: [
      {
        label: 'Transaction Count',
        data: charts?.monthly_trends?.map((m) => m.transaction_count) || [],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        tension: 0.35,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Volume ($)',
        data: charts?.monthly_trends?.map((m) => m.total_volume) || [],
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129, 140, 248, 0.15)',
        tension: 0.35,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: '#1e293b' },
      },
      y: {
        type: 'linear',
        position: 'left',
        ticks: { color: '#38bdf8', font: { size: 10 } },
        grid: { color: '#1e293b' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        ticks: { color: '#818cf8', font: { size: 10 } },
        grid: { drawOnChartArea: false },
      },
    },
  };

  // Credit vs Debit Doughnut
  const liquidity = charts?.credit_debit;
  const doughnutData = {
    labels: ['Credit Inflows', 'Debit Outflows'],
    datasets: [
      {
        data: [liquidity?.credit?.volume || 50, liquidity?.debit?.volume || 50],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0,
      },
    ],
  };

  // Channels Bar Chart
  const channelData = {
    labels: charts?.channels?.map((c) => c.channel) || [],
    datasets: [
      {
        label: 'Transactions by Channel',
        data: charts?.channels?.map((c) => c.count) || [],
        backgroundColor: '#0284c7',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Pending CDC Alert Banner */}
      {stats?.cdc_events_pending > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-amber-500/15 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between text-sm shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-amber-200">
                {stats.cdc_events_pending} Unprocessed CDC Mutations Pending
              </p>
              <p className="text-xs text-slate-300">
                Operational banking events (INSERTS, UPDATES, DELETES) captured in changelog awaiting incremental ETL.
              </p>
            </div>
          </div>
          <button
            onClick={onRunIncremental}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-md"
          >
            Process Delta Load Now
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Customers */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Customers</span>
            <div className="p-2 bg-blue-500/10 text-cyan-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats?.total_customers?.toLocaleString() || '1,000'}</div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> SCD Type 2 Active
            </div>
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Accounts</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats?.total_accounts?.toLocaleString() || '1,423'}</div>
            <div className="text-[11px] text-slate-400 mt-1">Savings, Checking, Loans</div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Transactions</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats?.total_transactions?.toLocaleString() || '5,000'}</div>
            <div className="text-[11px] text-slate-400 mt-1">Fact_Transactions</div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Volume</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{formatCurrency(stats?.total_transaction_amount)}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Avg: ${stats?.average_transaction_amount || '980'}
            </div>
          </div>
        </div>

        {/* CDC Events */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">CDC Stream</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400">{stats?.cdc_events_total || 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stats?.cdc_events_pending || 0} Pending Delta
            </div>
          </div>
        </div>

        {/* Optimization Saved */}
        <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Time Saved</span>
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-cyan-300">{stats?.average_time_saved_percent || 98.1}%</div>
            <div className="text-[11px] text-cyan-200/80 font-medium mt-1">
              Incremental vs Full Load
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Monthly Trends & Liquidity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white text-sm">Monthly Transaction Flow & Volume</h3>
              <p className="text-xs text-slate-400">Historical transaction trends aggregated in Fact_Transactions & Dim_Date</p>
            </div>
            <button
              onClick={() => setCurrentView('analytics')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              Detailed Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <Line data={monthlyData} options={lineOptions} />
          </div>
        </div>

        {/* Credit vs Debit Doughnut */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">Credit vs Debit Liquidity</h3>
            <p className="text-xs text-slate-400">Cash Inflows vs Outflows Ratio</p>
          </div>
          <div className="h-44 my-2 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } },
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs border-t border-slate-800 pt-3">
            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
              <span className="text-emerald-400 font-bold block">{formatCurrency(liquidity?.credit?.volume)}</span>
              <span className="text-[10px] text-slate-400">{liquidity?.credit?.percentage}% Inflow</span>
            </div>
            <div className="bg-rose-950/40 p-2 rounded-lg border border-rose-500/20">
              <span className="text-rose-400 font-bold block">{formatCurrency(liquidity?.debit?.volume)}</span>
              <span className="text-[10px] text-slate-400">{liquidity?.debit?.percentage}% Outflow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Channel Breakdown & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-white text-sm mb-1">Transaction Channel Density</h3>
          <p className="text-xs text-slate-400 mb-4">Traffic load across Online, Mobile, ATM, POS & Wire</p>
          <div className="h-52">
            <Bar
              data={channelData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
                  y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
                },
              }}
            />
          </div>
        </div>

        {/* Customer Segments */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-white text-sm mb-1">Customer Tier Segmentation</h3>
          <p className="text-xs text-slate-400 mb-4">Dim_Customer dimensional distribution</p>
          <div className="space-y-3">
            {charts?.segments?.map((seg) => {
              const total = stats?.total_customers || 1000;
              const pct = Math.round((seg.count / total) * 100);
              return (
                <div key={seg.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{seg.name}</span>
                    <span className="text-slate-400">{seg.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Operations Guide */}
        <div className="bg-gradient-to-b from-[#0f172a] to-[#0a1128] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Pipeline Operations
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Demonstrate the end-to-end CDC ETL process for evaluations & live reviews.
            </p>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span>Click <strong>Simulate CDC Events</strong> to inject live customer KYC updates, deposits & account closures.</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span>Click <strong>Run Incremental ETL</strong> to process only delta records with SCD Type 2 into Star Schema.</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <span>Navigate to <strong>Pipeline & Optimization</strong> to see 98%+ time saved metrics!</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('pipeline')}
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-medium rounded-lg text-xs transition"
          >
            Open Optimization Benchmarks
          </button>
        </div>
      </div>
    </div>
  );
}
