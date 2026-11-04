import React from 'react';
import { 
  DollarSign, 
  Users, 
  Key, 
  Laptop, 
  ShieldCheck, 
  LifeBuoy, 
  TrendingUp, 
  Activity, 
  Calendar,
  ArrowUpRight,
  Shield,
  Layers,
  Database
} from 'lucide-react';
import { MetricsDateRange } from '../../../types';

interface OverviewDashboardTabProps {
  metrics: any;
  dateRange: MetricsDateRange;
  setDateRange: (range: MetricsDateRange) => void;
  onNavigateTab: (tabId: string) => void;
}

export const OverviewDashboardTab: React.FC<OverviewDashboardTabProps> = ({
  metrics,
  dateRange,
  setDateRange,
  onNavigateTab,
}) => {
  const rangeLabels: Record<MetricsDateRange, string> = {
    today: 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last Quarter (90D)',
    this_year: 'This Year (2026)',
    all: 'All Time',
  };

  const grossRevenue = metrics?.grossRevenue || 0;
  const netRevenue = metrics?.netRevenue || 0;
  const refundsTotal = metrics?.refundsTotal || 0;
  const completedOrders = metrics?.completedOrdersCount || 0;
  const mrr = metrics?.mrr || 0;
  const totalCustomers = metrics?.totalCustomers || 0;
  const activeLicenses = metrics?.activeLicenses || 0;
  const devicesActivated = metrics?.totalDevicesActivated || 0;
  const openTickets = metrics?.openSupportTickets || 0;
  const superAdminsCount = metrics?.superAdminsCount || 0;

  return (
    <div className="space-y-6">
      {/* Date Range Selector & Executive Title Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-lg font-bold text-white tracking-tight">Master Owner Executive Dashboard</h2>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
              Live Commercial Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial telemetry, license verification rates, and customer ecosystem analytics.
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {(['today', '7d', '30d', '90d', 'this_year', 'all'] as MetricsDateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                dateRange === r
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Top Row: Financial & Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gross Sales</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              ${grossRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {completedOrders} Orders
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Filtered: {rangeLabels[dateRange]}
          </p>
        </div>

        {/* Net Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Net Revenue</span>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              ${netRevenue.toLocaleString()}
            </span>
            {refundsTotal > 0 && (
              <span className="text-[11px] text-amber-400 font-semibold font-mono">
                -${refundsTotal} refunded
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Est. MRR: ${mrr.toLocaleString()}/mo
          </p>
        </div>

        {/* Active Licenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Licenses</span>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Key className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {activeLicenses}
            </span>
            <span className="text-[11px] text-purple-300 font-semibold">
              of {totalCustomers} Customers
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics?.suspendedLicenses || 0} suspended | {metrics?.expiredLicenses || 0} expired
          </p>
        </div>

        {/* Hardware Devices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Activated PCs</span>
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Laptop className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {devicesActivated}
            </span>
            <span className="text-[11px] text-cyan-300 font-semibold">
              Hardware Nodes
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Windows 10 / 11 64-bit Workstations
          </p>
        </div>
      </div>

      {/* Middle Row: Ecosystem Operations & Quick Jump */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ecosystem Authority Status */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">System Authority & Governance Health</h3>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              100% Operational
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Super Admins</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-2">
                {superAdminsCount} Staff
              </div>
              <p className="text-[10px] text-slate-500 mt-1">SecOps, Licensing & Ops</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Support Desk</span>
                <LifeBuoy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-2">
                {openTickets} Open
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Average response &lt; 2h</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Audit Records</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-2">
                {metrics?.auditLogsCount || 0} Events
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Tamper-proof hash chain</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('licenses')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Issue New License</span>
            </button>
            <button
              onClick={() => onNavigateTab('super_admins')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Super Admins</span>
            </button>
            <button
              onClick={() => onNavigateTab('backups')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Create Encrypted Backup</span>
            </button>
            <button
              onClick={() => onNavigateTab('finance')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Invoices & Refunds</span>
            </button>
          </div>
        </div>

        {/* Master Owner Security Box */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Protected Owner Authority</span>
            </div>
            <h4 className="text-base font-bold text-white mt-2">
              Master Owner Account Protected
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Subordinate Super Admins and employees are cryptographically restricted from altering credentials, disabling security, or deleting the primary Master Owner.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Owner ID:</span>
                <span className="text-indigo-300">owner_josnking01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owner Email:</span>
                <span className="text-indigo-300">josnking01@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">2FA Status:</span>
                <span className="text-emerald-400 font-semibold">Active & Enforced</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('owner_profile')}
            className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Owner Security & Keys</span>
          </button>
        </div>
      </div>
    </div>
  );
};
