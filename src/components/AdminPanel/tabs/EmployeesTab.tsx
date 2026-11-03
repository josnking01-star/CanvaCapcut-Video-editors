import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Lock, 
  Briefcase, 
  CheckCircle2,
  X
} from 'lucide-react';
import { Employee, ResourceCategory } from '../../../types';
import { ALL_RESOURCES } from '../../../utils/rbac';

interface EmployeesTabProps {
  showToast: (msg: string) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({ showToast }) => {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 'emp_01',
      name: 'Usman Ali',
      email: 'usman.ali@omnicut-global.com',
      department: 'Level-1 Customer Support',
      role: 'employee',
      permissions: ['support', 'dashboard'],
      assignedBy: 'josnking01@gmail.com',
      status: 'active',
      createdAt: '2026-02-01T10:00:00Z',
      lastLogin: '2026-11-01T11:20:00Z',
      notes: 'Answers customer bulk rendering and file mapping questions.',
    },
    {
      id: 'emp_02',
      name: 'Ayesha Siddiqui',
      email: 'ayesha.s@omnicut-global.com',
      department: 'Marketing & Affiliate Outreach',
      role: 'manager',
      permissions: ['dashboard', 'customers', 'reports'],
      assignedBy: 'josnking01@gmail.com',
      status: 'active',
      createdAt: '2026-02-15T09:00:00Z',
      lastLogin: '2026-11-01T08:15:00Z',
      notes: 'Oversees customer onboarding and promotional campaigns.',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'manager' | 'employee'>('employee');
  const [selectedPerms, setSelectedPerms] = useState<ResourceCategory[]>(['dashboard', 'support']);

  const handleTogglePerm = (perm: ResourceCategory) => {
    setSelectedPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name,
      email,
      department: department || 'Operations',
      role,
      permissions: selectedPerms,
      assignedBy: 'josnking01@gmail.com',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: 'Never',
    };

    setEmployees(prev => [newEmp, ...prev]);
    showToast(`Staff member ${name} created`);
    setShowAddModal(false);
    setName('');
    setEmail('');
    setDepartment('');
  };

  const handleToggleStatus = (id: string) => {
    setEmployees(prev =>
      prev.map(e => (e.id === id ? { ...e, status: e.status === 'active' ? 'suspended' : 'active' } : e))
    );
    showToast('Employee status updated');
  };

  const handleDelete = (id: string, empName: string) => {
    if (!window.confirm(`Delete staff account for ${empName}?`)) return;
    setEmployees(prev => prev.filter(e => e.id !== id));
    showToast(`Deleted employee ${empName}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Employee & Staff Operational Access Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Delegate day-to-day support, template reviews, and marketing tasks to employees with strictly scoped privileges.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department & Role</th>
              <th className="py-3 px-4">Assigned Permissions</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Active</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-bold text-white">{emp.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{emp.email}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="bg-indigo-950 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-800/60 uppercase">
                    {emp.role}
                  </span>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">{emp.department}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {emp.permissions.map(p => (
                      <span key={p} className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.2 rounded">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {emp.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                  {emp.lastLogin === 'Never' ? 'Never' : new Date(emp.lastLogin).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-4 text-right font-sans">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(emp.id)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
                    >
                      {emp.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="p-1.5 bg-red-950/40 text-red-400 rounded hover:bg-red-900/60"
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

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Enroll Staff / Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="tariq@omnicut.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="Support Desk"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="employee">Staff Employee</option>
                    <option value="manager">Support Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Allowed Privileges</label>
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800 max-h-32 overflow-y-auto">
                  {ALL_RESOURCES.slice(0, 8).map(r => (
                    <label key={r} className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(r)}
                        onChange={() => handleTogglePerm(r)}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                      />
                      <span className="capitalize">{r.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
