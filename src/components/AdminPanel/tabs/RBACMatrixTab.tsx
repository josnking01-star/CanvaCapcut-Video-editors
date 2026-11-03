import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Save, 
  RotateCcw, 
  Check, 
  X, 
  Layers, 
  Info,
  HelpCircle
} from 'lucide-react';
import { 
  RBACRole, 
  ResourceCategory, 
  PermissionAction, 
  RolePermissionsMatrix 
} from '../../../types';
import { 
  ALL_RESOURCES, 
  ALL_ACTIONS, 
  DEFAULT_RBAC_MATRIX 
} from '../../../utils/rbac';

interface RBACMatrixTabProps {
  showToast: (msg: string) => void;
}

export const RBACMatrixTab: React.FC<RBACMatrixTabProps> = ({ showToast }) => {
  const [matrix, setMatrix] = useState<RolePermissionsMatrix>(DEFAULT_RBAC_MATRIX);
  const [selectedRole, setSelectedRole] = useState<RBACRole>('super_admin');
  const [isSaving, setIsSaving] = useState(false);

  const rolesList: { id: RBACRole; label: string; desc: string }[] = [
    { id: 'master_owner', label: 'Master Owner', desc: 'Supreme system authority (Immutable)' },
    { id: 'super_admin', label: 'Super Admin', desc: 'Delegated operational and secops officer' },
    { id: 'administrator', label: 'Administrator', desc: 'Customer operations and license manager' },
    { id: 'manager', label: 'Manager', desc: 'Support desk and ticketing supervisor' },
    { id: 'employee', label: 'Employee', desc: 'Read-only staff and support responder' },
    { id: 'customer', label: 'Customer', desc: 'End-user desktop client isolation' },
  ];

  const fetchMatrix = async () => {
    try {
      const res = await fetch('/api/owner/rbac');
      const data = await res.json();
      if (data && typeof data === 'object') {
        setMatrix(data);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleTogglePermission = (resource: ResourceCategory, action: PermissionAction) => {
    if (selectedRole === 'master_owner') {
      showToast('Master Owner permissions are immutable and permanent.');
      return;
    }

    setMatrix(prev => {
      const currentRoleObj = prev[selectedRole] || {};
      const currentActions = currentRoleObj[resource] || [];
      const hasAction = currentActions.includes(action);

      const nextActions = hasAction
        ? currentActions.filter(a => a !== action)
        : [...currentActions, action];

      return {
        ...prev,
        [selectedRole]: {
          ...currentRoleObj,
          [resource]: nextActions,
        },
      };
    });
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/owner/rbac', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matrix),
      });
      const data = await res.json();
      if (data.success) {
        showToast('RBAC permissions matrix persisted successfully');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to save permissions matrix');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset role permissions to enterprise system defaults?')) {
      setMatrix(DEFAULT_RBAC_MATRIX);
      showToast('Reset to default RBAC matrix. Click Save to persist.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Role-Based Access Control (RBAC) Governance Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure granular action rights (View, Create, Edit, Delete, Export, Approve, Suspend) across all 15 software modules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSaveMatrix}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {rolesList.map(r => {
          const isSelected = selectedRole === r.id;
          const isOwner = r.id === 'master_owner';
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-tight">{r.label}</span>
                {isOwner && <Lock className="w-3 h-3 text-amber-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Role Notice */}
      {selectedRole === 'master_owner' ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Master Owner Authority:</strong> The Master Owner possesses universal, non-revocable permission across all system resources and actions. This guarantee is enforced at the kernel middleware layer.
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Editing permissions for: <strong className="text-white capitalize">{selectedRole.replace('_', ' ')}</strong></span>
          </div>
          <span className="text-[11px] text-indigo-300">Click checkboxes to grant or revoke specific privileges</span>
        </div>
      )}

      {/* Interactive Matrix Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">System Resource</th>
                {ALL_ACTIONS.map(action => (
                  <th key={action} className="py-3 px-3 text-center capitalize">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {ALL_RESOURCES.map(resKey => {
                const currentActions = matrix[selectedRole]?.[resKey] || [];
                const isOwner = selectedRole === 'master_owner';

                return (
                  <tr key={resKey} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-slate-200 capitalize">
                      {resKey.replace('_', ' ')}
                    </td>

                    {ALL_ACTIONS.map(action => {
                      const isAllowed = isOwner || currentActions.includes(action);

                      return (
                        <td key={action} className="py-3 px-3 text-center">
                          <button
                            type="button"
                            disabled={isOwner}
                            onClick={() => handleTogglePermission(resKey, action)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-all mx-auto ${
                              isAllowed
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-950 border border-slate-800 text-slate-600 hover:border-slate-600'
                            } ${isOwner ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            title={`${action} on ${resKey}`}
                          >
                            {isAllowed ? <Check className="w-3.5 h-3.5" /> : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
