import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  ProjectTemplate, 
  TemplateElement, 
  CanvasDimensions, 
  ASPECT_RATIOS, 
  AspectRatio,
  SpreadsheetColumn, 
  ColumnMapping, 
  UniqueBackgroundMode, 
  BulkVideoItem,
  License, 
  Customer, 
  WhiteLabelSettings,
  ElementType 
} from '../types';
import { DEFAULT_TEMPLATES, PRESET_DATASETS, STOCK_BACKGROUND_MEDIA } from '../data/presetData';
import { 
  parseSpreadsheetBuffer, 
  parseCSVText, 
  autoSuggestMappings, 
  applyRecordToTemplate, 
  assignBackgroundsToRecords, 
  createBulkQueueItems,
  adaptTemplateToAspectRatio,
  PLATFORM_ASPECT_RATIOS,
  PlatformPreset
} from '../utils/bulkEngine';
import { CanvasVideoRenderer, bundleVideosToZip } from '../utils/videoRenderer';
import { getInitialLicenseStore } from '../utils/licensing';

export type ActiveStudioView = 'editor' | 'bulk' | 'templates' | 'media' | 'admin' | 'desktop' | 'docs';

export interface RenderedResult {
  index: number;
  title: string;
  blob: Blob;
  url: string;
  thumbnailUrl: string;
  sizeKb: number;
  ratio?: AspectRatio;
  folderName?: string;
  resolution?: string;
}

interface StudioContextType {
  // Navigation
  activeView: ActiveStudioView;
  setActiveView: (view: ActiveStudioView) => void;

  // Project / Template State
  currentTemplate: ProjectTemplate;
  setCurrentTemplate: (tpl: ProjectTemplate) => void;
  updateTemplateProperty: (updates: Partial<ProjectTemplate>) => void;
  setAspectRatio: (ratio: AspectRatio, autoAdapt?: boolean) => void;
  adaptCurrentTemplateLayout: (ratio: AspectRatio) => void;
  selectedExportRatios: AspectRatio[];
  setSelectedExportRatios: (ratios: AspectRatio[]) => void;
  toggleExportRatio: (ratio: AspectRatio) => void;
  templatesList: ProjectTemplate[];
  saveTemplateAsNew: (name: string) => void;
  loadTemplate: (templateId: string) => void;

  // Canvas / Element Editing
  activeElementId: string | null;
  setActiveElementId: (id: string | null) => void;
  activeElement: TemplateElement | null;
  updateElement: (id: string, updates: Partial<TemplateElement>) => void;
  addElement: (type: ElementType, options?: Partial<TemplateElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  toggleDynamicElement: (id: string, isDynamic: boolean, fieldName?: string) => void;
  zoomLevel: number;
  setZoomLevel: (z: number | ((prev: number) => number)) => void;

  // CapCut-Style Video Timeline
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;

  // Universal Bulk Automation Engine
  spreadsheetRecords: Record<string, string>[];
  spreadsheetColumns: SpreadsheetColumn[];
  columnMappings: ColumnMapping[];
  activeSheetName: string;
  availableSheets: string[];
  uniqueBackgroundMode: UniqueBackgroundMode;
  setUniqueBackgroundMode: (mode: UniqueBackgroundMode) => void;
  backgroundPromptColumn: string;
  setBackgroundPromptColumn: (col: string) => void;
  fallbackPrompt: string;
  setFallbackPrompt: (prompt: string) => void;
  loadPresetDataset: (presetKey: keyof typeof PRESET_DATASETS) => void;
  handleFileUpload: (file: File) => Promise<void>;
  updateMapping: (targetElementId: string, columnName: string) => void;
  autoMapColumns: () => void;
  
  // Bulk Render Queue
  bulkQueue: BulkVideoItem[];
  isBulkProcessing: boolean;
  bulkProgressPercent: number;
  startBulkGeneration: () => Promise<void>;
  pauseBulkGeneration: () => void;
  cancelBulkGeneration: () => void;
  renderedResults: RenderedResult[];
  downloadVideoBlob: (result: RenderedResult) => void;
  downloadAllAsZip: () => Promise<void>;
  isZipping: boolean;
  zipProgress: number;
  loadRecordIntoEditor: (recordIndex: number) => void;
  updateBulkQueueItem: (index: number, updatedRow: Record<string, string>, updatedPrompt?: string) => void;

  // Commercial Licensing & Admin
  activeLicense: License;
  setActiveLicense: (lic: License) => void;
  whiteLabel: WhiteLabelSettings;
  setWhiteLabel: (settings: WhiteLabelSettings) => void;
  customers: Customer[];
  refreshAdminData: () => Promise<void>;
  activateNewLicenseKey: (key: string) => Promise<{ success: boolean; message: string }>;

  // Auto-Save Mechanism (Every 30 seconds to localStorage)
  lastSavedTime: string | null;
  isAutoSaving: boolean;
  saveStudioStateNow: () => void;
  restoreSavedState: () => boolean;
  clearSavedState: () => void;

  // Toast Alerts
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StudioContext = createContext<StudioContextType | null>(null);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeView, setActiveView] = useState<ActiveStudioView>('editor');

