import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Laptop, 
  QrCode, 
  Copy, 
  Check, 
  Trash2, 
  AlertTriangle,
  Lock,
  Unlock,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import { MasterOwnerProfile } from '../../../types';

interface OwnerProfileTabProps {
  showToast: (msg: string) => void;
}

export const OwnerProfileTab: React.FC<OwnerProfileTabProps> = ({ showToast }) => {
  const [profile, setProfile] = useState<MasterOwnerProfile | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [title, setTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/owner/profile');
      const data = await res.json();
      setProfile(data);
      setPhone(data.phone || '');
      setEmergencyEmail(data.emergencyEmail || '');
      setTitle(data.title || '');
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, emergencyEmail, title }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Master Owner profile details updated successfully');
        setProfile(data.profile);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      const res = await fetch('/api/owner/profile/toggle-2fa', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Master 2FA is now ${data.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}`);
        fetchProfile();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to toggle 2FA');
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const res = await fetch('/api/owner/profile/revoke-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Trusted hardware device revoked');
        fetchProfile();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to revoke device');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied recovery code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!profile) {
    return <div className="text-slate-400 text-sm py-8 text-center">Loading Master Owner Security Profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Supreme Authority Status Card */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg border border-indigo-400/30">
            <ShieldCheck className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">{profile.name}</h2>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase">
                ULTIMATE OWNER
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5 font-medium">{profile.title}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Primary Authority: {profile.email}</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-right shrink-0">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Immutable Status</div>
          <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Protected Against Subordinate Deletion</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Super Admins cannot modify this account</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Master Credentials & Profile Edit Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Executive Authority Details</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Master Owner Email (Root Identity)
              </label>
              <input
                type="text"
                disabled
                value={profile.email}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono cursor-not-allowed select-all"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Permanently locked for system security and software license signing authenticity.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Executive Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Primary Mobile Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Air-gapped Emergency Email
                </label>
                <input
                  type="email"
                  value={emergencyEmail}
                  onChange={e => setEmergencyEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Executive Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication (2FA) & TOTP Generator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h3>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                profile.twoFactorEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
              }`}
            >
              {profile.twoFactorEnabled ? '2FA ACTIVE' : '2FA DISABLED'}
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Standard TOTP (Google Authenticator / YubiKey compatible). Required for high-risk operations such as database restoration, master updates, and ownership verification.
          </p>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center gap-4">
            <div className="p-2.5 bg-white rounded-lg shrink-0">
              <QrCode className="w-12 h-12 text-slate-950" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">TOTP Base32 Key</span>
              <div className="text-xs font-mono font-bold text-indigo-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                {profile.twoFactorSecret}
              </div>
              <p className="text-[10px] text-slate-500">Scan QR in Google Authenticator or 1Password</p>
            </div>
          </div>

          {/* Emergency Backup Recovery Codes */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">Emergency Recovery Codes</span>
              <span className="text-[10px] text-slate-500">8 one-time cryptographic keys</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {profile.recoveryCodes.map((code, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCopyCode(code)}
                  className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 rounded font-mono text-[11px] text-slate-300 text-left flex items-center justify-between transition-colors group"
                >
                  <span>{code}</span>
                  {copiedCode === code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trusted Hardware Devices Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Owner Trusted Hardware Devices</h3>
          </div>
          <span className="text-xs text-slate-400">
            {profile.trustedDevices.length} Authorized Terminals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.trustedDevices.map(dev => (
            <div
              key={dev.deviceId}
              className={`p-4 rounded-xl border transition-all ${
                dev.current
                  ? 'bg-slate-950 border-indigo-500/50 shadow-md'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className={`w-4 h-4 ${dev.current ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-white">{dev.deviceName}</span>
                </div>
                {dev.current && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Current Active Session
                  </span>
                )}
              </div>

              <div className="mt-3 text-[11px] font-mono text-slate-400 space-y-1">
                <div><span className="text-slate-600">Location:</span> {dev.location}</div>
                <div><span className="text-slate-600">IP Address:</span> {dev.ipAddress}</div>
                <div><span className="text-slate-600">Last Active:</span> {new Date(dev.lastActive).toLocaleString()}</div>
              </div>

              {!dev.current && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => handleRevokeDevice(dev.deviceId)}
                    className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Revoke Device Access</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
