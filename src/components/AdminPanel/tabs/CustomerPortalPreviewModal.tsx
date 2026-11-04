import React, { useState } from 'react';
import { 
  Laptop, 
  Key, 
  ShieldCheck, 
  Film, 
  LifeBuoy, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  Lock,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useStudio } from '../../../context/StudioContext';
import { License } from '../../../types';

interface CustomerPortalPreviewModalProps {
  onClose: () => void;
}

export const CustomerPortalPreviewModal: React.FC<CustomerPortalPreviewModalProps> = ({ onClose }) => {
  const { whiteLabel, activeLicense, setActiveView, showToast } = useStudio();
  const [activeTab, setActiveTab] = useState<'license' | 'projects' | 'support' | 'offline'>('license');
  const [copied, setCopied] = useState(false);
  const [testKey, setTestKey] = useState('');

  const handleCopyKey = () => {
    navigator.clipboard.writeText(activeLicense.key);
    setCopied(true);
    showToast('Copied active license key');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testKey.trim()) return;

    try {
      const res = await fetch('/api/license/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: testKey.trim(),
          deviceId: 'dev_test_simulator',
          deviceName: 'Customer Simulation Rig (Win11 x64)',
        }),
      });

      const data = await res.json();
      if (data.isValid) {
        showToast(`License activated for ${data.customerName} (${data.tier})!`);
      } else {
        showToast(`Activation failed: ${data.error}`);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Verification failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        {/* Top Simulation Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border-b border-indigo-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Customer Desktop Application Portal (Preview Simulation)
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-indigo-300 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{whiteLabel.softwareName}</h3>
                <span className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                  {activeLicense.tier} Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Licensed to: {activeLicense.customerName} ({activeLicense.customerEmail})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onClose();
                setActiveView('editor');
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Launch Studio Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Customer Nav Tabs */}
        <div className="px-6 pt-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          {[
            { id: 'license', label: 'My License & Hardware' },
            { id: 'projects', label: 'My Video Projects' },
            { id: 'support', label: 'Customer Help Desk' },
            { id: 'offline', label: 'Air-Gapped Offline Mode' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Customer Tab Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {activeTab === 'license' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Active Commercial License Key
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    VERIFIED & ACTIVE
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm">
                  <span className="text-indigo-300 font-bold">{activeLicense.key}</span>
                  <button
                    onClick={handleCopyKey}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors flex items-center gap-1 text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">Tier:</span>
                    <span className="text-slate-200 uppercase">{activeLicense.tier}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Seat Limit:</span>
                    <span className="text-slate-200">{activeLicense.activatedDevicesList.length} of {activeLicense.maxDevices} PCs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Expiration:</span>
                    <span className="text-slate-200">{activeLicense.expiresAt}</span>
                  </div>
                </div>
              </div>

              {/* Test Activation Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">
                  Simulate New Client Device Activation
                </span>
                <form onSubmit={handleTestActivation} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter commercial key CCVS-XXXX-XXXX-XXXX-XXXX"
                    value={testKey}
                    onChange={e => setTestKey(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Activate Seat
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Film className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
              <p className="text-slate-300 font-bold">Client Local Project Library</p>
              <p className="text-[11px] mt-1 text-slate-400">
                All client projects are stored locally in %APPDATA%/OmniCutStudio/projects or synced via cloud.
              </p>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <span className="text-xs font-bold text-white block">Client VIP Support Desk</span>
              <p className="text-slate-400 leading-relaxed">
                Customers have direct 24/7 access to engineering support for bulk Excel parsing and hardware licensing resets at: <strong className="text-indigo-300">{whiteLabel.supportEmail}</strong>
              </p>
            </div>
          )}

          {activeTab === 'offline' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <span className="text-xs font-bold text-white block">Air-Gapped Offline Operation</span>
              <p className="text-slate-400 leading-relaxed">
                When running on an isolated PC workstation without internet access, customers can import their signed digital license certificate file (.json) to activate complete 4K rendering and bulk automation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
