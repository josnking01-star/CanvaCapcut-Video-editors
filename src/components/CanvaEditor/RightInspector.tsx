import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Sparkles, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Sliders, 
  Type, 
  Palette, 
  Activity, 
  Clock, 
  HelpCircle,
  Database
} from 'lucide-react';
import { TextAnimationType } from '../../types';

export const RightInspector: React.FC = () => {
  const {
    activeElement,
    updateElement,
    toggleDynamicElement,
    currentTemplate,
    deleteElement,
  } = useStudio();

  if (!activeElement) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none shrink-0 z-30">
        <Sliders className="w-8 h-8 text-slate-600 mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">No Element Selected</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
          Click any text, shape, or badge on the canvas to configure properties, dynamic mapping, and animations.
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 select-none z-30 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {activeElement.type} Inspector
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateElement(activeElement.id, { isVisible: !activeElement.isVisible })}
            className={`p-1.5 rounded transition-colors ${activeElement.isVisible ? 'text-slate-400 hover:text-white' : 'text-amber-400'}`}
            title={activeElement.isVisible ? 'Hide Element' : 'Show Element'}
          >
            {activeElement.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => updateElement(activeElement.id, { isLocked: !activeElement.isLocked })}
            className={`p-1.5 rounded transition-colors ${activeElement.isLocked ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
            title={activeElement.isLocked ? 'Unlock Element' : 'Lock Element'}
          >
            {activeElement.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* MANDATORY PART 4: DYNAMIC VS FIXED ELEMENT CONFIGURATION */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-slate-200">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Data Behavior</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                activeElement.isDynamic
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {activeElement.isDynamic ? 'DYNAMIC' : 'FIXED'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            {activeElement.isDynamic
              ? 'Receives automated values from imported spreadsheet columns during bulk creation.'
              : 'Remains identical on every video (e.g. Logo, Brand watermark, Fixed shapes).'}
          </p>

          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => toggleDynamicElement(activeElement.id, false)}
              className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                !activeElement.isDynamic
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔒 Fixed Element
            </button>
            <button
              onClick={() => toggleDynamicElement(activeElement.id, true)}
              className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                activeElement.isDynamic
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ★ Dynamic Element
            </button>
          </div>

          {activeElement.isDynamic && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Dynamic Variable Field Name
                </label>
                <input
                  type="text"
                  value={activeElement.dynamicField || ''}
                  onChange={(e) => updateElement(activeElement.id, { dynamicField: e.target.value })}
                  placeholder="e.g. Question, Title, Option_A"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Missing Data Fallback
                </label>
                <select
                  value={activeElement.fallbackBehavior}
                  onChange={(e) => updateElement(activeElement.id, { fallbackBehavior: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="default">Use Default Placeholder Value</option>
                  <option value="hide">Hide Element If Cell Is Empty</option>
                  <option value="placeholder">Show Blank Box</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* TEXT CONTENT & TYPOGRAPHY */}
        {(activeElement.type === 'text' || activeElement.type === 'badge' || activeElement.type === 'watermark') && (
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Text & Typography
            </h5>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Default / Preview Text</label>
              <textarea
                rows={3}
                value={activeElement.text || ''}
                onChange={(e) => updateElement(activeElement.id, { text: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Font Family</label>
                <select
                  value={activeElement.fontFamily}
                  onChange={(e) => updateElement(activeElement.id, { fontFamily: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 text-xs"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Space Grotesk">Space Grotesk</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Bebas Neue">Bebas Neue</option>
                  <option value="Cinzel">Cinzel</option>
                  <option value="Inter">Inter</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Font Size (px)</label>
                <input
                  type="number"
                  value={activeElement.fontSize}
                  onChange={(e) => updateElement(activeElement.id, { fontSize: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeElement.color || '#ffffff'}
                    onChange={(e) => updateElement(activeElement.id, { color: e.target.value })}
                    className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-slate-400 text-[11px]">{activeElement.color}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Text Alignment</label>
                <div className="flex rounded bg-slate-950 border border-slate-800 p-0.5">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => updateElement(activeElement.id, { textAlign: align })}
                      className={`flex-1 py-1 rounded text-[10px] font-bold uppercase ${
                        activeElement.textAlign === align ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      {align[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANIMATIONS */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kinetic Animation</span>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Entrance Animation</label>
            <select
              value={activeElement.textAnimation || 'none'}
              onChange={(e) => updateElement(activeElement.id, { textAnimation: e.target.value as TextAnimationType })}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs"
            >
              <option value="none">None (Static)</option>
              <option value="slide-up">Slide Up (Smooth Ease)</option>
              <option value="fade-in">Fade In (Gentle)</option>
              <option value="pop">Pop / Scale Up</option>
              <option value="typewriter">Typewriter (Word by Word)</option>
              <option value="bounce">Bouncy Pop</option>
            </select>
          </div>
        </div>

        {/* TIMELINE BOUNDARY */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Timeline Lifecycle</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Start Time (sec)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={currentTemplate.duration}
                value={activeElement.startTime}
                onChange={(e) => updateElement(activeElement.id, { startTime: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Duration (sec)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max={currentTemplate.duration}
                value={activeElement.duration}
                onChange={(e) => updateElement(activeElement.id, { duration: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* GEOMETRY & TRANSFORM */}
        <div className="space-y-3">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Position & Geometry
          </h5>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">X Position</label>
              <input
                type="number"
                value={activeElement.x}
                onChange={(e) => updateElement(activeElement.id, { x: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Y Position</label>
              <input
                type="number"
                value={activeElement.y}
                onChange={(e) => updateElement(activeElement.id, { y: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Width</label>
              <input
                type="number"
                value={activeElement.width}
                onChange={(e) => updateElement(activeElement.id, { width: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Height</label>
              <input
                type="number"
                value={activeElement.height}
                onChange={(e) => updateElement(activeElement.id, { height: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Delete Element Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => deleteElement(activeElement.id)}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2 rounded-lg font-semibold text-xs transition-colors"
          >
            Delete Element
          </button>
        </div>
      </div>
    </aside>
  );
};
