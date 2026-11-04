import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Key, 
  AlertTriangle, 
  Save, 
  Plus, 
  Trash2, 
  Cpu, 
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { SecurityPolicy } from '../../../types';

interface SecurityCenterTabProps {
  showToast: (msg: string) => void;
}

export const SecurityCenterTab: React.FC<SecurityCenterTabProps> = ({ showToast }) => {
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [newBlacklistIp, setNewBlacklistIp] = useState('');
  const [newWhitelistIp, setNewWhitelistIp] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPolicy = async () => {
    try {
      const res = await fetch('/api/owner/security/policy');
      const data = await res.json();
      setPolicy(data);
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load security policy');
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleSavePolicy = async () => {
    if (!policy) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/owner/security/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Cybersecurity policies saved and activated');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to save security policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockIp = async (ip: string) => {
    try {
      const res = await fetch('/api/owner/security/unlock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`IP ${ip} unlocked successfully`);
        fetchPolicy();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to unlock IP');
    }
  };

  const handleAddBlacklist = async () => {
    if (!newBlacklistIp.trim()) return;
    try {
      const res = await fetch('/api/owner/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newBlacklistIp.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Added ${newBlacklistIp} to security blacklist`);
        setNewBlacklistIp('');
        fetchPolicy();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to add IP to blacklist');
    }
  };

  const handleRemoveBlacklist = (ip: string) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      ipBlacklist: policy.ipBlacklist.filter(item => item !== ip),
    });
  };

  const handleAddWhitelist = () => {
    if (!policy || !newWhitelistIp.trim()) return;
    if (!policy.ipWhitelist.includes(newWhitelistIp.trim())) {
      setPolicy({
        ...policy,
        ipWhitelist: [...policy.ipWhitelist, newWhitelistIp.trim()],
      });
      setNewWhitelistIp('');
    }
  };

  const handleRemoveWhitelist = (ip: string) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      ipWhitelist: policy.ipWhitelist.filter(item => item !== ip),
    });
  };

  if (!policy) {
    return <div className="text-slate-400 text-sm py-8 text-center">Loading security policy telemetry...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Enterprise Cybersecurity & Threat Mitigation Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforce mandatory 2FA on subordinate staff, throttle brute-force credential attacks, and inspect cryptographic ciphers.
          </p>
        </div>

        <button
          onClick={handleSavePolicy}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Enforcing...' : 'Enforce Security Policy'}</span>
        </button>
      </div>

      {/* Cryptographic Protection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Offline License Cryptography</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white mt-2 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SHA-256 HMAC + RSA</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Air-gapped verification cipher</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Snapshot Encryption</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-white mt-2 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>AES-256 CBC Vault</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Database & credential backups</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Windows EXE Authenticity</span>
            <FileCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white mt-2 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>Code Signed NSIS</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Anti-tamper binary manifest</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access Policies Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Key className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Authentication & Account Lockout Policies</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Enforce 2FA for All Super Admins</span>
                <span className="text-[11px] text-slate-400">Mandates TOTP QR authentication on all staff accounts</span>
              </div>
              <input
                type="checkbox"
                checked={policy.twoFactorRequiredForAdmins}
                onChange={e => setPolicy({ ...policy, twoFactorRequiredForAdmins: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Max Failed Logins</label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={policy.maxLoginAttempts}
                  onChange={e => setPolicy({ ...policy, maxLoginAttempts: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Lockout Duration (Mins)</label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={policy.lockoutDurationMinutes}
                  onChange={e => setPolicy({ ...policy, lockoutDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Session Timeout (Mins)</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={policy.sessionTimeoutMinutes}
                  onChange={e => setPolicy({ ...policy, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Password Expiry (Days)</label>
                <input
                  type="number"
                  min={30}
                  max={365}
                  value={policy.passwordExpiryDays}
                  onChange={e => setPolicy({ ...policy, passwordExpiryDays: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active IP Lockouts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Active Automated IP Lockouts</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {policy.activeLockouts.length} Quarantined
            </span>
          </div>

          {policy.activeLockouts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No active brute-force lockouts detected.</p>
          ) : (
            <div className="space-y-2">
              {policy.activeLockouts.map(lock => (
                <div
                  key={lock.ip}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs"
                >
                  <div>
                    <div className="text-amber-300 font-bold">{lock.ip}</div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      {lock.failedAttempts} Failed Attempts | Locked until {new Date(lock.lockedUntil).toLocaleTimeString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnlockIp(lock.ip)}
                    className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Unlock</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add IP to Blacklist */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Add IP to Permanent Blacklist
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 185.220.101.5"
                value={newBlacklistIp}
                onChange={e => setNewBlacklistIp(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={handleAddBlacklist}
                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Block IP</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
