import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Check, 
  Laptop, 
  Key, 
  Trash2, 
  AlertTriangle,
  Building,
  Mail,
  Shield,
  Eye,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Customer, License } from '../../../types';

interface CustomersTabProps {
  showToast: (msg: string) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ showToast }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'trial' | 'expired'>('all');
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [tier, setTier] = useState<License['tier']>('pro');
  const [maxDevices, setMaxDevices] = useState(3);
  const [notes, setNotes] = useState('');

  // Customer Profile Detail Modal
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast('Copied license key');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          licenseTier: tier,
          maxDevices,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Customer ${data.customer.name} enrolled with key: ${data.customer.licenseKey}`);
        setShowAddModal(false);
        setName('');
        setEmail('');
        setCompany('');
        setNotes('');
        fetchCustomers();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to create customer');
    }
  };

  const handleToggleStatus = async (cust: Customer) => {
    const nextStatus = cust.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/customers/${cust.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Customer status updated to ${nextStatus}`);
        fetchCustomers();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to update status');
    }
  };

  const handleDeleteCustomer = async (id: string, custEmail: string) => {
    if (!window.confirm(`Delete customer ${custEmail} and invalidate their license?`)) return;

    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Customer ${custEmail} deleted`);
        fetchCustomers();
        if (selectedCust?.id === id) setSelectedCust(null);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to delete customer');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Company', 'Status', 'Tier', 'LicenseKey', 'CreatedDate', 'ExpiresDate'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      c.email,
      `"${c.company || ''}"`,
      c.status,
      c.licenseTier,
      c.licenseKey,
      c.createdDate,
      c.expiresDate,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniCut_Customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Exported customers to CSV');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(customers, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniCut_Customers_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Exported customers to JSON');
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.licenseKey.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Customer Management Directory</h2>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              {customers.length} Commercial Clients
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain customer records, monitor activated hardware seats, issue replacement keys, and isolate customer data.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
            title="Download JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Customer</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 border border-slate-800/80 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, company, key..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1" />
          {(['all', 'active', 'suspended', 'trial', 'expired'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Client Name & Org</th>
                <th className="py-3 px-4">License Key</th>
                <th className="py-3 px-4">Tier & Seats</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Enrolled / Exp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCustomers.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{cust.name}</span>
                        {cust.company && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({cust.company})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{cust.email}</div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleCopyKey(cust.licenseKey)}
                      className="font-mono text-[11px] text-indigo-300 hover:text-indigo-200 bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-center gap-1.5 group transition-colors"
                      title="Click to copy key"
                    >
                      <span>{cust.licenseKey}</span>
                      {copiedKey === cust.licenseKey ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                      )}
                    </button>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <span className="inline-block bg-purple-950 text-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-800/60 uppercase">
                        {cust.licenseTier.replace('_', ' ')}
                      </span>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Laptop className="w-3 h-3 text-slate-500" />
                        <span>{cust.activatedDevices} / {cust.maxDevices} PCs</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cust.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : cust.status === 'trial'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : cust.status === 'suspended'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <span className="capitalize">{cust.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[11px] font-mono text-slate-400">
                    <div>Since: {cust.createdDate}</div>
                    <div className="text-slate-500 text-[10px]">Exp: {cust.expiresDate}</div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedCust(cust)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                        title="View Full Profile & Devices"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(cust)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          cust.status === 'active'
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/50'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                        }`}
                      >
                        {cust.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleDeleteCustomer(cust.id, cust.email)}
                        className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded border border-red-800/50 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Client Entitlement Profile</h3>
              </div>
              <button
                onClick={() => setSelectedCust(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Full Name:</span>
                  <span className="text-white font-bold">{selectedCust.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Email:</span>
                  <span className="text-indigo-300">{selectedCust.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Company:</span>
                  <span className="text-slate-300">{selectedCust.company || 'Individual Pro'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">License Key:</span>
                  <span className="text-amber-300 font-bold">{selectedCust.licenseKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Entitlement Tier:</span>
                  <span className="text-purple-300 uppercase">{selectedCust.licenseTier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Seat Quota:</span>
                  <span className="text-slate-300">{selectedCust.activatedDevices} of {selectedCust.maxDevices} Workstations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Expires On:</span>
                  <span className="text-slate-300">{selectedCust.expiresDate}</span>
                </div>
              </div>

              {selectedCust.notes && (
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-500 block mb-1">Administrative Notes:</span>
                  <p className="text-slate-300">{selectedCust.notes}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCust(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Enroll New Commercial Customer</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Sterling"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="jessica@studio.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="Sterling Motion Labs LLC"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">License Tier</label>
                  <select
                    value={tier}
                    onChange={e => setTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="trial">Trial (14 Days)</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro Studio Elite</option>
                    <option value="agency_unlimited">Enterprise Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Devices</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxDevices}
                    onChange={e => setMaxDevices(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Notes</label>
                <textarea
                  rows={2}
                  placeholder="Commercial contract details or special instructions..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                >
                  Generate Key & Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
