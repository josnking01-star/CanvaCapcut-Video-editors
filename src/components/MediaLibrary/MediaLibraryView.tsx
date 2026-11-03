import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Upload, 
  Search, 
  Check, 
  Filter,
  Plus,
  Wand2,
  Lock,
  Unlock,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers,
  Clock,
  Trash2,
  Download,
  Sliders,
  Play,
  RotateCcw
} from 'lucide-react';
import { STOCK_BACKGROUND_MEDIA } from '../../data/presetData';
import { AspectRatio, ASPECT_RATIOS } from '../../types';

interface GeneratedMediaItem {
  id: string;
  url: string;
  prompt: string;
  refinedPrompt?: string;
  directorNotes?: string;
  suggestedSoundFx?: string;
  mediaType: 'image' | 'video';
  style: string;
  ratio: AspectRatio;
  createdAt: string;
  freshnessStatus?: string;
}

interface FreshnessCheckResult {
  status: 'locked' | 'unlocked_warning' | 'fresh';
  isLocked: boolean;
  daysAgo: number;
  daysRemaining: number;
  lastUsedDate?: string;
  mediaUrl?: string;
  associatedTitle?: string;
  message: string;
}

interface VaultItem {
  id: string;
  prompt: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  ratio: string;
  usedDate: string;
  usedTimestamp: number;
  daysAgo: number;
  daysRemaining: number;
  isLocked: boolean;
  associatedTitle?: string;
}

