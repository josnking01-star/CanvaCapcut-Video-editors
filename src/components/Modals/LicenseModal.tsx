import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  X, 
  Copy, 
  ExternalLink,
  Laptop,
  Check
} from 'lucide-react';
import { validateLicenseKeyFormat } from '../../utils/licensing';

export const LicenseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    activeLicense,
    activateNewLicenseKey,
    showToast,
  } = useStudio();

  const [inputKey, setInputKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationMsg, setActivationMsg] = useState<{ success: boolean; text: string } | null>(null);

  const sampleTestKeys = [
    { label: 'Agency Unlimited (All Features, 10 PCs)', key: 'CCVS-UNLM-78AF-93BC-B129' },
    { label: 'Pro Suite (4K Export, AI Tools, 3 PCs)', key: 'CCVS-PROX-43E1-88DF-3C4A' },
    { label: 'Starter Plan (Bulk Automation, 2 PCs)', key: 'CCVS-STRT-66E9-11B3-A502' },
    { label: 'Trial License (14-Day Evaluation)', key: 'CCVS-TRIL-91AC-22FF-8D1F' },
  ];

  const handleActivate = async (keyToUse?: string) => {
    const targetKey = keyToUse || inputKey;
    if (!targetKey.trim()) return;

    setIsActivating(true);
    setActivationMsg(null);

    const result = await activateNewLicenseKey(targetKey.trim());
    setIsActivating(false);
    setActivationMsg({
      success: result.success,
      text: result.message,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Commercial Software Licensing & Activation
            </h2>
            <p className="text-xs text-slate-400">
              Activate your desktop copy or verify workstation device privileges.
            </p>
          </div>
        </div>

        {/* Current Active Status Card */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Current License Tier:</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded font-bold font-mono uppercase">
              {activeLicense.tier.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Registered Key:</span>
            <span className="font-mono text-indigo-300 font-semibold">{activeLicense.key}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Licensed User:</span>
            <span className="text-slate-200 font-medium">{activeLicense.customerName}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Activated Workstations:</span>
            <span className="text-slate-200 font-mono">
              {activeLicense.activatedDevicesList.length || 1} / {activeLicense.maxDevices} Machines
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Canva Design Editor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>CapCut Timeline Video</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Universal Bulk Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Unique Background Engine</span>
            </div>
          </div>
        </div>

        {/* Enter New Key Form */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Enter Commercial License Key:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="CCVS-PROX-XXXX-XXXX-XXXX"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleActivate()}
              disabled={isActivating || !inputKey.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-all"
            >
              {isActivating ? 'Verifying...' : 'Activate'}
            </button>
          </div>

          {activationMsg && (
            <div className={`p-2.5 rounded-lg text-xs font-medium ${
              activationMsg.success ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/40 text-red-300 border border-red-500/30'
            }`}>
              {activationMsg.text}
            </div>
          )}
        </div>

        {/* Preset Test Keys Quick Click */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick-Test Commercial License Keys:
          </div>
          <div className="space-y-1.5">
            {sampleTestKeys.map(k => (
              <button
                key={k.key}
                onClick={() => {
                  setInputKey(k.key);
                  handleActivate(k.key);
                }}
                className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between text-xs"
              >
                <div className="truncate mr-2">
                  <div className="font-semibold text-slate-200">{k.label}</div>
                  <div className="font-mono text-[10px] text-indigo-400">{k.key}</div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono shrink-0">
                  Click to Activate
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