  // Templates & Canvas
  const [templatesList, setTemplatesList] = useState<ProjectTemplate[]>(DEFAULT_TEMPLATES);
  const [currentTemplate, setCurrentTemplate] = useState<ProjectTemplate>(DEFAULT_TEMPLATES[0]);
  const [activeElementId, setActiveElementId] = useState<string | null>(DEFAULT_TEMPLATES[0].elements[1]?.id || null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.65);

  // Timeline
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playheadIntervalRef = useRef<number | null>(null);

  // Bulk Engine
  const [spreadsheetRecords, setSpreadsheetRecords] = useState<Record<string, string>[]>(PRESET_DATASETS.medical);
  const [spreadsheetColumns, setSpreadsheetColumns] = useState<SpreadsheetColumn[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('Sheet1');
  const [availableSheets, setAvailableSheets] = useState<string[]>(['Sheet1']);
  const [uniqueBackgroundMode, setUniqueBackgroundMode] = useState<UniqueBackgroundMode>('per-row-prompt');
  const [backgroundPromptColumn, setBackgroundPromptColumn] = useState<string>('Background_Prompt');
  const [fallbackPrompt, setFallbackPrompt] = useState<string>('Cinematic 8k video background with atmospheric volumetric lighting');

  // Bulk Queue & Rendering
  const [bulkQueue, setBulkQueue] = useState<BulkVideoItem[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);
  const [bulkProgressPercent, setBulkProgressPercent] = useState<number>(0);
  const [renderedResults, setRenderedResults] = useState<RenderedResult[]>([]);
  const cancelProcessingRef = useRef<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [selectedExportRatios, setSelectedExportRatios] = useState<AspectRatio[]>(['9:16', '16:9']);

  // Commercial Licensing & Owner Data
  const initialStore = getInitialLicenseStore();
  const [activeLicense, setActiveLicense] = useState<License>(initialStore.licenses[0]);
  const [customers, setCustomers] = useState<Customer[]>(initialStore.customers);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelSettings>({
    softwareName: 'OmniCut Studio Elite',
    tagline: 'Next-Gen Kinetic Motion & Multi-Platform Bulk AI Engine',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    brandPrimaryColor: '#6366f1',
    supportEmail: 'support@omnicut-elite.com',
    companyName: 'OmniCreative Global Technologies Ltd.',
    websiteUrl: 'https://omnicut-elite.com',
    version: '3.0.0-win-x64',
    copyrightYear: '2026',
  });

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Auto-Save State
  const AUTO_SAVE_STORAGE_KEY = 'omnicut_studio_autosave_v3';
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(AUTO_SAVE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.timestamp || null;
      }
    } catch (e) {
      console.warn('Failed to parse autosave timestamp:', e);
    }
    return null;
  });
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const stateRestoredRef = useRef<boolean>(false);

  // Auto-save save method
  const saveStudioStateNow = useCallback(() => {
    try {
      setIsAutoSaving(true);
      const snapshot = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        currentTemplate,
        currentTime,
        zoomLevel,
        activeView,
        activeElementId,
        selectedExportRatios,
        templatesList,
        spreadsheetRecords,
        spreadsheetColumns,
        columnMappings,
        activeSheetName,
        availableSheets,
        uniqueBackgroundMode,
        backgroundPromptColumn,
        fallbackPrompt,
        bulkQueue,
      };
      localStorage.setItem(AUTO_SAVE_STORAGE_KEY, JSON.stringify(snapshot));
      setLastSavedTime(snapshot.timestamp);
      setTimeout(() => setIsAutoSaving(false), 800);
    } catch (err) {
      console.error('Error saving studio state to localStorage:', err);
      setIsAutoSaving(false);
    }
  }, [
    currentTemplate,
    currentTime,
    zoomLevel,
    activeView,
    activeElementId,
    selectedExportRatios,
    templatesList,
    spreadsheetRecords,
    spreadsheetColumns,
    columnMappings,
    activeSheetName,
    availableSheets,
    uniqueBackgroundMode,
    backgroundPromptColumn,
    fallbackPrompt,
    bulkQueue,
  ]);

  // Restore saved state helper
  const restoreSavedState = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(AUTO_SAVE_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.currentTemplate) setCurrentTemplate(data.currentTemplate);
      if (typeof data.currentTime === 'number') setCurrentTime(data.currentTime);
      if (typeof data.zoomLevel === 'number') setZoomLevel(data.zoomLevel);
      if (data.activeView) setActiveView(data.activeView);
      if (data.activeElementId !== undefined) setActiveElementId(data.activeElementId);
      if (data.selectedExportRatios) setSelectedExportRatios(data.selectedExportRatios);
      if (data.templatesList) setTemplatesList(data.templatesList);
      if (data.spreadsheetRecords) setSpreadsheetRecords(data.spreadsheetRecords);
      if (data.spreadsheetColumns) setSpreadsheetColumns(data.spreadsheetColumns);
      if (data.columnMappings) setColumnMappings(data.columnMappings);
      if (data.activeSheetName) setActiveSheetName(data.activeSheetName);
      if (data.availableSheets) setAvailableSheets(data.availableSheets);
      if (data.uniqueBackgroundMode) setUniqueBackgroundMode(data.uniqueBackgroundMode);
      if (data.backgroundPromptColumn) setBackgroundPromptColumn(data.backgroundPromptColumn);
      if (data.fallbackPrompt) setFallbackPrompt(data.fallbackPrompt);
      if (data.bulkQueue) setBulkQueue(data.bulkQueue);
      if (data.timestamp) setLastSavedTime(data.timestamp);
      return true;
    } catch (err) {
      console.error('Error restoring studio state from localStorage:', err);
      return false;
    }
  }, []);

  const clearSavedState = useCallback(() => {
    try {
      localStorage.removeItem(AUTO_SAVE_STORAGE_KEY);
      setLastSavedTime(null);
      showToast('Autosave cache cleared');
    } catch (err) {
      console.error('Failed to clear autosave:', err);
    }
  }, [showToast]);

  // Restore from localStorage once on initial mount if available, else load default dataset
  useEffect(() => {
    if (!stateRestoredRef.current) {
      stateRestoredRef.current = true;
      const hasStored = restoreSavedState();
      if (!hasStored) {
        loadPresetDataset('medical');
      } else {
        console.log('Studio state successfully restored from local storage');
      }
    }
  }, [restoreSavedState]);

  // Background auto-save timer: runs every 30 seconds
  useEffect(() => {
    const timer = window.setInterval(() => {
      saveStudioStateNow();
    }, 30000); // exactly every 30 seconds

    return () => {
      clearInterval(timer);
    };
  }, [saveStudioStateNow]);

  // Timeline playback loop
  useEffect(() => {
    if (isPlaying) {
      const step = 0.05;
      playheadIntervalRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + step;
          if (next >= currentTemplate.duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 50);
    } else {
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
        playheadIntervalRef.current = null;
      }
    }
    return () => {
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
    };
  }, [isPlaying, currentTemplate.duration]);

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const seekTo = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, currentTemplate.duration)));
  };

  // Canvas / Element functions
  const activeElement = currentTemplate.elements.find(e => e.id === activeElementId) || null;

  const updateTemplateProperty = (updates: Partial<ProjectTemplate>) => {
    setCurrentTemplate(prev => ({ ...prev, ...updates }));
  };

  const setAspectRatio = (ratio: AspectRatio, autoAdapt = true) => {
    if (autoAdapt) {
      const adapted = adaptTemplateToAspectRatio(currentTemplate, ratio);
      setCurrentTemplate(adapted);
      showToast(`Auto-adapted canvas and layout to ${adapted.dimensions.label}`);
    } else {
      const dim = ASPECT_RATIOS[ratio];
      setCurrentTemplate(prev => ({
        ...prev,
        dimensions: dim,
      }));
      showToast(`Canvas dimensions set to ${dim.label}`);
    }
  };

  const adaptCurrentTemplateLayout = (ratio: AspectRatio) => {
    const adapted = adaptTemplateToAspectRatio(currentTemplate, ratio);
    setCurrentTemplate(adapted);
    showToast(`Smart layout adapted for ${adapted.dimensions.label}`);
  };

  const toggleExportRatio = (ratio: AspectRatio) => {
    setSelectedExportRatios(prev => {
      if (prev.includes(ratio)) {
        if (prev.length === 1) {
          showToast('At least one platform aspect ratio must be selected');
          return prev;
        }
        return prev.filter(r => r !== ratio);
      } else {
        return [...prev, ratio];
      }
    });
  };

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setCurrentTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => (el.id === id ? { ...el, ...updates } : el)),
    }));
  };

  const addElement = (type: ElementType, options?: Partial<TemplateElement>) => {
    const newId = `el_${type}_${Date.now()}`;
    const defaultText = type === 'text' ? 'New Text' : (type === 'badge' ? 'BADGE' : undefined);

    const newElement: TemplateElement = {
      id: newId,
      type,
      name: options?.name || `New ${type.toUpperCase()}`,
      isDynamic: options?.isDynamic || false,
      dynamicField: options?.dynamicField,
      defaultValue: options?.defaultValue || (defaultText || ''),
      fallbackBehavior: 'default',
      x: options?.x ?? (currentTemplate.dimensions.width / 2 - 200),
      y: options?.y ?? (currentTemplate.dimensions.height / 2 - 60),
      width: options?.width ?? 400,
      height: options?.height ?? (type === 'text' ? 100 : 120),
      rotation: options?.rotation ?? 0,
      opacity: options?.opacity ?? 1,
      zIndex: currentTemplate.elements.length + 1,
      isLocked: false,
      isVisible: true,
      text: defaultText,
      fontFamily: 'Plus Jakarta Sans',
      fontSize: options?.fontSize || 36,
      fontWeight: '700',
      color: options?.color || '#ffffff',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.25,
      shapeType: options?.shapeType || (type === 'badge' ? 'rounded' : 'rectangle'),
      backgroundColor: options?.backgroundColor || (type === 'badge' ? 'rgba(30,41,59,0.9)' : undefined),
      borderRadius: options?.borderRadius || (type === 'badge' ? 20 : 12),
      trackId: currentTemplate.tracks[1]?.id || 'trk_text',
      startTime: 0,
      duration: currentTemplate.duration,
      textAnimation: 'slide-up',
      ...options,
    };

    setCurrentTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setActiveElementId(newId);
    showToast(`Added ${newElement.name}`);
  };

  const deleteElement = (id: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
    }));
    if (activeElementId === id) {
      setActiveElementId(null);
    }
    showToast('Element deleted');
  };

  const duplicateElement = (id: string) => {
    const el = currentTemplate.elements.find(e => e.id === id);
    if (!el) return;

    const dupId = `el_${el.type}_${Date.now()}`;
    const duplicated: TemplateElement = {
      ...el,
      id: dupId,
      name: `${el.name} (Copy)`,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: currentTemplate.elements.length + 1,
    };

    setCurrentTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, duplicated],
    }));
    setActiveElementId(dupId);
    showToast('Element duplicated');
  };

  const toggleDynamicElement = (id: string, isDynamic: boolean, fieldName?: string) => {
    updateElement(id, {
      isDynamic,
      dynamicField: fieldName !== undefined ? fieldName : (isDynamic ? (activeElement?.name || 'Field') : undefined),
    });
    showToast(`Element set to ${isDynamic ? 'DYNAMIC (Receives spreadsheet values)' : 'FIXED (Preserved identically across all videos)'}`);
  };

  const saveTemplateAsNew = (name: string) => {
    const newTpl: ProjectTemplate = {
      ...currentTemplate,
      id: `tpl_custom_${Date.now()}`,
      name: name || `Custom Template #${templatesList.length + 1}`,
    };
    setTemplatesList(prev => [newTpl, ...prev]);
    setCurrentTemplate(newTpl);
    showToast(`Template "${newTpl.name}" saved to library`);
  };

  const loadTemplate = (templateId: string) => {
    const found = templatesList.find(t => t.id === templateId);
    if (found) {
      setCurrentTemplate({ ...found });
      setActiveElementId(found.elements[0]?.id || null);
      setCurrentTime(0);
      showToast(`Loaded "${found.name}"`);
    }
  };

  // Bulk Dataset functions
  const loadPresetDataset = (presetKey: keyof typeof PRESET_DATASETS) => {
    const records = PRESET_DATASETS[presetKey] || PRESET_DATASETS.medical;
    setSpreadsheetRecords(records);
    setAvailableSheets(['DefaultSheet']);
    setActiveSheetName('DefaultSheet');

    const csvFormat = Object.keys(records[0]).join(',') + '\n' +
      records.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n');
    const { columns } = parseCSVText(csvFormat);
    setSpreadsheetColumns(columns);

    // Auto map columns to current template
    const suggested = autoSuggestMappings(columns, currentTemplate);
    setColumnMappings(suggested);

    // Check if background prompt column exists
    const pCol = columns.find(c => c.detectedType === 'prompt' || c.name.toLowerCase().includes('prompt'));
    if (pCol) {
      setBackgroundPromptColumn(pCol.name);
      setUniqueBackgroundMode('per-row-prompt');
    }

    // Refresh bulk queue
    const stockUrls = STOCK_BACKGROUND_MEDIA.map(m => m.url);
    const bgAssignments = assignBackgroundsToRecords(records, 'per-row-prompt', {
      backgroundPromptColumn: pCol?.name || 'Background_Prompt',
      fallbackPrompt,
      stockMediaUrls: stockUrls,
    });
    setBulkQueue(createBulkQueueItems(records, bgAssignments, 'Title'));
  };

  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseSpreadsheetBuffer(buffer);

      setAvailableSheets(parsed.sheets);
      const firstSheet = parsed.sheets[0] || 'Sheet1';
      setActiveSheetName(firstSheet);

      const records = parsed.recordsBySheet[firstSheet] || [];
      const columns = parsed.columnsBySheet[firstSheet] || [];

      setSpreadsheetRecords(records);
      setSpreadsheetColumns(columns);

      const suggested = autoSuggestMappings(columns, currentTemplate);
      setColumnMappings(suggested);

      const pCol = columns.find(c => c.detectedType === 'prompt' || c.name.toLowerCase().includes('prompt'));
      if (pCol) {
        setBackgroundPromptColumn(pCol.name);
        setUniqueBackgroundMode('per-row-prompt');
      }

      const stockUrls = STOCK_BACKGROUND_MEDIA.map(m => m.url);
      const bgAssignments = assignBackgroundsToRecords(records, uniqueBackgroundMode, {
        backgroundPromptColumn: pCol?.name,
        fallbackPrompt,
        stockMediaUrls: stockUrls,
      });

      setBulkQueue(createBulkQueueItems(records, bgAssignments, 'Title'));
      showToast(`Successfully imported ${records.length} records from ${file.name}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to parse file:', message);
      showToast(`Error parsing file: ${message}`);
    }
  };

  const updateMapping = (targetElementId: string, columnName: string) => {
    setColumnMappings(prev => {
      const filtered = prev.filter(m => m.targetElementId !== targetElementId);
      if (!columnName) return filtered;
      return [
        ...filtered,
        {
          targetElementId,
          columnName,
          targetProperty: 'text',
          defaultValue: '',
        },
      ];
    });
  };

  const autoMapColumns = () => {
    const suggested = autoSuggestMappings(spreadsheetColumns, currentTemplate);
    setColumnMappings(suggested);
    showToast(`Auto-mapped ${suggested.length} columns to dynamic template elements`);
  };

  // Bulk Generation Engine Runner
  const startBulkGeneration = async () => {
    if (!bulkQueue.length) {
      showToast('No records available to generate.');
      return;
    }

    setIsBulkProcessing(true);
    setBulkProgressPercent(0);
    cancelProcessingRef.current = false;
    const completedList: RenderedResult[] = [];

    const stockUrls = STOCK_BACKGROUND_MEDIA.map(m => m.url);
    const bgAssignments = assignBackgroundsToRecords(spreadsheetRecords, uniqueBackgroundMode, {
      backgroundPromptColumn,
      fallbackPrompt,
      stockMediaUrls: stockUrls,
    });

    const activeRatios = selectedExportRatios.length > 0 ? selectedExportRatios : [currentTemplate.dimensions.ratio];
    const totalJobs = bulkQueue.length * activeRatios.length;
    let completedJobs = 0;

    for (let i = 0; i < bulkQueue.length; i++) {
      if (cancelProcessingRef.current) {
        showToast('Bulk generation cancelled by user.');
        break;
      }

      // Update queue status
      setBulkQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing', progress: 10 } : item));

      const row = spreadsheetRecords[i];
      const bg = bgAssignments[i];

      // 1. Create independent template copy with applied dynamic variables and preserved fixed elements
      const baseRecordTemplate = applyRecordToTemplate(
        currentTemplate,
        row,
        columnMappings,
        bg.mediaUrl || currentTemplate.defaultBackgroundUrl
      );

      let lastThumb = '';
      let lastUrl = '';
      let lastSizeKb = 0;

      for (const ratio of activeRatios) {
        if (cancelProcessingRef.current) break;

        const preset = PLATFORM_ASPECT_RATIOS.find(p => p.id === ratio);
        const folderName = preset?.folderName || 'General_Videos';
        const resolution = preset?.resolution || `${ASPECT_RATIOS[ratio].width}x${ASPECT_RATIOS[ratio].height}`;

        // Auto-adapt template elements to this specific aspect ratio
        const adaptedRecordTemplate = adaptTemplateToAspectRatio(baseRecordTemplate, ratio);
        const renderer = new CanvasVideoRenderer(adaptedRecordTemplate);
        const thumb = renderer.generateThumbnail(8.0);
        lastThumb = thumb;

        try {
          const fullVideoDuration = currentTemplate.duration || 12;
          const videoBlob = await renderer.renderVideoBlob(15, (p) => {
            const stepProgress = Math.floor(p);
            setBulkQueue(prev => prev.map((item, idx) => idx === i ? { ...item, progress: Math.min(95, 20 + Math.floor(stepProgress * 0.75)) } : item));
          }, fullVideoDuration);

          const url = URL.createObjectURL(videoBlob);
          lastUrl = url;
          lastSizeKb = Math.round(videoBlob.size / 1024);

          const itemResult: RenderedResult = {
            index: i + 1,
            title: bulkQueue[i].title,
            blob: videoBlob,
            url,
            thumbnailUrl: thumb,
            sizeKb: lastSizeKb,
            ratio,
            folderName,
            resolution,
          };

          completedList.push(itemResult);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Failed rendering item ${i} (${ratio}):`, message);
        }

        completedJobs++;
        const percent = Math.round((completedJobs / totalJobs) * 100);
        setBulkProgressPercent(percent);
      }

      setBulkQueue(prev => prev.map((item, idx) => idx === i ? {
        ...item,
        status: 'completed',
        progress: 100,
        videoBlobUrl: lastUrl,
        thumbnailUrl: lastThumb,
        outputSizeKb: lastSizeKb,
      } : item));
    }

    setRenderedResults(completedList);
    setIsBulkProcessing(false);
    showToast(`Bulk processing complete! ${completedList.length} videos generated across ${activeRatios.length} platforms.`);
  };

  const loadRecordIntoEditor = (index: number) => {
    const row = spreadsheetRecords[index];
    if (!row) return;

    const stockUrls = STOCK_BACKGROUND_MEDIA.map(m => m.url);
    const bgAssignments = assignBackgroundsToRecords(spreadsheetRecords, uniqueBackgroundMode, {
      backgroundPromptColumn,
      fallbackPrompt,
      stockMediaUrls: stockUrls,
    });
    const bg = bgAssignments[index];

    const customizedTemplate = applyRecordToTemplate(
      currentTemplate,
      row,
      columnMappings,
      bg?.mediaUrl || currentTemplate.defaultBackgroundUrl
    );

    setCurrentTemplate(customizedTemplate);
    setActiveView('editor');
    showToast(`Loaded Record #${index + 1} ("${bulkQueue[index]?.title || 'Video'}") into Creative Studio`);
  };

  const updateBulkQueueItem = (index: number, updatedRow: Record<string, string>, updatedPrompt?: string) => {
    setSpreadsheetRecords(prev => prev.map((r, i) => i === index ? { ...r, ...updatedRow } : r));
    setBulkQueue(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          dataRow: { ...item.dataRow, ...updatedRow },
          title: updatedRow.Title || updatedRow.Question || item.title,
          backgroundPrompt: updatedPrompt !== undefined ? updatedPrompt : item.backgroundPrompt,
        };
      }
      return item;
    }));
    showToast(`Record #${index + 1} updated successfully`);
  };

  const pauseBulkGeneration = () => {
    cancelProcessingRef.current = true;
    setIsBulkProcessing(false);
    showToast('Bulk generation paused.');
  };

  const cancelBulkGeneration = () => {
    cancelProcessingRef.current = true;
    setIsBulkProcessing(false);
    showToast('Bulk generation cancelled.');
  };

  const downloadVideoBlob = (result: RenderedResult) => {
    const a = document.createElement('a');
    a.href = result.url;
    const ratioTag = result.ratio ? `_${result.ratio.replace(':', 'x')}` : '';
    a.download = `Video_${String(result.index).padStart(3, '0')}_${result.title.replace(/\s+/g, '_')}${ratioTag}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (!renderedResults.length) {
      showToast('No rendered videos to export. Generate videos first.');
      return;
    }

    setIsZipping(true);
    setZipProgress(0);
    try {
      const itemsToZip = renderedResults.map(r => ({
        index: r.index,
        title: r.title,
        blob: r.blob,
        ratio: r.ratio,
        folderName: r.folderName,
        resolution: r.resolution,
      }));

      const zipBlob = await bundleVideosToZip(itemsToZip, (pct) => {
        setZipProgress(pct);
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MultiPlatform_Videos_Suite_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Multi-platform videos exported and downloaded in organized folders!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('ZIP bundling failed:', message);
      showToast(`ZIP generation failed: ${message}`);
    } finally {
      setIsZipping(false);
    }
  };

  // Admin & Licensing
  const refreshAdminData = async () => {
    try {
      const [custRes, licRes, setRes] = await Promise.all([
        fetch('/api/admin/customers').then(r => r.json()),
        fetch('/api/admin/licenses').then(r => r.json()),
        fetch('/api/admin/settings').then(r => r.json()),
      ]);
      if (Array.isArray(custRes)) setCustomers(custRes);
      if (setRes) setWhiteLabel(setRes);
    } catch (err: unknown) {
      console.error('Failed to sync admin data with server:', err);
    }
  };

  const activateNewLicenseKey = async (key: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/license/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: key,
          deviceId: 'win_desktop_client_node_01',
          deviceName: 'Windows 11 Workstation (Active Device)',
        }),
      });

      const data = await res.json();
      if (data.isValid && data.license) {
        setActiveLicense(data.license);
        showToast(`License activated! Welcome ${data.customerName || 'User'} (${data.tier.toUpperCase()})`);
        return { success: true, message: 'License key activated successfully!' };
      } else {
        return { success: false, message: data.error || 'Failed to verify license key.' };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Activation error: ${message}` };
    }
  };

  return (
    <StudioContext.Provider
      value={{
        activeView,
        setActiveView,
        currentTemplate,
        setCurrentTemplate,
        updateTemplateProperty,
        setAspectRatio,
        adaptCurrentTemplateLayout,
        selectedExportRatios,
        setSelectedExportRatios,
        toggleExportRatio,
        templatesList,
        saveTemplateAsNew,
        loadTemplate,
        activeElementId,
        setActiveElementId,
        activeElement,
        updateElement,
        addElement,
        deleteElement,
        duplicateElement,
        toggleDynamicElement,
        zoomLevel,
        setZoomLevel,
        currentTime,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        togglePlayPause,
        seekTo,
        spreadsheetRecords,
        spreadsheetColumns,
        columnMappings,
        activeSheetName,
        availableSheets,
        uniqueBackgroundMode,
        setUniqueBackgroundMode,
        backgroundPromptColumn,
        setBackgroundPromptColumn,
        fallbackPrompt,
        setFallbackPrompt,
        loadPresetDataset,
        handleFileUpload,
        updateMapping,
        autoMapColumns,
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
        activeLicense,
        setActiveLicense,
        whiteLabel,
        setWhiteLabel,
        customers,
        refreshAdminData,
        activateNewLicenseKey,
        lastSavedTime,
        isAutoSaving,
        saveStudioStateNow,
        restoreSavedState,
        clearSavedState,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used within a StudioProvider');
  return context;
};
