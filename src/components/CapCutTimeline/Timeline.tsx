import React, { useRef } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Scissors, 
  Plus, 
  Minus,
  Film,
  Music,
  Type,
  Layers
} from 'lucide-react';
import { TemplateElement } from '../../types';

export const Timeline: React.FC = () => {
  const {
    currentTemplate,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlayPause,
    activeElementId,
    setActiveElementId,
    updateElement,
    seekTo,
  } = useStudio();

  const timelineTrackAreaRef = useRef<HTMLDivElement>(null);
  const totalDuration = currentTemplate.duration || 8;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTrackAreaRef.current) return;
    const rect = timelineTrackAreaRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * totalDuration;
    seekTo(Number(newTime.toFixed(2)));
  };

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  // Group elements into distinct track rows
  const dynamicElements = currentTemplate.elements.filter(e => e.isDynamic);
  const fixedElements = currentTemplate.elements.filter(e => !e.isDynamic);

  return (
    <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 select-none z-30">
      {/* Top Timeline Transport Toolbar */}
      <div className="h-10 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between">
        {/* Playback Transport */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => seekTo(0)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Rewind to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => seekTo(Math.max(0, currentTime - 1))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Back 1 second"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={togglePlayPause}
            className="w-7 h-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>
          <button
            onClick={() => seekTo(Math.min(totalDuration, currentTime + 1))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Forward 1 second"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Timecode Readout */}
          <div className="ml-2 px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 font-semibold tracking-wider">
            <span>{formatTimecode(currentTime)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{formatTimecode(totalDuration)}</span>
          </div>
        </div>

        {/* Clip Quick Adjustments */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Selected Clip Duration:</span>
          {activeElementId && (
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              <button
                onClick={() => {
                  const el = currentTemplate.elements.find(e => e.id === activeElementId);
                  if (el && el.duration > 1) {
                    updateElement(activeElementId, { duration: Number((el.duration - 0.5).toFixed(1)) });
                  }
                }}
                className="p-0.5 hover:text-white text-slate-400"
                title="Shorten clip 0.5s"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono text-[11px] text-white px-1">
                {currentTemplate.elements.find(e => e.id === activeElementId)?.duration.toFixed(1)}s
              </span>
              <button
                onClick={() => {
                  const el = currentTemplate.elements.find(e => e.id === activeElementId);
                  if (el && (el.startTime + el.duration + 0.5) <= totalDuration) {
                    updateElement(activeElementId, { duration: Number((el.duration + 0.5).toFixed(1)) });
                  }
                }}
                className="p-0.5 hover:text-white text-slate-400"
                title="Lengthen clip 0.5s"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Track Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left column) */}
        <div className="w-52 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-xs select-none">
          {/* Time ruler placeholder */}
          <div className="h-6 border-b border-slate-800 px-3 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/80">
            Tracks
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-1">
            <div className="h-10 px-2.5 rounded bg-slate-800/80 flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-2 truncate">
                <Film className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-medium truncate">Video Background</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Loop</span>
            </div>

            <div className="h-12 px-2.5 rounded bg-slate-800/80 flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-2 truncate">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <div className="truncate">
                  <div className="text-[11px] font-semibold text-amber-300 truncate">Dynamic Elements</div>
                  <div className="text-[9px] text-slate-400 truncate">{dynamicElements.length} variables</div>
                </div>
              </div>
            </div>

            <div className="h-12 px-2.5 rounded bg-slate-800/80 flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <div className="truncate">
                  <div className="text-[11px] font-semibold text-emerald-300 truncate">Fixed Brand Elements</div>
                  <div className="text-[9px] text-slate-400 truncate">{fixedElements.length} static</div>
                </div>
              </div>
            </div>

            <div className="h-10 px-2.5 rounded bg-slate-800/80 flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-2 truncate">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-medium truncate">Background Audio</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">100%</span>
            </div>
          </div>
        </div>

        {/* Tracks Timeline Body & Ruler */}
        <div
          ref={timelineTrackAreaRef}
          onClick={handleTimelineClick}
          className="flex-1 flex flex-col relative overflow-x-auto overflow-y-hidden cursor-crosshair bg-slate-950"
        >
          {/* Time Ruler (Seconds markers) */}
          <div className="h-6 border-b border-slate-800 bg-slate-900/60 relative flex items-center shrink-0">
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, sec) => {
              const posPercent = (sec / totalDuration) * 100;
              return (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-slate-700/80 pl-1 text-[9px] font-mono text-slate-400 select-none pointer-events-none"
                  style={{ left: `${posPercent}%` }}
                >
                  {sec}s
                </div>
              );
            })}
          </div>

          {/* Track Rows Container */}
          <div className="flex-1 p-1 space-y-1 relative">
            {/* Background Track Row */}
            <div className="h-10 relative bg-slate-900/40 rounded border border-slate-800/60 overflow-hidden">
              <div
                className="absolute inset-y-0.5 rounded bg-gradient-to-r from-blue-900/80 to-indigo-900/80 border border-blue-500/40 flex items-center px-3"
                style={{ left: '0%', width: '100%' }}
              >
                <span className="text-[10px] font-mono text-blue-200 truncate">
                  🎬 Background Scene (Unique per record / AI prompt)
                </span>
              </div>
            </div>

            {/* Dynamic Elements Track Row */}
            <div className="h-12 relative bg-slate-900/40 rounded border border-slate-800/60 overflow-hidden">
              {dynamicElements.map(el => {
                const leftPct = (el.startTime / totalDuration) * 100;
                const widthPct = (el.duration / totalDuration) * 100;
                const isSelected = activeElementId === el.id;

                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveElementId(el.id);
                    }}
                    className={`absolute inset-y-1 rounded px-2 flex items-center justify-between text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white border-white ring-2 ring-amber-400/50 shadow-lg'
                        : 'bg-amber-950/80 text-amber-200 border-amber-600/50 hover:bg-amber-900/80'
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(4, widthPct)}%`,
                    }}
                  >
                    <span className="truncate text-[10px] font-mono font-bold">
                      ★ {el.dynamicField || el.name}
                    </span>
                    <span className="text-[9px] opacity-75 font-mono ml-1">{el.duration}s</span>
                  </div>
                );
              })}
            </div>

            {/* Fixed Elements Track Row */}
            <div className="h-12 relative bg-slate-900/40 rounded border border-slate-800/60 overflow-hidden">
              {fixedElements.map(el => {
                const leftPct = (el.startTime / totalDuration) * 100;
                const widthPct = (el.duration / totalDuration) * 100;
                const isSelected = activeElementId === el.id;

                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveElementId(el.id);
                    }}
                    className={`absolute inset-y-1 rounded px-2 flex items-center justify-between text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-400/50 shadow-lg'
                        : 'bg-emerald-950/80 text-emerald-200 border-emerald-600/50 hover:bg-emerald-900/80'
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(4, widthPct)}%`,
                    }}
                  >
                    <span className="truncate text-[10px] font-mono font-bold">
                      🔒 {el.name}
                    </span>
                    <span className="text-[9px] opacity-75 font-mono ml-1">{el.duration}s</span>
                  </div>
                );
              })}
            </div>

            {/* Audio Track Row */}
            <div className="h-10 relative bg-slate-900/40 rounded border border-slate-800/60 overflow-hidden">
              <div
                className="absolute inset-y-0.5 rounded bg-gradient-to-r from-purple-900/80 to-fuchsia-900/80 border border-purple-500/40 flex items-center px-3"
                style={{ left: '0%', width: '100%' }}
              >
                <span className="text-[10px] font-mono text-purple-200 truncate">
                  🎵 Synthwave Chill Ambient Loop (High Energy Dynamic Mix)
                </span>
              </div>
            </div>

            {/* Red Playhead Line & Cursor */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none transition-all duration-75"
              style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            >
              {/* Playhead Handle */}
              <div className="w-3.5 h-3.5 -ml-1.5 -top-1 bg-red-500 rotate-45 rounded-sm shadow-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
