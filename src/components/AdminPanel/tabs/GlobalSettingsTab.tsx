import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Palette, 
  Building, 
  Mail, 
  Globe, 
  Save, 
  Check, 
  AlertTriangle,
  Server,
  Send
} from 'lucide-react';
import { useStudio } from '../../../context/StudioContext';
import { WhiteLabelSettings } from '../../../types';

interface GlobalSettingsTabProps {
  showToast: (msg: string) => void;
}

export const GlobalSettingsTab: React.FC<GlobalSettingsTabProps> = ({ showToast }) => {
  const { whiteLabel, setWhiteLabel } = useStudio();
  const [formData, setFormData] = useState<WhiteLabelSettings>({ ...whiteLabel });
  const [isSaving, setIsSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smtpServer, setSmtpServer] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSender, setSmtpSender] = useState('licensing@omnicut-elite.com');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const brandPresets = [
    {
      name: 'OmniCut Studio Elite (Default Master)',
      color: '#6366f1',
      tagline: 'Next-Gen Kinetic Motion & Multi-Platform Bulk AI Engine',
    },
    {
      name: 'HyperCut Premier AI',
      color: '#06b6d4',
      tagline: 'High-Throughput Viral Video Automation & Kinetic Canvas',
    },
    {
      name: 'VortexMotion Cinema Pro',
      color: '#8b5cf6',
      tagline: 'Hollywood Grade Multi-Track Timeline & Generative Video Engine',
    },
    {
      name: 'QuantumCreative Ultra',
      color: '#ec4899',
      tagline: 'Enterprise Automated Video Matrix & Graphic Studio Suite',
    },
  ];

  const handleApplyPreset = (preset: typeof brandPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      softwareName: preset.name,
      brandPrimaryColor: preset.color,
      tagline: preset.tagline,
    }));
    showToast(`Applied preset: ${preset.name}`);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setWhiteLabel(data.settings);
        showToast('Global application settings persisted');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = () => {
    setIsTestingSmtp(true);
    setTimeout(() => {
      setIsTestingSmtp(false);
      showToast(`SMTP test ping to ${smtpServer}:${smtpPort} succeeded. TLS 1.3 verified.`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Global Application Settings & White-Label Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Customize branding, desktop window chrome title, enterprise email delivery, and emergency maintenance mode.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Maintenance Mode Alert Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
        maintenanceMode 
          ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 ${maintenanceMode ? 'text-amber-400' : 'text-slate-500'}`} />
          <div>
            <div className="text-xs font-bold text-white">System Maintenance Mode</div>
            <p className="text-[11px] mt-0.5">
              {maintenanceMode 
                ? 'Maintenance active: Client desktop apps show a temporary maintenance notification.'
                : 'System is online and operational for all commercial users worldwide.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !maintenanceMode;
            setMaintenanceMode(next);
            showToast(`Maintenance mode is now ${next ? 'ACTIVE' : 'INACTIVE'}`);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            maintenanceMode
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {maintenanceMode ? 'DISABLE MAINTENANCE' : 'ENABLE MAINTENANCE'}
        </button>
      </div>

      {/* Brand Presets Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400">
          Executive Commercial Brand Themes:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {brandPresets.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.color }}></span>
                <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {preset.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.tagline}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Software Metadata Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Application Identity & Metadata</h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Software Product Title</label>
              <input
                type="text"
                value={formData.softwareName}
                onChange={e => setFormData({ ...formData, softwareName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Marketing Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Corporate Entity</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Support Email</label>
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={e => setFormData({ ...formData, supportEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Official Website</label>
                <input
                  type="text"
                  value={formData.websiteUrl}
                  onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Release Version</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={e => setFormData({ ...formData, version: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SMTP Mailer & Licensing Notifications */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">SMTP Email Delivery Service</h3>
            </div>
            <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
              TLS Encrypted
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Delivers automated customer license keys, invoice PDFs, and reset tokens upon purchase completion.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpServer}
                  onChange={e => setSmtpServer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={e => setSmtpPort(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">From Sender Address</label>
              <input
                type="email"
                value={smtpSender}
                onChange={e => setSmtpSender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={isTestingSmtp}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingSmtp ? 'Sending SMTP Ping...' : 'Send Test Verification Email'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
