import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Laptop, 
  SlidersHorizontal, 
  DollarSign, 
  FileCheck, 
  Download, 
  LifeBuoy, 
  Activity, 
  Lock, 
  Layers, 
  Package, 
  Database, 
  Upload, 
  UserCheck, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  Shield,
  Eye
} from 'lucide-react';
import { MetricsDateRange } from '../../types';
import { MASTER_OWNER_EMAIL } from '../../utils/rbac';

// Modular Tabs
import { OverviewDashboardTab } from './tabs/OverviewDashboardTab';
import { OwnerProfileTab } from './tabs/OwnerProfileTab';
import { SuperAdminsTab } from './tabs/SuperAdminsTab';
import { RBACMatrixTab } from './tabs/RBACMatrixTab';
import { CustomersTab } from './tabs/CustomersTab';
import { LicensesTab } from './tabs/LicensesTab';
import { ProductsEditionsTab } from './tabs/ProductsEditionsTab';
import { FinanceSalesTab } from './tabs/FinanceSalesTab';
import { GlobalSettingsTab } from './tabs/GlobalSettingsTab';
import { SecurityCenterTab } from './tabs/SecurityCenterTab';
import { BackupRestoreTab } from './tabs/BackupRestoreTab';
import { SoftwareUpdatesTab } from './tabs/SoftwareUpdatesTab';
import { CustomerSupportTab } from './tabs/CustomerSupportTab';
import { SystemHealthTab } from './tabs/SystemHealthTab';
import { AuditTrailTab } from './tabs/AuditTrailTab';
import { PriceLockTab } from './tabs/PriceLockTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { EmployeesTab } from './tabs/EmployeesTab';
import { MarketingBroadcastTab } from './tabs/MarketingBroadcastTab';
import { CustomerPortalPreviewModal } from './tabs/CustomerPortalPreviewModal';

import { 
  CreditCard,
  Briefcase,
  Megaphone
} from 'lucide-react';

export type AdminTabId = 
  | 'overview'
  | 'owner_profile'
  | 'super_admins'
  | 'employees'
  | 'rbac'
  | 'customers'
  | 'licenses'
  | 'products'
  | 'price_lock'
  | 'payments'
  | 'marketing'
  | 'finance'
  | 'settings'
  | 'security'
  | 'backups'
  | 'updates'
  | 'support'
  | 'health'
  | 'audit';

