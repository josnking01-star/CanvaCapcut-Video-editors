import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { Layers, Plus, Check, Play, ExternalLink } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../../data/presetData';

export const TemplatesView: React.FC = () => {
  const {
    templatesList,
    currentTemplate,
    loadTemplate,
    setActiveView,
    saveTemplateAsNew,
    showToast,
  } = useStudio();

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-y-auto custom-scrollbar select-none">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-lg font-bold text-white tracking-wide">
                Production-Ready Creative Templates
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pre-configured Canva design layers with CapCut multi-track timeline motion and dynamic variable mappings.
            </p>
          </div>

          <button
            onClick={() => {
              saveTemplateAsNew(`Custom Template #${templatesList.length + 1}`);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Save Current Project as Template</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-6 space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templatesList.map(tpl => {
            const isSelected = currentTemplate.id === tpl.id;
            return (
              <div
                key={tpl.id}
                className={`bg-slate-900 rounded-xl overflow-hidden border flex flex-col justify-between transition-all group ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Visual Preview */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  {tpl.defaultBackgroundUrl ? (
                    <img
                      src={tpl.defaultBackgroundUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center text-slate-600">
                      <Layers className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    {tpl.dimensions.label}
                  </div>

                  <div className="absolute top-2 right-2 bg-indigo-600/90 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    {tpl.duration}s
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-white">{tpl.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                    <span className="text-amber-400">
                      ★ {tpl.elements.filter(e => e.isDynamic).length} Dynamic Fields
                    </span>
                    <span className="text-emerald-400">
                      🔒 {tpl.elements.filter(e => !e.isDynamic).length} Fixed Assets
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      loadTemplate(tpl.id);
                      setActiveView('editor');
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isSelected ? 'Loaded in Editor' : 'Open in Creative Studio'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