export const MediaLibraryView: React.FC = () => {
  const {
    currentTemplate,
    setCurrentTemplate,
    updateTemplateProperty,
    setActiveView,
    showToast,
  } = useStudio();

  // Active Tab: 'generator' (Google Flow AI) | 'stock' (Asset Library) | 'vault' (15-Day Freshness Guard)
  const [activeTab, setActiveTab] = useState<'generator' | 'stock' | 'vault'>('generator');

  // Generator State
  const [prompt, setPrompt] = useState<string>('Futuristic glowing neural network firing synaptic electrical impulses, deep cyan and violet digital science background');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [visualStyle, setVisualStyle] = useState<string>('cinematic');
  const [forceOverride, setForceOverride] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [freshnessResult, setFreshnessResult] = useState<FreshnessCheckResult | null>(null);
  const [isCheckingFreshness, setIsCheckingFreshness] = useState<boolean>(false);
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMediaItem | null>(null);

  // Vault & Stock State
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check freshness on prompt change (debounced)
  useEffect(() => {
    if (!prompt.trim() || prompt.length < 10) {
      setFreshnessResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingFreshness(true);
      try {
        const res = await fetch('/api/ai-media/check-freshness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        setFreshnessResult(data);
      } catch (err) {
        console.warn('Freshness check failed:', err);
      } finally {
        setIsCheckingFreshness(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [prompt]);

  // Load Vault History when opening Vault Tab
  const loadVaultHistory = async () => {
    setIsLoadingVault(true);
    try {
      const res = await fetch('/api/ai-media/history');
      const data = await res.json();
      if (data.history) {
        setVaultItems(data.history);
      }
    } catch (err) {
      console.error('Failed to load vault history:', err);
    } finally {
      setIsLoadingVault(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'vault') {
      loadVaultHistory();
    }
  }, [activeTab]);

  // Enhance Prompt with Gemini AI
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/gemini/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: visualStyle, niche: 'video background' }),
      });
      const data = await res.json();
      if (data.variations && data.variations[0]) {
        setPrompt(data.variations[0]);
        showToast('Prompt enhanced with Gemini AI Director guidance!');
      }
    } catch (err) {
      showToast('Failed to enhance prompt.');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Generate AI Media (Google Flow style)
  const handleGenerateMedia = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai-media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mediaType,
          style: visualStyle,
          ratio: aspectRatio,
          forceOverride,
          title: currentTemplate.name,
        }),
      });

      const data = await res.json();

      if (res.status === 423) {
        showToast(`🔒 Generation Blocked: This prompt was used ${data.daysAgo} days ago. 15-day cool-off active.`);
        setFreshnessResult(data);
        setIsGenerating(false);
        return;
      }

      if (data.success && data.media) {
        setGeneratedMedia(data.media);
        showToast(`✨ Generated ${mediaType === 'video' ? 'AI Video Loop' : 'AI 8K Image'} successfully!`);
        // Refresh freshness status
        setFreshnessResult({
          status: 'locked',
          isLocked: true,
          daysAgo: 0,
          daysRemaining: 15,
          message: '🔒 Registered into 15-Day Freshness Vault. Locked against duplicate generation for 15 days.',
        });
      } else {
        showToast(data.error || 'Failed to generate media');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Generation error: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Use as Active Template Background
  const handleApplyAsBackground = (mediaUrl: string, mediaPrompt?: string) => {
    updateTemplateProperty({
      defaultBackgroundUrl: mediaUrl,
      defaultBackgroundPrompt: mediaPrompt || prompt,
    });
    showToast('Applied media as active Studio project background!');
  };

  // Create New Quiz Template from this Media
  const handleCreateTemplateFromMedia = (mediaUrl: string, mediaPrompt?: string) => {
    const newTemplate = {
      ...currentTemplate,
      id: `tpl_flow_${Date.now()}`,
      name: `AI Flow: ${mediaPrompt ? mediaPrompt.slice(0, 30) : 'Custom Scene'}`,
      defaultBackgroundUrl: mediaUrl,
      defaultBackgroundPrompt: mediaPrompt || prompt,
    };
    setCurrentTemplate(newTemplate);
    setActiveView('editor');
    showToast('Created new Project Template with this AI Media and opened in Studio Editor!');
  };

  // Delete from Vault
  const handleDeleteVaultItem = async (id: string) => {
    try {
      await fetch(`/api/ai-media/history/${id}`, { method: 'DELETE' });
      setVaultItems(prev => prev.filter(item => item.id !== id));
      showToast('Record removed from 15-day vault');
    } catch (err) {
      showToast('Failed to remove vault item');
    }
  };

  const filteredStock = STOCK_BACKGROUND_MEDIA.filter(media => {
    const matchCategory = activeCategory === 'all' || media.category === activeCategory;
    const matchSearch = media.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      media.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-y-auto custom-scrollbar select-none">
      {/* Top Header & Tab Switcher */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Wand2 className="w-5 h-5" />
              </span>
              <h1 className="text-lg font-bold text-white tracking-wide">
                Google Flow AI Media Studio & 15-Day Freshness Vault
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Generate AI motion video loops from text prompts, convert to templates, and enforce strict 15-day non-duplication rules.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[
              { id: 'generator', label: 'Flow AI Studio', icon: Wand2 },
              { id: 'stock', label: 'Curated 8K Stock', icon: Film },
              { id: 'vault', label: '15-Day Freshness Vault', icon: ShieldCheck, badge: `${vaultItems.length || '3'}` },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-slate-800 text-[10px] font-mono px-1.5 py-0.2 rounded text-slate-400">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6 flex-1">
        
        {/* TAB 1: GOOGLE FLOW AI MEDIA STUDIO */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            {/* Prompt Input & Director Console */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Prompt-to-Video & Image Generator</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Powered by server-side Gemini prompt enhancement & cinematic visual synthesis.
                  </p>
                </div>

                <button
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingPrompt || !prompt.trim()}
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isEnhancingPrompt ? 'Enhancing with AI...' : 'Enhance with Gemini AI'}</span>
                </button>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-300 block">
                  Describe Your Visual Scene / Prompt:
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 4K microscopic 3D view of red blood cells flowing through vascular capillaries, deep crimson volumetric lighting..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Real-time 15-Day Freshness Shield Banner */}
              {freshnessResult && (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 ${
                  freshnessResult.isLocked
                    ? 'bg-red-950/40 border-red-500/50 text-red-200'
                    : (freshnessResult.status === 'unlocked_warning'
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200')
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-black/40 shrink-0">
                      {freshnessResult.isLocked ? (
                        <Lock className="w-5 h-5 text-red-400" />
                      ) : (freshnessResult.status === 'unlocked_warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      ))}
                    </span>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>
                          {freshnessResult.isLocked
                            ? `🔒 15-Day Freshness Guard Active (${freshnessResult.daysRemaining} Days Remaining)`
                            : (freshnessResult.status === 'unlocked_warning'
                              ? `⚠️ Re-Use Alert (Used ${freshnessResult.daysAgo} Days Ago)`
                              : '✅ 100% Unique & Fresh Visual Prompt')}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
                        {freshnessResult.message}
                      </p>
                    </div>
                  </div>

                  {freshnessResult.isLocked && (
                    <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                      <button
                        onClick={handleEnhancePrompt}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Rewrite with AI
                      </button>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={forceOverride}
                          onChange={(e) => setForceOverride(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Force Override</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Generation Controls: Media Type, Aspect Ratio, Style */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Media Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Output Media Format:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaType('video')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        mediaType === 'video'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>AI Video Loop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('image')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        mediaType === 'image'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>AI 8K Image</span>
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Target Canvas Ratio:</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="9:16">9:16 TikTok / Reels / Shorts (1080×1920)</option>
                    <option value="16:9">16:9 YouTube / Desktop (1920×1080)</option>
                    <option value="1:1">1:1 Square / Instagram Feed (1080×1080)</option>
                    <option value="4:5">4:5 Portrait / Facebook Feed (1080×1350)</option>
                  </select>
                </div>

                {/* Visual Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Cinematic Style:</label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="cinematic">Cinematic 8K Realistic Film</option>
                    <option value="microscopy">Microscopic 3D Science & Medical</option>
                    <option value="cyberpunk">Cyberpunk Neon & Holographic</option>
                    <option value="nature">Hyperrealistic Atmospheric Nature</option>
                    <option value="luxury">Luxury Obsidian & Flowing Liquid Gold</option>
                  </select>
                </div>
              </div>

              {/* Generate Trigger Button */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rule: 15-day automated lock prevents algorithmic channel duplication</span>
                </div>

                <button
                  onClick={handleGenerateMedia}
                  disabled={isGenerating || (freshnessResult?.isLocked && !forceOverride)}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Media in Google Flow...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate {mediaType === 'video' ? 'AI Video Loop' : 'AI Image'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Output Showcase Card */}
            {generatedMedia && (
              <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      Generation Ready
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">
                      {generatedMedia.mediaType === 'video' ? 'AI Motion Video Loop' : 'AI High-Res Image'} ({generatedMedia.ratio})
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplyAsBackground(generatedMedia.url, generatedMedia.prompt)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Use as Template Background</span>
                    </button>

                    <button
                      onClick={() => handleCreateTemplateFromMedia(generatedMedia.url, generatedMedia.prompt)}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Create New Template from this Video</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Media Viewport */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800 shadow-inner group">
                    <img
                      src={generatedMedia.url}
                      alt={generatedMedia.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 text-white text-[10px] font-mono px-2 py-1 rounded backdrop-blur">
                      Aspect Ratio: {generatedMedia.ratio}
                    </div>
                  </div>

                  {/* Director Notes & Prompt Details */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                          Visual Prompt
                        </span>
                        <p className="text-xs text-white leading-relaxed font-mono">
                          "{generatedMedia.prompt}"
                        </p>
                      </div>

                      {generatedMedia.directorNotes && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                            Gemini Director Camera Directive
                          </span>
                          <p className="text-xs text-slate-300">
                            {generatedMedia.directorNotes}
                          </p>
                        </div>
                      )}

                      {generatedMedia.suggestedSoundFx && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                            Recommended Soundscape / Audio FX
                          </span>
                          <p className="text-xs text-slate-300">
                            {generatedMedia.suggestedSoundFx}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-2 font-mono">
                      <span>Vault ID: #{generatedMedia.id.slice(-6)}</span>
                      <span className="text-emerald-400">Locked against duplicates until 15 days</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CURATED 8K STOCK MEDIA ASSETS */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['all', 'nature', 'abstract', 'medical', 'business'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter stock assets by keyword..."
                  className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredStock.map(media => {
                const isSelected = currentTemplate.defaultBackgroundUrl === media.url;
                return (
                  <div
                    key={media.id}
                    className={`bg-slate-900 rounded-xl overflow-hidden border transition-all group flex flex-col justify-between ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-950">
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-slate-950/80 text-white text-[10px] font-mono px-2 py-0.5 rounded capitalize">
                        {media.category}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="font-bold text-xs text-white truncate">{media.name}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug font-mono">
                          "{media.prompt}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                        <button
                          onClick={() => handleApplyAsBackground(media.url, media.prompt)}
                          className="bg-indigo-600/90 hover:bg-indigo-500 text-white py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Use in Project</span>
                        </button>
                        <button
                          onClick={() => handleCreateTemplateFromMedia(media.url, media.prompt)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          <Layers className="w-3 h-3 text-purple-400" />
                          <span>New Template</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: 15-DAY FRESHNESS VAULT & DEDUPLICATION AUDIT */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Prompt & Media Freshness Vault (15-Day Lock Policy)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Protects your viral content from TikTok & Shorts algorithm suppression by locking generated prompts for 15 days.
                </p>
              </div>

              <button
                onClick={loadVaultHistory}
                disabled={isLoadingVault}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start md:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVault ? 'animate-spin' : ''}`} />
                <span>Sync Vault</span>
              </button>
            </div>

            {/* Vault Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultItems.map(item => (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-xl overflow-hidden flex flex-col justify-between transition-all ${
                    item.isLocked
                      ? 'border-red-500/40 shadow-sm'
                      : 'border-amber-500/40 hover:border-slate-700'
                  }`}
                >
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <img
                      src={item.mediaUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                        item.isLocked
                          ? 'bg-red-600/90 text-white'
                          : 'bg-amber-600/90 text-white'
                      }`}>
                        {item.isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                        <span>{item.isLocked ? `Locked (${item.daysRemaining}d left)` : `Unlocked (${item.daysAgo}d ago)`}</span>
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 bg-slate-950/80 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                      {item.ratio}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Generated on: {item.usedDate ? item.usedDate.split('T')[0] : 'Recent'} ({item.daysAgo} days ago)
                      </div>
                      <p className="text-xs text-white font-mono line-clamp-3 mt-1 leading-snug">
                        "{item.prompt}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <button
                        onClick={() => handleApplyAsBackground(item.mediaUrl, item.prompt)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Use in Studio</span>
                      </button>

                      <button
                        onClick={() => handleDeleteVaultItem(item.id)}
                        className="bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/40 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Unlock / Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
