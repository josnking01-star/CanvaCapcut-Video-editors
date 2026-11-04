import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { 
  Film, 
  Layers, 
  Database, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Monitor, 
  BookOpen, 
  Key, 
  SlidersHorizontal,
  ChevronDown,
  Play,
  RotateCcw,
  Sparkle,
  Laptop,
  CheckCircle2,
  Save,
  Clock
} from 'lucide-react';
import { ASPECT_RATIOS, AspectRatio } from '../types';

export const Header: React.FC<{ onOpenLicenseModal: () => void; onOpenExportModal: () => void }> = ({
  onOpenLicenseModal,
  onOpenExportModal,
}) => {
  const {
    activeView,
    setActiveView,
    currentTemplate,
    setAspectRatio,
    activeLicense,
    whiteLabel,
    spreadsheetRecords,
    lastSavedTime,
    isAutoSaving,
    saveStudioStateNow,
  } = useStudio();

  const [aspectDropdownOpen, setAspectDropdownOpen] = useState(false);

  const navItems = [
    { id: 'editor', label: 'Studio Editor', icon: Film, badge: null },
    { id: 'bulk', label: 'Bulk Automation', icon: Database, badge: `${spreadsheetRecords.length} rows` },
    { id: 'templates', label: 'Templates', icon: Layers, badge: null },
    { id: 'media', label: 'AI Media & Freshness', icon: Sparkles, badge: 'Flow AI' },
    { id: 'admin', label: 'Owner Admin Panel', icon: ShieldCheck, badge: 'PRO' },
    { id: 'desktop', label: 'Windows Desktop EXE', icon: Laptop, badge: 'v3.0' },
    { id: 'docs', label: 'Guides & Manuals', icon: BookOpen, badge: null },
  ] as const;

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shrink-0 select-none z-50">
      {/* Left: Window Branding & Title */}
      <div className="flex items-center gap-3">
        {/* Windows Desktop App Badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-wide shadow-md">
          <Film className="w-4 h-4 text-amber-300" />
          <span className="hidden sm:inline font-extrabold tracking-tight">{whiteLabel.softwareName}</span>
          <span className="hidden md:inline-block bg-white/20 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
            STUDIO ELITE PRO
          </span>
        </div>

        {/* Current Project Name */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-3">
          <span className="text-slate-200 font-medium truncate max-w-[200px]">
            {currentTemplate.name}
          </span>
          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
            {currentTemplate.duration}s
          </span>
        </div>
      </div>

      {/* Center: Main App Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800/80">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Aspect Ratio, License Badge, Export Button */}
      <div className="flex items-center gap-2">
        {/* Background 30s Auto-Save Badge & Trigger */}
        <button
          onClick={saveStudioStateNow}
          title={lastSavedTime ? `Autosaved to localStorage at ${lastSavedTime}. Click to save immediately.` : 'Click to save studio state to localStorage'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border transition-all ${
            isAutoSaving 
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 animate-pulse'
              : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-300 hover:text-white'
          }`}
        >
          {isAutoSaving ? (
            <Save className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="hidden xl:inline text-[11px]">
            {isAutoSaving ? 'Saving...' : (lastSavedTime ? `Autosaved ${lastSavedTime}` : 'Autosave 30s')}
          </span>
        </button>

        {/* Aspect Ratio Selector */}
        <div className="relative">
          <button
            onClick={() => setAspectDropdownOpen(prev => !prev)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentTemplate.dimensions.ratio}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {aspectDropdownOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Dimensions
              </div>
              {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map(ratioKey => {
                const info = ASPECT_RATIOS[ratioKey];
                const isSelected = currentTemplate.dimensions.ratio === ratioKey;
                return (
                  <button
                    key={ratioKey}
                    onClick={() => {
                      setAspectRatio(ratioKey);
                      setAspectDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/60 transition-colors ${
                      isSelected ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{info.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {info.width}×{info.height}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* License Status Button */}
        <button
          onClick={onOpenLicenseModal}
          className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/90 text-amber-400 px-2.5 py-1.5 rounded-md text-xs font-medium border border-amber-500/30 transition-colors"
          title="Manage Commercial License"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="uppercase text-[11px] font-bold tracking-wider">
            {activeLicense.tier.replace('_', ' ')}
          </span>
        </button>

        {/* Export Video Modal Trigger */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-md transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
