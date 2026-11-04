import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Plus, 
  FileCode, 
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';
import { SoftwareUpdatePackage } from '../../../types';

interface SoftwareUpdatesTabProps {
  showToast: (msg: string) => void;
}

export const SoftwareUpdatesTab: React.FC<SoftwareUpdatesTabProps> = ({ showToast }) => {
  const [updates, setUpdates] = useState<SoftwareUpdatePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Publish Form State
  const [version, setVersion] = useState('');
  const [channel, setChannel] = useState<'stable' | 'beta'>('stable');
  const [mandatory, setMandatory] = useState(false);
  const [changelogText, setChangelogText] = useState('');

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/owner/updates');
      const data = await res.json();
      if (Array.isArray(data)) setUpdates(data);
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load software update packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version) return;

    const changelog = changelogText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/owner/updates/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          releaseChannel: channel,
          mandatory,
          changelog,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Published software update: v${data.version}`);
        setShowPublishModal(false);
        setVersion('');
        setChangelogText('');
        fetchUpdates();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to publish update');
    }
  };

  const handleRollback = async (id: string, ver: string) => {
    if (!window.confirm(`Roll back software release v${ver}? Connected client desktop apps will fall back to previous stable baseline.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/owner/updates/${id}/rollback`, { method: 'POST' });
      if (res.ok) {
        showToast(`Rolled back release v${ver}`);
        fetchUpdates();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to rollback update');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Software Version Releases & OTA Update Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publish Windows desktop installer packages, control stable vs beta rollouts, enforce mandatory upgrades, and trigger instant version rollbacks.
          </p>
        </div>

        <button
          onClick={() => setShowPublishModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Version</span>
        </button>
      </div>

      {/* Updates List */}
      <div className="space-y-4">
        {updates.map(pkg => (
          <div
            key={pkg.id}
            className={`p-5 rounded-xl border transition-all ${
              pkg.status === 'published'
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/70 border-amber-900/40 opacity-80'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                  <Laptop className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-mono">v{pkg.version}</h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                        pkg.releaseChannel === 'stable'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      }`}
                    >
                      {pkg.releaseChannel} Channel
                    </span>
                    {pkg.mandatory && (
                      <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30">
                        Mandatory OTA
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Released: {pkg.releaseDate} | Size: {pkg.fileSizeMb} MB
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-md ${
                    pkg.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : pkg.status === 'rolled_back'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  STATUS: {pkg.status.toUpperCase()}
                </span>

                {pkg.status === 'published' && (
                  <button
                    onClick={() => handleRollback(pkg.id, pkg.version)}
                    className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded text-xs font-semibold border border-amber-800/50 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Rollback</span>
                  </button>
                )}
              </div>
            </div>

            {/* Changelog & Checksum */}
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Changelog & Feature Deliverables:
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {pkg.changelog.map((log, idx) => (
                    <li key={idx}>{log}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="truncate max-w-lg">
                  <span className="text-slate-600">SHA-256: </span>
                  <span className="text-indigo-300">{pkg.checksumSha256}</span>
                </div>
                <div className="shrink-0 text-slate-500">Min Ver: {pkg.minSupportedVersion}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Publish New Version Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Publish Software Release</h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Version String</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3.2.0-win-x64"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Release Channel</label>
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="stable">Stable (Production)</option>
                    <option value="beta">Beta (Preview)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mandatory}
                      onChange={e => setMandatory(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                    />
                    <span>Mandatory Upgrade</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Changelog (1 per line)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Feature enhancement 1&#10;Bugfix 2&#10;Security patch 3..."
                  value={changelogText}
                  onChange={e => setChangelogText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                >
                  Sign & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
