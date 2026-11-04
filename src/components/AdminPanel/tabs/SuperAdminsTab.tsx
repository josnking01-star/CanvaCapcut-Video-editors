import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Trash2, 
  RefreshCw, 
  Key, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Mail,
  Shield,
  X
} from 'lucide-react';
import { SuperAdmin, ResourceCategory } from '../../../types';
import { ALL_RESOURCES, MASTER_OWNER_EMAIL } from '../../../utils/rbac';

interface SuperAdminsTabProps {
  showToast: (msg: string) => void;
}

export const SuperAdminsTab: React.FC<SuperAdminsTabProps> = ({ showToast }) => {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Admin Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'administrator' | 'manager'>('super_admin');
  const [newNotes, setNewNotes] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<ResourceCategory[]>([
    'dashboard',
    'customers',
    'licenses',
    'support',
  ]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/owner/super-admins');
      const data = await res.json();
      if (Array.isArray(data)) setAdmins(data);
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load Super Admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleTogglePermission = (resKey: ResourceCategory) => {
    setSelectedPermissions(prev => 
      prev.includes(resKey) ? prev.filter(k => k !== resKey) : [...prev, resKey]
    );
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    try {
      const res = await fetch('/api/owner/super-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          department: newDept,
          role: newRole,
          permissions: selectedPermissions,
          notes: newNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Super Admin ${data.name} created successfully`);
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewDept('');
        setNewNotes('');
        fetchAdmins();
      } else {
        showToast(data.error || 'Failed to create Super Admin');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to create Super Admin');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const res = await fetch(`/api/owner/super-admins/${id}/toggle-status`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Admin status updated to ${data.admin.status}`);
        fetchAdmins();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to toggle status');
    }
  };

  const handleResetPassword = async (id: string, adminName: string) => {
    try {
      const res = await fetch(`/api/owner/super-admins/${id}/reset-password`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Password reset flagged for ${adminName} on next login`);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to flag password reset');
    }
  };

  const handleDeleteAdmin = async (id: string, adminEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete administrative account ${adminEmail}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/owner/super-admins/${id}`, {
        method: 'DELETE',
        headers: {
          'x-actor-role': 'master_owner',
          'x-actor-email': MASTER_OWNER_EMAIL,
        },
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Admin ${adminEmail} removed`);
        fetchAdmins();
      } else {
        showToast(data.error || 'Deletion rejected by security guard');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to delete admin');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Protection Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Super Admin & Subordinate Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Delegate operational tasks with granular resource permissions while enforcing Master Owner protection.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Super Admin</span>
        </button>
      </div>

      {/* Security Rule Callout */}
      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-indigo-300">Master Owner Inviolability Rule:</strong> Super Admins possess delegation rights over customer accounts, licensing keys, and support tickets, but are strictly prohibited by backend middleware from modifying, suspending, or deleting the primary Master Owner account ({MASTER_OWNER_EMAIL}).
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Admin Officer</th>
                <th className="py-3 px-4">Role & Dept</th>
                <th className="py-3 px-4">Resource Permissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {admins.map(admin => (
                <tr key={admin.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={admin.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                        alt={admin.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white text-xs">{admin.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{admin.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <span className="inline-block bg-indigo-950 text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-800/60 uppercase">
                        {admin.role.replace('_', ' ')}
                      </span>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>{admin.department}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                      {admin.permissions.map(p => (
                        <span
                          key={p}
                          className="bg-slate-800 text-slate-300 text-[9px] font-mono px-1.5 py-0.5 rounded"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        admin.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                      <span className="capitalize">{admin.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{admin.lastLogin === 'Never' ? 'Never' : new Date(admin.lastLogin).toLocaleDateString()}</span>
                    </div>
                    {admin.requirePasswordReset && (
                      <span className="text-[10px] text-amber-400 font-semibold block mt-0.5">
                        Reset required on login
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(admin.id, admin.status)}
                        className={`p-1.5 rounded text-xs font-semibold border transition-colors ${
                          admin.status === 'active'
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/50'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                        }`}
                        title={admin.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                      >
                        {admin.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleResetPassword(admin.id, admin.name)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                        title="Force Password Reset"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                        className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded border border-red-800/50 transition-colors"
                        title="Delete Subordinate"
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

      {/* Add Super Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Create New Administrative Staff</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexander Hamilton"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@omnicut-global.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="SecOps / Licensing / Support"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrative Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="super_admin">Super Admin (High Delegation Rights)</option>
                  <option value="administrator">Administrator (Operations & Customers)</option>
                  <option value="manager">Manager (Support & Reports)</option>
                </select>
              </div>

              {/* Granular Permissions Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Assigned Resource Permissions ({selectedPermissions.length} selected)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 max-h-40 overflow-y-auto custom-scrollbar">
                  {ALL_RESOURCES.map(resKey => (
                    <label
                      key={resKey}
                      className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer hover:text-white select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(resKey)}
                        onChange={() => handleTogglePermission(resKey)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span className="capitalize">{resKey.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key responsibilities and reason for delegation..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Create & Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
