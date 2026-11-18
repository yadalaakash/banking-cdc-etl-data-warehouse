import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ShieldAlert,
  Users,
  Trophy,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import '../utils/chartSetup';
import { fetchSegmentation, fetchAnomaliesAndLeaders } from '../services/api';

export default function AnalyticsView() {
  const [segmentation, setSegmentation] = useState(null);
  const [dataMining, setDataMining] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [segRes, dmRes] = await Promise.all([
        fetchSegmentation(),
        fetchAnomaliesAndLeaders(10)
      ]);
      setSegmentation(segRes);
      setDataMining(dmRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Risk Doughnut
  const riskLabels = segmentation?.risk_distribution?.map((r) => r.tier) || [];
  const riskCounts = segmentation?.risk_distribution?.map((r) => r.count) || [];
  const riskData = {
    labels: riskLabels,
    datasets: [
      {
        data: riskCounts,
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  // KYC Doughnut
  const kycLabels = segmentation?.kyc_status?.map((k) => k.status) || [];
  const kycCounts = segmentation?.kyc_status?.map((k) => k.count) || [];
  const kycData = {
    labels: kycLabels,
    datasets: [
      {
        data: kycCounts,
        backgroundColor: ['#0284c7', '#f59e0b', '#dc2626', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Banking Data Mining & Advanced Analytics
          </h3>
          <p className="text-xs text-slate-400">
            Customer tier segmentation, risk scoring, statistical anomaly detection, and customer activity leaderboards.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Row 1: Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {segmentation?.segments?.map((s) => (
          <div key={s.name} className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.name}</span>
            <div className="text-2xl font-bold text-white mt-1">{s.count.toLocaleString()}</div>
            <span className="text-[11px] text-cyan-400 mt-1 block">Active Customers</span>
          </div>
        ))}
      </div>

      {/* Row 2: Risk Scoring & KYC Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Breakdown */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Customer Portfolio Risk Distribution</h4>
            <p className="text-xs text-slate-400">Calculated from transaction velocity, credit history, and balances</p>
          </div>
          <div className="h-48 my-3 flex items-center justify-center">
            <Doughnut
              data={riskData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } },
              }}
            />
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex justify-between">
            <span>Low Risk: Score &lt; 30</span>
            <span>Medium: 30 - 65</span>
            <span className="text-rose-400 font-bold">High Risk: &gt; 65</span>
          </div>
        </div>

        {/* KYC Verification */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">KYC Compliance & Verification Status</h4>
            <p className="text-xs text-slate-400">Regulatory compliance tracking across all customer profiles</p>
          </div>
          <div className="h-48 my-3 flex items-center justify-center">
            <Doughnut
              data={kycData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } },
              }}
            />
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex justify-between">
            <span>Verified Customer Accounts</span>
            <span className="text-amber-400">Pending Review</span>
          </div>
        </div>
      </div>

      {/* Row 3: Anomaly & Fraud Detection Engine */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Suspicious & Anomalous Transaction Detection Engine</h4>
              <p className="text-xs text-slate-400">Statistical Z-Score outliers (&gt; 0.50 score) and flagged wire transfers</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30">
            {dataMining?.anomalies?.length || 0} Flagged Records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataMining?.anomalies?.map((anom) => (
            <div
              key={anom.transaction_id}
              className="bg-slate-900 border border-rose-500/30 rounded-lg p-3.5 space-y-2 hover:border-rose-500/60 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-400 text-xs font-bold">{anom.transaction_id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  Anomaly: {(anom.anomaly_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-lg font-black text-white">
                ${anom.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-300 space-y-0.5">
                <div>Customer: <strong className="text-white">{anom.customer_name}</strong></div>
                <div>Type & Channel: <span className="text-slate-400">{anom.type} via {anom.channel}</span></div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                <span className="text-slate-400">Fraud Flag:</span>
                <span className={anom.fraud_flag ? "text-rose-400 font-bold" : "text-amber-400"}>
                  {anom.fraud_flag ? "CRITICAL ALERT" : "STATISTICAL OUTLIER"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Top Customers Leaderboard */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Top Customers by Transaction Volume</h4>
              <p className="text-xs text-slate-400">High Net Worth and Corporate leaders aggregated from Fact_Transactions</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Segment Tier</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Transaction Count</th>
                <th className="py-3 px-4 text-right">Total Transacted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {dataMining?.top_customers?.map((cust, idx) => (
                <tr key={cust.customer_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-amber-400 font-sans">#{idx + 1}</td>
                  <td className="py-3 px-4 text-cyan-400">{cust.customer_id}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-white">{cust.name}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-cyan-400 border border-blue-500/20 font-bold">
                      {cust.segment}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300">{cust.city}</td>
                  <td className="py-3 px-4 text-slate-200">{cust.transaction_count} txns</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold text-sm">
                    ${cust.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