export const AdminDashboard: React.FC = () => {
  const { showToast, whiteLabel } = useStudio();
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [dateRange, setDateRange] = useState<MetricsDateRange>('all');
  const [metrics, setMetrics] = useState<any>(null);
  const [showCustomerPreview, setShowCustomerPreview] = useState(false);

  const fetchMetrics = async (range: MetricsDateRange) => {
    try {
      const res = await fetch(`/api/owner/metrics?range=${range}`);
      const data = await res.json();
      setMetrics(data);
    } catch (err: unknown) {
      console.error('Failed to load metrics:', err);
    }
  };

  useEffect(() => {
    fetchMetrics(dateRange);
  }, [dateRange]);

  const navSections = [
    {
      group: 'EXECUTIVE & GOVERNANCE',
      items: [
        { id: 'overview', label: 'Executive Dashboard', icon: Activity, badge: null },
        { id: 'owner_profile', label: 'Master Owner Profile', icon: UserCheck, badge: 'ROOT' },
        { id: 'super_admins', label: 'Super Admins & Delegation', icon: Users, badge: null },
        { id: 'employees', label: 'Staff & Employees', icon: Briefcase, badge: 'STAFF' },
        { id: 'rbac', label: 'RBAC Permission Matrix', icon: Layers, badge: null },
      ],
    },
    {
      group: 'COMMERCIAL OPERATIONS',
      items: [
        { id: 'customers', label: 'Customers Directory', icon: Users, badge: metrics?.totalCustomers ? `${metrics.totalCustomers}` : null },
        { id: 'licenses', label: 'Licenses & Activations', icon: Key, badge: metrics?.activeLicenses ? `${metrics.activeLicenses}` : null },
        { id: 'products', label: 'Products & Editions', icon: Package, badge: null },
        { id: 'price_lock', label: 'Price Lock & Grandfathering', icon: Lock, badge: 'RULE 11' },
        { id: 'finance', label: 'Sales & Invoices', icon: DollarSign, badge: metrics?.netRevenue ? `$${metrics.netRevenue}` : null },
        { id: 'payments', label: 'Payment Gateways & Slips', icon: CreditCard, badge: 'MULTI-PAY' },
        { id: 'marketing', label: 'Marketing & Broadcasts', icon: Megaphone, badge: 'CAMPAIGNS' },
        { id: 'support', label: 'Customer Help Desk', icon: LifeBuoy, badge: metrics?.openSupportTickets ? `${metrics.openSupportTickets}` : null },
      ],
    },
    {
      group: 'SYSTEM & SECURITY',
      items: [
        { id: 'settings', label: 'Global White-Label', icon: SlidersHorizontal, badge: null },
        { id: 'security', label: 'Cybersecurity Center', icon: ShieldCheck, badge: '2FA' },
        { id: 'backups', label: 'Disaster Recovery', icon: Database, badge: null },
        { id: 'updates', label: 'Software OTA Releases', icon: Upload, badge: 'v3.0' },
        { id: 'health', label: 'Diagnostic Health', icon: Activity, badge: '100%' },
        { id: 'audit', label: 'Tamper-Proof Audit Trail', icon: Terminal, badge: null },
      ],
    },
  ];

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden select-none">
      {/* Master Owner Top Command Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-md border border-indigo-500/30">
            <ShieldCheck className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-white tracking-tight">
                MASTER OWNER COMMAND CENTER
              </h1>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-mono font-black px-1.5 py-0.2 rounded uppercase">
                SUPREME AUTHORITY
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Root Verified: <strong className="text-indigo-300">{MASTER_OWNER_EMAIL}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Test Customer App Portal Button */}
          <button
            onClick={() => setShowCustomerPreview(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Preview Customer App Portal</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Sidebar + Scrollable Panel Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar p-3 space-y-6">
          <div className="space-y-5">
            {navSections.map(section => (
              <div key={section.group} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {section.group}
                </div>
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as AdminTabId)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                            isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Master Protection Callout in Sidebar Footer */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/20 text-[10px] text-slate-400 leading-snug">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-1 font-mono">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>OWNER GUARD ACTIVE</span>
            </div>
            Subordinates cannot delete or alter Master Owner credentials.
          </div>
        </aside>

        {/* Tab View Container */}
        <div className="flex-1 bg-slate-950 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            {activeTab === 'overview' && (
              <OverviewDashboardTab
                metrics={metrics}
                dateRange={dateRange}
                setDateRange={setDateRange}
                onNavigateTab={(tabId) => setActiveTab(tabId as AdminTabId)}
              />
            )}

            {activeTab === 'owner_profile' && (
              <OwnerProfileTab showToast={showToast} />
            )}

            {activeTab === 'super_admins' && (
              <SuperAdminsTab showToast={showToast} />
            )}

            {activeTab === 'employees' && (
              <EmployeesTab showToast={showToast} />
            )}

            {activeTab === 'rbac' && (
              <RBACMatrixTab showToast={showToast} />
            )}

            {activeTab === 'customers' && (
              <CustomersTab showToast={showToast} />
            )}

            {activeTab === 'licenses' && (
              <LicensesTab showToast={showToast} />
            )}

            {activeTab === 'products' && (
              <ProductsEditionsTab showToast={showToast} />
            )}

            {activeTab === 'price_lock' && (
              <PriceLockTab showToast={showToast} />
            )}

            {activeTab === 'finance' && (
              <FinanceSalesTab showToast={showToast} />
            )}

            {activeTab === 'payments' && (
              <PaymentsTab showToast={showToast} />
            )}

            {activeTab === 'marketing' && (
              <MarketingBroadcastTab showToast={showToast} />
            )}

            {activeTab === 'settings' && (
              <GlobalSettingsTab showToast={showToast} />
            )}

            {activeTab === 'security' && (
              <SecurityCenterTab showToast={showToast} />
            )}

            {activeTab === 'backups' && (
              <BackupRestoreTab showToast={showToast} />
            )}

            {activeTab === 'updates' && (
              <SoftwareUpdatesTab showToast={showToast} />
            )}

            {activeTab === 'support' && (
              <CustomerSupportTab showToast={showToast} />
            )}

            {activeTab === 'health' && (
              <SystemHealthTab showToast={showToast} />
            )}

            {activeTab === 'audit' && (
              <AuditTrailTab showToast={showToast} />
            )}
          </div>
        </div>
      </div>

      {/* Customer Desktop App Portal Preview Modal */}
      {showCustomerPreview && (
        <CustomerPortalPreviewModal onClose={() => setShowCustomerPreview(false)} />
      )}
    </div>
  );
};
