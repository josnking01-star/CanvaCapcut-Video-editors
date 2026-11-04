import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Download, 
  X, 
  Film, 
  CheckCircle2, 
  RefreshCw, 
  Settings,
  Sparkles
} from 'lucide-react';
import { CanvasVideoRenderer } from '../../utils/videoRenderer';

export const ExportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentTemplate, showToast } = useStudio();

  const [format, setFormat] = useState<'webm' | 'mp4'>('webm');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderedBlobUrl(null);

    try {
      const renderer = new CanvasVideoRenderer(currentTemplate);
      const videoBlob = await renderer.renderVideoBlob(fps, (progress) => {
        setRenderProgress(progress);
      });

      const url = URL.createObjectURL(videoBlob);
      setRenderedBlobUrl(url);
      setIsRendering(false);
      showToast('Video rendered successfully! Ready for download.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Render error:', message);
      showToast(`Rendering error: ${message}`);
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderedBlobUrl) return;
    const a = document.createElement('a');
    a.href = renderedBlobUrl;
    a.download = `${currentTemplate.name.replace(/\s+/g, '_')}_${resolution}_${fps}fps.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Export Master Video
            </h2>
            <p className="text-xs text-slate-400">
              Render with hardware-accelerated canvas engine.
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Export Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '720p', label: '720p HD' },
                { id: '1080p', label: '1080p FHD' },
                { id: '4k', label: '4K Ultra' },
              ].map(res => (
                <button
                  key={res.id}
                  onClick={() => setResolution(res.id as any)}
                  className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                    resolution === res.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Frame Rate</label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              >
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Smooth Motion)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono uppercase"
              >
                <option value="webm">WebM / VP9</option>
                <option value="mp4">MP4 Video</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Aspect Ratio:</span>
              <span className="font-mono text-white">{currentTemplate.dimensions.label}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Duration:</span>
              <span className="font-mono text-white">{currentTemplate.duration} seconds</span>
            </div>
          </div>
        </div>

        {/* Progress or Render Button */}
        {isRendering ? (
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Rendering Frames...
              </span>
              <span className="font-mono font-bold">{renderProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-600 h-full transition-all duration-150"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
          </div>
        ) : renderedBlobUrl ? (
          <button
            onClick={handleDownload}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Completed Video</span>
          </button>
        ) : (
          <button
            onClick={handleStartRender}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Film className="w-4 h-4" />
            <span>Start Rendering Video</span>
          </button>
        )}
      </div>
    </div>
  );
};
