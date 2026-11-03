import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileArchive, 
  ArrowRight, 
  Layers, 
  Check, 
  RefreshCw, 
  Film,
  Database,
  Eye,
  Sliders,
  ExternalLink,
  Wand2,
  Volume2,
  Edit3,
  X,
  FileText,
  Monitor,
  Tv,
  Smartphone,
  Square,
  FolderDown
} from 'lucide-react';
import { UniqueBackgroundMode, AspectRatio } from '../../types';
import { STOCK_BACKGROUND_MEDIA } from '../../data/presetData';
import { speakQuizVoiceover } from '../../utils/videoRenderer';
import { PLATFORM_ASPECT_RATIOS } from '../../utils/bulkEngine';

export const BulkAutomationView: React.FC = () => {
  const {
    currentTemplate,
    spreadsheetRecords,
    spreadsheetColumns,
    columnMappings,
    updateMapping,
    autoMapColumns,
    handleFileUpload,
    loadPresetDataset,
    uniqueBackgroundMode,
    setUniqueBackgroundMode,
    backgroundPromptColumn,
    setBackgroundPromptColumn,
    fallbackPrompt,
    setFallbackPrompt,
    bulkQueue,
    isBulkProcessing,
    bulkProgressPercent,
    startBulkGeneration,
    pauseBulkGeneration,
    cancelBulkGeneration,
    renderedResults,
    downloadVideoBlob,
    downloadAllAsZip,
    isZipping,
    zipProgress,
    loadRecordIntoEditor,
    updateBulkQueueItem,
    selectedExportRatios,
    setSelectedExportRatios,
    toggleExportRatio,
    showToast,
  } = useStudio();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<Record<string, string>>({});
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [activeTTSIndex, setActiveTTSIndex] = useState<number | null>(null);

  // Dynamic elements in the current template
  const dynamicElements = currentTemplate.elements.filter(e => e.isDynamic);
  const fixedElements = currentTemplate.elements.filter(e => !e.isDynamic);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-y-auto custom-scrollbar select-none">
      {/* Top Header & Workflow Tracker */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-lg font-bold text-white tracking-wide">
                Universal Data-Independent Bulk Video Engine
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automate hundreds of videos from any Excel/CSV spreadsheet. Unique AI background prompt & media per video.
            </p>
          </div>

          {/* Step Indicator Badges */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[
              { num: 1, label: 'Data Import' },
              { num: 2, label: 'Variable Mapping' },
              { num: 3, label: 'Unique Backgrounds' },
              { num: 4, label: 'Render & Export' },
            ].map(step => (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeStep === step.num
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === step.num ? 'bg-white text-indigo-700' : 'bg-slate-800 text-slate-400'
                }`}>
                  {step.num}
                </span>
                <span>{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* STEP 1: DYNAMIC SPREADSHEET IMPORT */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* File Upload Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="md:col-span-2 border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/60 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative group"
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Upload Excel (.xlsx, .xls) or CSV Spreadsheet
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Drag and drop your spreadsheet here or click to browse. Supports variable columns, rows, custom headers, and multi-sheet workbooks.
                </p>
                <div className="mt-3 text-[11px] text-indigo-400 font-mono">
                  Supported: 10, 50, 100, 500 or 1,000+ records
                </div>
              </div>

              {/* Instant Preset Datasets */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Quick Preset Datasets
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Test the complete bulk pipeline immediately with verified datasets:
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        loadPresetDataset('medical');
                        showToast('Loaded 5 Medical Quiz records with unique prompts');
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-colors flex items-center justify-between text-xs text-slate-200"
                    >
                      <span className="font-semibold">🩺 Medical Quiz (5 rows)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Loaded</span>
                    </button>

                    <button
                      onClick={() => {
                        loadPresetDataset('motivational');
                        showToast('Loaded 4 Motivational records with unique prompts');
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-colors flex items-center justify-between text-xs text-slate-200"
                    >
                      <span className="font-semibold">🔥 Motivational Quotes (4 rows)</span>
                      <span className="text-[10px] text-amber-400 font-mono">Load</span>
                    </button>

                    <button
                      onClick={() => {
                        loadPresetDataset('facts');
                        showToast('Loaded 3 Facts & Trivia records with unique prompts');
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-colors flex items-center justify-between text-xs text-slate-200"
                    >
                      <span className="font-semibold">🌍 Science & History Facts (3 rows)</span>
                      <span className="text-[10px] text-blue-400 font-mono">Load</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                  Ready to test? Proceed to Column Mapping.
                </div>
              </div>
            </div>

            {/* Auto-Detected Columns Inspector */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Detected Spreadsheet Columns ({spreadsheetColumns.length} fields found)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Currently loaded: {spreadsheetRecords.length} records ready for generation.
                  </p>
                </div>
                <button
                  onClick={() => setActiveStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                >
                  <span>Configure Variable Mapping</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {spreadsheetColumns.map(col => (
                  <div key={col.name} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-300 truncate">{col.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        col.detectedType === 'prompt' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {col.detectedType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 italic">
                      "{col.sampleValues[0] || 'No sample data'}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: UNIVERSAL VARIABLE MAPPING */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Dynamic Element Mapping Matrix
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect spreadsheet columns to dynamic template elements. Fixed elements remain untouched across all videos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={autoMapColumns}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Auto-Match Columns</span>
                  </button>

                  <button
                    onClick={() => setActiveStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <span>Configure Backgrounds</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mapping Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Template Element</th>
                      <th className="py-2.5 px-4">Data Type</th>
                      <th className="py-2.5 px-4">Mapped Spreadsheet Column</th>
                      <th className="py-2.5 px-4">Sample Value (Record #1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {/* DYNAMIC ELEMENTS */}
                    {dynamicElements.map(el => {
                      const currentMapping = columnMappings.find(m => m.targetElementId === el.id);
                      const sampleVal = currentMapping ? spreadsheetRecords[0]?.[currentMapping.columnName] : '';

                      return (
                        <tr key={el.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{el.name}</div>
                            <div className="text-[10px] text-amber-400 font-mono">
                              Field ID: {el.dynamicField || el.id}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                              DYNAMIC
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={currentMapping?.columnName || ''}
                              onChange={(e) => updateMapping(el.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono w-full max-w-xs focus:outline-none focus:border-indigo-500"
                            >
                              <option value="">-- Select Column --</option>
                              {spreadsheetColumns.map(col => (
                                <option key={col.name} value={col.name}>
                                  {col.name} ({col.detectedType})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-300 max-w-xs truncate">
                            {sampleVal ? `"${sampleVal}"` : <span className="text-slate-500">Not mapped yet</span>}
                          </td>
                        </tr>
                      );
                    })}

                    {/* FIXED ELEMENTS */}
                    {fixedElements.map(el => (
                      <tr key={el.id} className="bg-slate-900/30 text-slate-400">
                        <td className="py-3 px-4 font-medium text-slate-300">{el.name}</td>
                        <td className="py-3 px-4">
                          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                            FIXED (PRESERVED)
                          </span>
                        </td>
                        <td className="py-3 px-4 italic text-slate-500 text-[11px]">
                          Static across every generated video
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate">
                          "{el.text || el.defaultValue || 'Fixed design asset'}"
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: UNIQUE BACKGROUND FOR EVERY GENERATED VIDEO (PART 5) */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Unique Background Engine (Part 5 Specification)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Every generated video receives a unique background image or video while maintaining exact template design and typography.
                  </p>
                </div>
                <button
                  onClick={() => setActiveStep(4)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                >
                  <span>Go to Bulk Render</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Assignment Mode Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: 'per-row-prompt',
                    title: 'Spreadsheet Prompt Column',
                    desc: 'Uses custom background prompt specified in each spreadsheet row (e.g. Background_Prompt).',
                  },
                  {
                    id: 'sequential-video',
                    title: 'Sequential Stock Loops',
                    desc: 'Cycles through curated cinematic video loops (Video 1 gets Loop A, Video 2 gets Loop B, etc).',
                  },
                  {
                    id: 'random-stock',
                    title: 'Randomized Stock Library',
                    desc: 'Randomly assigns distinct 8K backgrounds across all generated videos without unnecessary repetition.',
                  },
                ].map(mode => {
                  const isSelected = uniqueBackgroundMode === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => setUniqueBackgroundMode(mode.id as UniqueBackgroundMode)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">{mode.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{mode.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Column selector for per-row prompt mode */}
              {uniqueBackgroundMode === 'per-row-prompt' && (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    Select Spreadsheet Column Containing Background Prompts:
                  </label>
                  <select
                    value={backgroundPromptColumn}
                    onChange={(e) => setBackgroundPromptColumn(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-mono w-full max-w-md focus:outline-none focus:border-indigo-500"
                  >
                    {spreadsheetColumns.map(col => (
                      <option key={col.name} value={col.name}>
                        {col.name} ({col.detectedType})
                      </option>
                    ))}
                  </select>

                  <div className="pt-2">
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Fallback Prompt (Used if a row has an empty prompt cell):
                    </label>
                    <input
                      type="text"
                      value={fallbackPrompt}
                      onChange={(e) => setFallbackPrompt(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Multi-Platform Output Aspect Ratios & Folder Organization Matrix */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <FolderDown className="w-4 h-4 text-emerald-400" />
                      <span>Multi-Platform Target Formats & Dedicated Subfolders</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select which platform sizes to generate. All videos are auto-organized into separate folders in the final ZIP.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedExportRatios.length === PLATFORM_ASPECT_RATIOS.length) {
                        setSelectedExportRatios(['9:16']);
                      } else {
                        setSelectedExportRatios(PLATFORM_ASPECT_RATIOS.map(p => p.id));
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold self-start sm:self-auto transition-colors"
                  >
                    {selectedExportRatios.length === PLATFORM_ASPECT_RATIOS.length ? 'Deselect All' : 'Select All 4 Platforms'}
                  </button>
                </div>

                {/* Platform Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PLATFORM_ASPECT_RATIOS.map(platform => {
                    const isChecked = selectedExportRatios.includes(platform.id);
                    return (
                      <div
                        key={platform.id}
                        onClick={() => toggleExportRatio(platform.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isChecked
                            ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {platform.id === '16:9' ? <Tv className="w-3.5 h-3.5 text-red-400" /> : (
                                platform.id === '9:16' ? <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> : (
                                  platform.id === '1:1' ? <Square className="w-3.5 h-3.5 text-pink-400" /> : <Monitor className="w-3.5 h-3.5 text-blue-400" />
                                )
                              )}
                              <span>{platform.name}</span>
                            </span>
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono">
                            {platform.resolution} ({platform.id})
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                            {platform.desc}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[9px] font-mono text-emerald-400 truncate">
                          📁 /{platform.folderName}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Auto-responsive Layout confirmation notice */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
                  <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-bold text-white">Smart Auto-Adjust & Responsive Typography Active: </span>
                    Question width, option buttons positioning (side-by-side in 16:9 widescreen, stacked in 9:16 vertical), countdown timer bar, and text font sizes automatically scale to fit each ratio perfectly without manual cropping!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: BULK PROCESSING QUEUE & RENDER GALLERY */}
        {activeStep === 4 && (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Bulk Render Queue ({bulkQueue.length} Videos × {selectedExportRatios.length} Formats = {bulkQueue.length * selectedExportRatios.length} Total Outputs)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-aspect ratio worker rendering {selectedExportRatios.join(', ')} with auto-adapted layouts and organized folder export.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isBulkProcessing ? (
                  <button
                    onClick={startBulkGeneration}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Generate All {bulkQueue.length * selectedExportRatios.length} Videos</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={pauseBulkGeneration}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                    <button
                      onClick={cancelBulkGeneration}
                      className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg"
                    >
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                {renderedResults.length > 0 && (
                  <button
                    onClick={downloadAllAsZip}
                    disabled={isZipping}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                  >
                    {isZipping ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Zipping {zipProgress}%</span>
                      </>
                    ) : (
                      <>
                        <FolderDown className="w-4 h-4" />
                        <span>Download Multi-Platform ZIP ({renderedResults.length} videos in folders)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Live Progress Bar */}
            {isBulkProcessing && (
              <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300">
                    Bulk Rendering in Progress... ({bulkProgressPercent}% Completed)
                  </span>
                  <span className="font-mono text-slate-400">
                    {renderedResults.length} / {bulkQueue.length} Videos Done
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${bulkProgressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Generated Videos Grid Gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {bulkQueue.map((item, idx) => {
                const itemRenderedList = renderedResults.filter(r => r.index === item.index);
                const rendered = itemRenderedList[0];
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between group hover:border-slate-600 transition-all shadow-md"
                  >
                    {/* Thumbnail Preview Area */}
                    <div className="relative aspect-[9/16] bg-slate-950 overflow-hidden flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="p-4 text-center">
                          <Film className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                          <div className="text-[11px] text-slate-500 font-mono">Queue #{item.index}</div>
                        </div>
                      )}

                      {/* Status Overlay Badge */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.status === 'completed'
                              ? 'bg-emerald-500/90 text-white'
                              : (item.status === 'processing'
                                ? 'bg-indigo-600/90 text-white animate-pulse'
                                : 'bg-slate-800/90 text-slate-300')
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Video index badge */}
                      <div className="absolute top-2 right-2 bg-slate-950/80 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                        #{item.index}
                      </div>

                      {/* TTS Voiceover Play Button Overlay */}
                      <div className="absolute bottom-2 right-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const q = item.dataRow.Question || item.dataRow.question || item.title || '';
                            const a = item.dataRow.Option_A || item.dataRow.option_a || '';
                            const b = item.dataRow.Option_B || item.dataRow.option_b || '';
                            const ans = item.dataRow.Correct_Answer || item.dataRow.correct_answer || item.dataRow.Answer || '';
                            setActiveTTSIndex(idx);
                            speakQuizVoiceover(q, a, b, ans);
                            setTimeout(() => setActiveTTSIndex(null), 7000);
                            showToast(`Playing TTS Voiceover for Video #${item.index}`);
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-md transition-all shadow flex items-center gap-1 ${
                            activeTTSIndex === idx
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                              : 'bg-slate-950/85 hover:bg-slate-900 text-amber-300 border border-amber-500/40 hover:border-amber-400'
                          }`}
                          title="Listen to TTS Voiceover (Question, Options & Answer)"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{activeTTSIndex === idx ? 'Speaking...' : 'TTS Voice'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Info & Actions */}
                    <div className="p-3 space-y-2.5">
                      <div className="font-semibold text-xs text-white truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 italic font-mono" title={item.backgroundPrompt}>
                        Prompt: "{item.backgroundPrompt || 'Default template media'}"
                      </div>

                      {/* Quick Edit & Studio Editor Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button
                          onClick={() => {
                            loadRecordIntoEditor(idx);
                          }}
                          className="bg-indigo-600/90 hover:bg-indigo-500 text-white py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95"
                          title="Open this specific video in the full Canva & CapCut timeline editor"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Studio Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditRowData({ ...item.dataRow });
                            setEditPrompt(item.backgroundPrompt || '');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
                          title="Quickly edit text fields, options, correct answer, or background prompt"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                          <span>Quick Edit</span>
                        </button>
                      </div>

                      {/* Multi-Platform Download Buttons */}
                      {itemRenderedList.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center justify-between">
                            <span>Ready ({itemRenderedList.length} format{itemRenderedList.length > 1 ? 's' : ''}):</span>
                            <span>{itemRenderedList.reduce((acc, curr) => acc + curr.sizeKb, 0)} KB</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {itemRenderedList.map(r => (
                              <button
                                key={r.ratio || r.url}
                                onClick={() => downloadVideoBlob(r)}
                                className="flex-1 min-w-[65px] bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 py-1 px-1.5 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
                                title={`Download ${r.ratio} (${r.folderName})`}
                              >
                                <Download className="w-2.5 h-2.5" />
                                <span>{r.ratio || 'Video'}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-mono py-1 text-center">
                          {item.status === 'processing' ? `Rendering (${item.progress || 0}%)...` : 'Ready for multi-platform render'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* QUICK EDIT MODAL FOR INDIVIDUAL BULK VIDEO RECORD */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Edit Video Record #{editingIndex + 1}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Modify question text, answer choices, reveal facts, or background AI prompt.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingIndex(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Editable Data Fields */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              {/* Question */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-300 block">
                  Question / Main Hook:
                </label>
                <textarea
                  rows={2}
                  value={editRowData.Question || editRowData.question || editRowData.Title || ''}
                  onChange={(e) => {
                    const key = editRowData.Question !== undefined ? 'Question' : (editRowData.question !== undefined ? 'question' : 'Title');
                    setEditRowData(prev => ({ ...prev, [key]: e.target.value }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Enter the quiz question..."
                />
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Option A:
                  </label>
                  <input
                    type="text"
                    value={editRowData.Option_A || editRowData.option_a || ''}
                    onChange={(e) => {
                      const key = editRowData.Option_A !== undefined ? 'Option_A' : 'option_a';
                      setEditRowData(prev => ({ ...prev, [key]: e.target.value }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Option A label"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Option B:
                  </label>
                  <input
                    type="text"
                    value={editRowData.Option_B || editRowData.option_b || ''}
                    onChange={(e) => {
                      const key = editRowData.Option_B !== undefined ? 'Option_B' : 'option_b';
                      setEditRowData(prev => ({ ...prev, [key]: e.target.value }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Option B label"
                  />
                </div>
              </div>

              {/* Correct Answer & Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-400 block">
                    Correct Answer (Reveals at 7.5s):
                  </label>
                  <input
                    type="text"
                    value={editRowData.Correct_Answer || editRowData.correct_answer || editRowData.Answer || ''}
                    onChange={(e) => {
                      const key = editRowData.Correct_Answer !== undefined ? 'Correct_Answer' : (editRowData.correct_answer !== undefined ? 'correct_answer' : 'Answer');
                      setEditRowData(prev => ({ ...prev, [key]: e.target.value }));
                    }}
                    className="w-full bg-slate-950 border border-emerald-600/50 rounded-lg p-2.5 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. Option A or Option B"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Fact / Scientific Detail:
                  </label>
                  <input
                    type="text"
                    value={editRowData.Fact_Detail || editRowData.fact_detail || editRowData.Detail || ''}
                    onChange={(e) => {
                      const key = editRowData.Fact_Detail !== undefined ? 'Fact_Detail' : (editRowData.fact_detail !== undefined ? 'fact_detail' : 'Detail');
                      setEditRowData(prev => ({ ...prev, [key]: e.target.value }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Scientific explanation or bonus fact..."
                  />
                </div>
              </div>

              {/* Background Prompt */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-amber-300 block">
                  Background Visual Theme / Prompt:
                </label>
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-400"
                  placeholder="e.g. 4k cinematic microscopy glowing medical cells..."
                />
              </div>

              {/* Other dynamic fields if present */}
              {Object.keys(editRowData).filter(k => !['Question', 'question', 'Option_A', 'option_a', 'Option_B', 'option_b', 'Correct_Answer', 'correct_answer', 'Answer', 'Fact_Detail', 'fact_detail', 'Detail', 'Title', 'Background_Prompt', 'background_prompt'].includes(k)).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Additional Columns
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.keys(editRowData).filter(k => !['Question', 'question', 'Option_A', 'option_a', 'Option_B', 'option_b', 'Correct_Answer', 'correct_answer', 'Answer', 'Fact_Detail', 'fact_detail', 'Detail', 'Title', 'Background_Prompt', 'background_prompt'].includes(k)).map(colKey => (
                      <div key={colKey} className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 block truncate">{colKey}</label>
                        <input
                          type="text"
                          value={editRowData[colKey] || ''}
                          onChange={(e) => setEditRowData(prev => ({ ...prev, [colKey]: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const q = editRowData.Question || editRowData.question || editRowData.Title || '';
                  const a = editRowData.Option_A || editRowData.option_a || '';
                  const b = editRowData.Option_B || editRowData.option_b || '';
                  const ans = editRowData.Correct_Answer || editRowData.correct_answer || editRowData.Answer || '';
                  speakQuizVoiceover(q, a, b, ans);
                  showToast('Previewing TTS voiceover...');
                }}
                className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Voiceover (TTS)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (editingIndex !== null) {
                      updateBulkQueueItem(editingIndex, editRowData, editPrompt);
                      loadRecordIntoEditor(editingIndex);
                      setEditingIndex(null);
                    }
                  }}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Save & Open in Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (editingIndex !== null) {
                      updateBulkQueueItem(editingIndex, editRowData, editPrompt);
                      setEditingIndex(null);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
