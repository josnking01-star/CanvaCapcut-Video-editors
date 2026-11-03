import React, { useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  Sparkle,
  Layers,
  Sparkles
} from 'lucide-react';
import { TemplateElement } from '../../types';

export const CanvasArea: React.FC = () => {
  const {
    currentTemplate,
    activeElementId,
    setActiveElementId,
    activeElement,
    updateElement,
    duplicateElement,
    deleteElement,
    currentTime,
    zoomLevel,
    setZoomLevel,
  } = useStudio();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);

  const { width: canvasWidth, height: canvasHeight } = currentTemplate.dimensions;

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(1.5, prev + 0.1));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.3, prev - 0.1));
  const handleZoomReset = () => setZoomLevel(0.65);

  // Mouse drag handling on canvas
  const handleElementMouseDown = (e: React.MouseEvent, el: TemplateElement) => {
    e.stopPropagation();
    setActiveElementId(el.id);
    if (el.isLocked) return;

    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !activeElement || activeElement.isLocked) return;

    const deltaX = (e.clientX - dragStart.mouseX) / zoomLevel;
    const deltaY = (e.clientY - dragStart.mouseY) / zoomLevel;

    updateElement(activeElement.id, {
      x: Math.round(dragStart.elX + deltaX),
      y: Math.round(dragStart.elY + deltaY),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => setActiveElementId(null)}
      className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none p-6"
      style={{
        backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Top Floating Canvas Toolbar */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg shadow-lg">
        <span className="text-xs text-slate-400 font-mono">
          {canvasWidth} × {canvasHeight} ({currentTemplate.dimensions.ratio})
        </span>
        <div className="h-3 w-px bg-slate-700 mx-1"></div>
        <button
          onClick={handleZoomOut}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-mono text-slate-200 min-w-[42px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomReset}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selected Element Quick Action Floating HUD */}
      {activeElement && (
        <div className="absolute top-4 right-6 z-20 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xl animate-fade-in">
          <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate mr-1">
            {activeElement.name}
          </span>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              activeElement.isDynamic
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {activeElement.isDynamic ? `DYNAMIC: ${activeElement.dynamicField || 'Field'}` : 'FIXED'}
          </span>

          <div className="h-3 w-px bg-slate-700 mx-1"></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateElement(activeElement.id);
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              updateElement(activeElement.id, { isLocked: !activeElement.isLocked });
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={activeElement.isLocked ? 'Unlock Element' : 'Lock Element'}
          >
            {activeElement.isLocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteElement(activeElement.id);
            }}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div
        className="relative transition-transform duration-75 shadow-2xl rounded-sm overflow-hidden border border-slate-700/60"
        style={{
          width: canvasWidth * zoomLevel,
          height: canvasHeight * zoomLevel,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Internal Scaled Artboard */}
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoomLevel})`,
          }}
        >
          {/* Background Layer */}
          <div className="absolute inset-0 overflow-hidden">
            {currentTemplate.defaultBackgroundUrl ? (
              <img
                src={currentTemplate.defaultBackgroundUrl}
                alt="Template Background"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: currentTemplate.backgroundColor || 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)',
                }}
              />
            )}
            {/* Cinematic dark tint overlay */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Render Elements */}
          {currentTemplate.elements.map(el => {
            const isSelected = activeElementId === el.id;
            // Check if element is active at currentTime
            const isTimelineActive = currentTime >= el.startTime && currentTime <= (el.startTime + el.duration);

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleElementMouseDown(e, el)}
                className={`absolute cursor-move transition-opacity ${
                  isTimelineActive ? 'opacity-100' : 'opacity-25'
                } ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-950/50 shadow-2xl z-40' : 'hover:ring-1 hover:ring-indigo-400/50'}`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  opacity: el.opacity,
                  zIndex: el.zIndex,
                }}
              >
                {/* Visual Label Pill on Selected / Dynamic Element */}
                <div
                  className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider pointer-events-none shadow-md flex items-center gap-1 ${
                    el.isDynamic
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  <span>{el.isDynamic ? `★ DYNAMIC: ${el.dynamicField || el.name}` : `🔒 FIXED: ${el.name}`}</span>
                </div>

                {/* Render Shape */}
                {el.type === 'shape' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: el.backgroundColor || '#6366f1',
                      borderRadius: el.borderRadius || 12,
                      borderColor: el.borderColor,
                      borderWidth: el.borderWidth ? `${el.borderWidth}px` : undefined,
                      borderStyle: el.borderWidth ? 'solid' : undefined,
                    }}
                  />
                )}

                {/* Render Badge or Text */}
                {(el.type === 'text' || el.type === 'badge' || el.type === 'watermark') && (
                  <div
                    className="w-full h-full flex items-center justify-center p-4 text-center leading-relaxed"
                    style={{
                      fontFamily: `"${el.fontFamily || 'Plus Jakarta Sans'}", sans-serif`,
                      fontSize: `${el.fontSize}px`,
                      fontWeight: el.fontWeight || '700',
                      color: el.color || '#ffffff',
                      textAlign: el.textAlign || 'center',
                      letterSpacing: `${el.letterSpacing || 0}px`,
                      lineHeight: el.lineHeight || 1.3,
                      backgroundColor: el.backgroundColor,
                      borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                      borderColor: el.borderColor,
                      borderWidth: el.borderWidth ? `${el.borderWidth}px` : undefined,
                      borderStyle: el.borderWidth ? 'solid' : undefined,
                      textShadow: el.shadowColor
                        ? `2px 2px ${el.shadowBlur || 8}px ${el.shadowColor}`
                        : undefined,
                      WebkitTextStroke: el.outlineWidth && el.outlineColor
                        ? `${el.outlineWidth}px ${el.outlineColor}`
                        : undefined,
                    }}
                  >
                    {el.text || el.defaultValue || 'Sample Text'}
                  </div>
                )}

                {/* Resize Corners if selected */}
                {isSelected && (
                  <>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow"></div>
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow"></div>
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow"></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow"></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
