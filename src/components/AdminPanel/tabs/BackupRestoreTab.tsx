import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  RotateCcw, 
  ShieldCheck, 
  Plus, 
  Clock, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { BackupRecord } from '../../../types';

interface BackupRestoreTabProps {
  showToast: (msg: string) => void;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({ showToast }) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupType, setBackupType] = useState<BackupRecord['type']>('full');
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/owner/backups');
      const data = await res.json();
      if (Array.isArray(data)) setBackups(data);
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load backup snapshots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/owner/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: backupType }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Created encrypted backup: ${data.fileName}`);
        fetchBackups();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to create backup snapshot');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreBackup = async (backupId: string, fileName: string) => {
    if (!window.confirm(`RESTORE DATABASE WARNING: Restoring from "${fileName}" will synchronize state to this snapshot. An automated Pre-Restore Safety Snapshot will be generated first. Proceed?`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await fetch(`/api/owner/backups/${backupId}/restore`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Database restored successfully');
        fetchBackups();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to restore backup snapshot');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDownloadBackup = (backupId: string) => {
    window.location.href = `/api/owner/backups/${backupId}/download`;
    showToast('Download initiated for encrypted snapshot');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Disaster Recovery & Encrypted Backup Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate immutable cryptographic snapshots with customer credentials, license registries, and financial ledger data.
          </p>
        </div>

        <button
          onClick={fetchBackups}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Backup Creation Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Generate Instant Encrypted Snapshot</h3>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pre-Restore Safety Active</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-64">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Backup Target Scope</label>
            <select
              value={backupType}
              onChange={e => setBackupType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="full">Complete System (Customers, Licenses, Finance, Settings)</option>
              <option value="customers">Customers & Licenses Only</option>
              <option value="finance">Financial Orders & Invoices Only</option>
              <option value="settings">White-Label & System Policies Only</option>
            </select>
          </div>

          <div className="w-full sm:w-auto pt-5">
            <button
              onClick={handleCreateBackup}
              disabled={isCreating}
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{isCreating ? 'Packaging Snapshot...' : 'Create Snapshot Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Snapshots History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Snapshot Archive</th>
                <th className="py-3 px-4">Scope & Size</th>
                <th className="py-3 px-4">Archived Records</th>
                <th className="py-3 px-4">Created Timestamp</th>
                <th className="py-3 px-4">Security</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {backups.map(bak => (
                <tr key={bak.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate max-w-[220px]">{bak.fileName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="bg-indigo-950 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-800/60 uppercase">
                      {bak.type}
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">{bak.sizeKb} KB</span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                    <div>{bak.itemCounts.customers} Clients | {bak.itemCounts.licenses} Keys</div>
                    <div className="text-slate-500 text-[10px]">{bak.itemCounts.orders} Orders</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    <div>{new Date(bak.createdAt).toLocaleString()}</div>
                    <div className="text-slate-500 text-[10px] truncate max-w-[140px] font-sans">By: {bak.createdBy}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                      <Lock className="w-3.5 h-3.5" />
                      <span>AES-256</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDownloadBackup(bak.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
                        title="Download JSON Snapshot"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => handleRestoreBackup(bak.id, bak.fileName)}
                        disabled={isRestoring}
                        className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded text-xs font-semibold border border-amber-800/50 flex items-center gap-1 transition-colors disabled:opacity-50"
                        title="Restore Database with Pre-Safety Snapshot"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
