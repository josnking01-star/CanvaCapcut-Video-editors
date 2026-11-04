import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Check, 
  X, 
  DollarSign, 
  Layers, 
  Laptop, 
  ShieldCheck, 
  SlidersHorizontal,
  Sparkles,
  Save
} from 'lucide-react';
import { Product, ProductEdition } from '../../../types';

interface ProductsEditionsTabProps {
  showToast: (msg: string) => void;
}

export const ProductsEditionsTab: React.FC<ProductsEditionsTabProps> = ({ showToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedEdition, setSelectedEdition] = useState<ProductEdition | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/owner/products');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
        setSelectedProduct(data[0]);
        setSelectedEdition(data[0].editions[2] || data[0].editions[0]); // default Pro
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load software products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleFeature = (featKey: keyof ProductEdition['features']) => {
    if (!selectedEdition) return;
    const nextVal = !selectedEdition.features[featKey];
    setSelectedEdition({
      ...selectedEdition,
      features: {
        ...selectedEdition.features,
        [featKey]: nextVal,
      },
    });
  };

  const handleSaveEdition = async () => {
    if (!selectedProduct || !selectedEdition) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/owner/products/${selectedProduct.id}/edition/${selectedEdition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedEdition),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Edition ${selectedEdition.name} entitlements updated`);
        fetchProducts();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to update edition');
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedProduct || !selectedEdition) {
    return <div className="text-slate-400 text-sm py-8 text-center">Loading product tiers...</div>;
  }

  const featureLabels: Record<keyof ProductEdition['features'], { title: string; desc: string }> = {
    canvaEditor: { title: 'Canva Drag-and-Drop Canvas', desc: 'Graphic composition, typography, badges, and layout tools' },
    capcutEditor: { title: 'CapCut Multi-Track Timeline', desc: 'Kinetic video scrubbing, audio tracks, keyframes, transitions' },
    bulkAutomation: { title: 'Bulk Multi-Platform Engine', desc: 'Automate 100s of videos with Excel/CSV dynamic text replacement' },
    aiImageGeneration: { title: 'AI Background Image Engine', desc: 'Curated 8K generative background scenes' },
    aiVideoGeneration: { title: 'Google Flow AI Video Generation', desc: 'Prompt-based motion loops with directorial camera directives' },
    aiFreshnessVault: { title: '15-Day Viral Freshness Vault', desc: 'Prevents social algorithm duplicate content penalties' },
    export4K: { title: '4K Ultra-HD Multi-Format Export', desc: 'High-bitrate rendering across 16:9, 9:16, 1:1, and 4:5 ratios' },
    whiteLabel: { title: 'White-Label Re-Branding Rights', desc: 'Custom branding, client logo replacement, and standalone naming' },
    unlimitedTemplates: { title: 'Unlimited Project Templates', desc: 'Access to viral medical, educational, and motivational presets' },
    cloudSync: { title: 'Cloud Project Sync & Storage', desc: 'Automatic project backup and multi-workstation sync' },
    prioritySupport: { title: 'Priority VIP Support SLA', desc: 'Direct access to Master Owner engineering desk &lt; 2h' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Software Products & Edition Entitlements
            </h2>
            <span className="bg-indigo-950 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-indigo-800/60">
              {selectedProduct.name} v{selectedProduct.version}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure pricing tiers, workstation seat limits, and toggle feature flags for commercial licensing enforcement.
          </p>
        </div>

        <button
          onClick={handleSaveEdition}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Entitlements'}</span>
        </button>
      </div>

      {/* Editions Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedProduct.editions.map(ed => {
          const isSelected = selectedEdition.id === ed.id;
          return (
            <div
              key={ed.id}
              onClick={() => setSelectedEdition(ed)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-600/10 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase">
                  {ed.tier}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {ed.maxDevices} PCs
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">{ed.name}</h3>
              <div className="mt-3 flex items-baseline gap-1 font-mono">
                <span className="text-xl font-black text-white">${ed.priceMonthly}</span>
                <span className="text-[11px] text-slate-400">/mo</span>
                <span className="text-[10px] text-slate-500 ml-2">(${ed.priceLifetime} Life)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edition Pricing & Seat Limits Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            Pricing & Seat Limits for: <strong className="text-indigo-300">{selectedEdition.name}</strong>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Monthly Price ($ USD)</label>
            <input
              type="number"
              value={selectedEdition.priceMonthly}
              onChange={e => setSelectedEdition({ ...selectedEdition, priceMonthly: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Annual Price ($ USD)</label>
            <input
              type="number"
              value={selectedEdition.priceYearly}
              onChange={e => setSelectedEdition({ ...selectedEdition, priceYearly: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Perpetual Lifetime ($ USD)</label>
            <input
              type="number"
              value={selectedEdition.priceLifetime}
              onChange={e => setSelectedEdition({ ...selectedEdition, priceLifetime: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Hardware Seat Quota</label>
            <input
              type="number"
              value={selectedEdition.maxDevices}
              onChange={e => setSelectedEdition({ ...selectedEdition, maxDevices: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Feature Entitlements Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Feature Access Flags</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Toggles instantly govern client software capabilities upon license verification
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(featureLabels) as Array<keyof ProductEdition['features']>).map(featKey => {
            const isEnabled = Boolean(selectedEdition.features[featKey]);
            const meta = featureLabels[featKey];

            return (
              <div
                key={featKey}
                onClick={() => handleToggleFeature(featKey)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isEnabled
                    ? 'bg-slate-950 border-indigo-500/40 hover:border-indigo-500'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5 pr-3">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{meta.title}</span>
                    {featKey === 'aiFreshnessVault' && (
                      <span className="bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[9px] font-mono px-1.5 py-0.2 rounded">
                        15-DAY GUARD
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{meta.desc}</p>
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-600'
                  }`}
                >
                  {isEnabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
