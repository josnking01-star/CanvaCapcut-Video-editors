import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Type, 
  Square, 
  Circle, 
  Sparkles, 
  Image as ImageIcon, 
  Layers, 
  Wand2, 
  Plus, 
  Tag, 
  Sliders, 
  RefreshCw,
  Film
} from 'lucide-react';
import { STOCK_BACKGROUND_MEDIA } from '../../data/presetData';

export const LeftSidebar: React.FC = () => {
  const {
    currentTemplate,
    templatesList,
    loadTemplate,
    addElement,
    updateTemplateProperty,
    showToast,
  } = useStudio();

  const [activeTab, setActiveTab] = useState<'text' | 'elements' | 'templates' | 'backgrounds' | 'ai'>('text');
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [enhancedVariations, setEnhancedVariations] = useState<string[]>([]);

  const handleEnhancePrompt = async () => {
    if (!aiPromptInput.trim()) return;
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/gemini/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPromptInput, niche: currentTemplate.category }),
      });
      const data = await res.json();
      if (data.variations) {
        setEnhancedVariations(data.variations);
        showToast('Generated 3 cinematic prompt enhancements with Gemini AI');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to enhance prompt');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none z-30">
      {/* Tab strip */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
        {[
          { id: 'text', label: 'Text', icon: Type },
          { id: 'elements', label: 'Shapes', icon: Square },
          { id: 'backgrounds', label: 'Backgrounds', icon: ImageIcon },
          { id: 'templates', label: 'Templates', icon: Layers },
          { id: 'ai', label: 'AI Magic', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md text-[10px] font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* TAB 1: TEXT TOOLS */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Canva-Style Typography
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Click any preset to add to canvas. Can be configured as dynamic or fixed.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => addElement('text', {
                  name: 'Dynamic Main Headline',
                  text: 'POWERFUL HEADLINE',
                  fontSize: 52,
                  fontWeight: '800',
                  color: '#ffffff',
                  isDynamic: true,
                  dynamicField: 'Title',
                  textAnimation: 'slide-up',
                })}
                className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all group"
              >
                <div className="text-xl font-extrabold text-white group-hover:text-indigo-300">
                  Add a Heading
                </div>
                <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Dynamic (Receives Spreadsheet Title)
                </div>
              </button>

              <button
                onClick={() => addElement('text', {
                  name: 'Dynamic Subtitle / Question',
                  text: 'Engaging Subtitle or Question text goes here',
                  fontSize: 34,
                  fontWeight: '600',
                  color: '#cbd5e1',
                  isDynamic: true,
                  dynamicField: 'Question',
                  textAnimation: 'fade-in',
                })}
                className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all group"
              >
                <div className="text-base font-semibold text-slate-200 group-hover:text-indigo-300">
                  Add a Subheading
                </div>
                <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Dynamic (Receives Question / Body)
                </div>
              </button>

              <button
                onClick={() => addElement('badge', {
                  name: 'Fixed Brand Watermark',
                  text: '★ BRAND OFFICIAL',
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#38bdf8',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  borderColor: '#0284c7',
                  borderWidth: 2,
                  borderRadius: 24,
                  isDynamic: false,
                  defaultValue: '★ BRAND OFFICIAL',
                })}
                className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all group"
              >
                <div className="text-xs font-bold text-sky-400 tracking-wider">
                  ★ Add Fixed Brand Watermark
                </div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Fixed (Identical on every video)
                </div>
              </button>

              <button
                onClick={() => addElement('badge', {
                  name: 'Dynamic Answer Pill',
                  text: 'A) Option Alpha Choice',
                  fontSize: 28,
                  fontWeight: '700',
                  color: '#ffffff',
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  borderColor: '#475569',
                  borderWidth: 2,
                  borderRadius: 16,
                  isDynamic: true,
                  dynamicField: 'Option_A',
                  textAnimation: 'pop',
                })}
                className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all group"
              >
                <div className="text-sm font-bold text-slate-100">
                  Add Interactive Choice Pill
                </div>
                <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Dynamic (Receives Option A/B)
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SHAPES & ELEMENTS */}
        {activeTab === 'elements' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Visual Shapes & Frames
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addElement('shape', {
                  name: 'Rounded Overlay Box',
                  shapeType: 'rounded',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderWidth: 2,
                  borderRadius: 24,
                  width: 500,
                  height: 300,
                })}
                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-300 text-xs"
              >
                <Square className="w-6 h-6 text-indigo-400" />
                <span>Rounded Box</span>
              </button>

              <button
                onClick={() => addElement('shape', {
                  name: 'Circle Badge',
                  shapeType: 'circle',
                  backgroundColor: '#ef4444',
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                })}
                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-300 text-xs"
              >
                <Circle className="w-6 h-6 text-red-400" />
                <span>Timer Circle</span>
              </button>

              <button
                onClick={() => addElement('badge', {
                  name: 'Category Ribbon',
                  text: 'TOP SECRET TRIVIA',
                  fontSize: 18,
                  fontWeight: '800',
                  color: '#0f172a',
                  backgroundColor: '#f59e0b',
                  borderRadius: 8,
                  width: 260,
                  height: 44,
                })}
                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-300 text-xs"
              >
                <Tag className="w-6 h-6 text-amber-400" />
                <span>Header Ribbon</span>
              </button>

              <button
                onClick={() => addElement('shape', {
                  name: 'Border Accent Frame',
                  shapeType: 'rounded',
                  backgroundColor: 'transparent',
                  borderColor: '#6366f1',
                  borderWidth: 4,
                  borderRadius: 20,
                  width: 520,
                  height: 360,
                })}
                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-300 text-xs"
              >
                <Sliders className="w-6 h-6 text-emerald-400" />
                <span>Border Frame</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BACKGROUNDS */}
        {activeTab === 'backgrounds' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Curated Stock Media
            </h3>
            <p className="text-[11px] text-slate-400">
              Select default background for editor preview. In Bulk mode, unique backgrounds can be assigned per row.
            </p>

            <div className="space-y-3">
              {STOCK_BACKGROUND_MEDIA.map(media => {
                const isCurrent = currentTemplate.defaultBackgroundUrl === media.url;
                return (
                  <div
                    key={media.id}
                    onClick={() => {
                      updateTemplateProperty({
                        defaultBackgroundUrl: media.url,
                        defaultBackgroundPrompt: media.prompt,
                      });
                      showToast(`Background set to ${media.name}`);
                    }}
                    className={`relative rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                      isCurrent ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-2">
                      <div className="text-xs font-bold text-white truncate">{media.name}</div>
                      <div className="text-[10px] text-slate-300 truncate font-mono">{media.category}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: TEMPLATES LIBRARY */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reusable Templates
            </h3>
            <div className="space-y-3">
              {templatesList.map(tpl => {
                const isCurrent = currentTemplate.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-800/70 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tpl.name}</span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                        {tpl.dimensions.ratio}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                    <div className="mt-2 text-[10px] text-indigo-400 font-mono">
                      {tpl.elements.filter(e => e.isDynamic).length} Dynamic Elements
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: AI MAGIC STUDIO */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Gemini Background Prompt Enhancer
              </h3>
              <p className="text-[11px] text-slate-400">
                Enhance plain visual descriptions into cinematic, high-resolution video prompts.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                placeholder="e.g. green forest with waterfall and sun rays"
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleEnhancePrompt}
                disabled={isEnhancingPrompt || !aiPromptInput.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
              >
                {isEnhancingPrompt ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enhancing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate Cinematic Prompts</span>
                  </>
                )}
              </button>
            </div>

            {enhancedVariations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide">
                  AI Variations:
                </div>
                {enhancedVariations.map((v, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      updateTemplateProperty({ defaultBackgroundPrompt: v });
                      showToast('Applied prompt variation to template background');
                    }}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-500/30 rounded-lg text-[11px] text-slate-200 cursor-pointer transition-colors"
                  >
                    {v}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
