import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Laptop, 
  FileCheck, 
  Download, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle,
  FileCode,
  Layers
} from 'lucide-react';
import { License } from '../../../types';
import { generateSignedOfflineLicense, verifyOfflineLicense, generateLicenseKey } from '../../../utils/licensing';

interface LicensesTabProps {
  showToast: (msg: string) => void;
}

export const LicensesTab: React.FC<LicensesTabProps> = ({ showToast }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Single / Bulk Generator State
  const [genTier, setGenTier] = useState<License['tier']>('pro');
  const [genType, setGenType] = useState<License['type']>('yearly');
  const [genCount, setGenCount] = useState<number>(1);
  const [genCustomerName, setGenCustomerName] = useState('');
  const [genCustomerEmail, setGenCustomerEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Offline License Tools State
  const [offlineInputText, setOfflineInputText] = useState('');
  const [offlineVerifyResult, setOfflineVerifyResult] = useState<any>(null);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/licenses');
      const data = await res.json();
      if (Array.isArray(data)) setLicenses(data);
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load commercial licenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast(`Copied license key: ${key}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGenerateLicenses = async () => {
    setIsGenerating(true);
    try {
      const generatedKeys: string[] = [];
      for (let i = 0; i < genCount; i++) {
        const custName = genCount === 1 ? (genCustomerName || 'Direct Commercial Buyer') : `Bulk Batch Buyer #${i + 1}`;
        const custEmail = genCount === 1 ? (genCustomerEmail || 'buyer@domain.com') : `bulk_${Date.now()}_${i + 1}@licensee.com`;

        const res = await fetch('/api/admin/licenses/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: custName,
            customerEmail: custEmail,
            tier: genTier,
            type: genType,
            maxDevices: genTier === 'agency_unlimited' ? 25 : genTier === 'pro' ? 5 : 2,
          }),
        });
        const data = await res.json();
        if (data.key) generatedKeys.push(data.key);
      }

      showToast(`Generated ${generatedKeys.length} license key(s)`);
      setGenCustomerName('');
      setGenCustomerEmail('');
      setGenCount(1);
      fetchLicenses();
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to generate license keys');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = async (licId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/licenses/${licId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`License status updated to ${nextStatus}`);
        fetchLicenses();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to update status');
    }
  };

  const handleExportOfflineCertificate = (lic: License) => {
    const certString = generateSignedOfflineLicense(lic);
    const blob = new Blob([certString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniCut_OfflineCert_${lic.key}.json`;
    a.click();
    showToast(`Downloaded signed offline certificate for ${lic.key}`);
  };

  const handleVerifyOfflineInput = () => {
    if (!offlineInputText.trim()) return;
    try {
      const result = verifyOfflineLicense(offlineInputText.trim());
      setOfflineVerifyResult(result);
      if (result.isValid) {
        showToast('Offline digital signature verified successfully');
      } else {
        showToast(`Verification failed: ${result.error}`);
      }
    } catch (e: unknown) {
      setOfflineVerifyResult({ isValid: false, error: 'Malformed certificate JSON' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Commercial License Key & Activation Registry
            </h2>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              {licenses.length} Keys Issued
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate single or bulk crypto keys, inspect hardware device bindings, and export air-gapped offline certificates.
          </p>
        </div>

        <button
          onClick={fetchLicenses}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Generator & Offline Tool Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single & Bulk License Generator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Plus className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Issue Single or Bulk Commercial Licenses</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Product Tier</label>
              <select
                value={genTier}
                onChange={e => setGenTier(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="trial">Trial (14 Days)</option>
                <option value="starter">Starter Edition</option>
                <option value="pro">Pro Studio Elite</option>
                <option value="agency_unlimited">Enterprise Agency (25 Seats)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Billing Term</label>
              <select
                value={genType}
                onChange={e => setGenType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="monthly">Monthly Subscription</option>
                <option value="yearly">Annual (1 Year)</option>
                <option value="lifetime">Perpetual Lifetime</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Customer / Organization</label>
              <input
                type="text"
                placeholder="Client Name or Org (Optional if bulk)"
                value={genCustomerName}
                onChange={e => setGenCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Batch Count</label>
              <select
                value={genCount}
                onChange={e => setGenCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={1}>1 Key</option>
                <option value={5}>5 Keys (Batch)</option>
                <option value={10}>10 Keys (Reseller)</option>
                <option value={25}>25 Keys (Corporate)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateLicenses}
            disabled={isGenerating}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            <span>{isGenerating ? 'Minting Keys...' : `Generate ${genCount} Cryptographic Key(s)`}</span>
          </button>
        </div>

        {/* Air-Gapped Offline Digital Certificate Verification */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Air-Gapped Offline License Validator</h3>
            </div>
            <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
              SHA-256 HMAC
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Validate signed offline certificate tokens used by clients on PCs without internet access. Paste token JSON below:
          </p>

          <textarea
            rows={3}
            placeholder='Paste {"payload": {...}, "signature": "..."} to test...'
            value={offlineInputText}
            onChange={e => setOfflineInputText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={handleVerifyOfflineInput}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors border border-slate-700"
            >
              Verify Digital Signature
            </button>

            {offlineVerifyResult && (
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                  offlineVerifyResult.isValid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
              >
                {offlineVerifyResult.isValid ? 'VALID AIR-GAPPED CERT' : 'SIGNATURE REJECTED'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Licenses Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Cryptographic License Key</th>
                <th className="py-3 px-4">Licensee & Email</th>
                <th className="py-3 px-4">Tier & Term</th>
                <th className="py-3 px-4">Seats Activated</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {licenses.map(lic => (
                <tr key={lic.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleCopyKey(lic.key)}
                      className="font-bold text-indigo-300 hover:text-indigo-200 bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-center gap-1.5 group transition-colors"
                      title="Click to copy key"
                    >
                      <span>{lic.key}</span>
                      {copiedKey === lic.key ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                      )}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-bold text-white text-xs">{lic.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{lic.customerEmail}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <span className="inline-block bg-purple-950 text-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-800/60 uppercase">
                        {lic.tier}
                      </span>
                      <div className="text-[10px] text-slate-500 uppercase font-sans">
                        {lic.type} ({lic.expiresAt})
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{lic.activatedDevicesList.length} / {lic.maxDevices} PCs</span>
                    </div>
                    {lic.activatedDevicesList.length > 0 && (
                      <span className="text-[10px] text-slate-500 block">
                        Last node: {lic.activatedDevicesList[lic.activatedDevicesList.length - 1].deviceName}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                        lic.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <span className="capitalize">{lic.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleExportOfflineCertificate(lic)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded border border-slate-700 transition-colors"
                        title="Download Signed Offline Certificate (.json)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(lic.id, lic.status)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          lic.status === 'active'
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/50'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                        }`}
                      >
                        {lic.status === 'active' ? 'Suspend' : 'Activate'}
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
