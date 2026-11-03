export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export interface CanvasDimensions {
  width: number;
  height: number;
  label: string;
  ratio: AspectRatio;
}

export const ASPECT_RATIOS: Record<AspectRatio, CanvasDimensions> = {
  '9:16': { width: 1080, height: 1920, label: '9:16 TikTok / Reels / Shorts', ratio: '9:16' },
  '16:9': { width: 1920, height: 1080, label: '16:9 YouTube / Desktop', ratio: '16:9' },
  '1:1': { width: 1080, height: 1080, label: '1:1 Square / Instagram Post', ratio: '1:1' },
  '4:5': { width: 1080, height: 1350, label: '4:5 Portrait / Social Feed', ratio: '4:5' },
};

export type ElementType = 'text' | 'image' | 'video' | 'shape' | 'badge' | 'audio' | 'watermark';

export type TextAnimationType = 'none' | 'fade-in' | 'slide-up' | 'pop' | 'typewriter' | 'bounce';
export type VideoTransitionType = 'none' | 'fade' | 'dissolve' | 'slide-left' | 'slide-right' | 'zoom-in' | 'wipe';
export type VideoFilterType = 'none' | 'cinematic' | 'vibrant' | 'vintage' | 'moody' | 'grayscale' | 'warm';

export interface TemplateElement {
  id: string;
  type: ElementType;
  name: string;
  
  // Dynamic vs Fixed
  isDynamic: boolean;
  dynamicField?: string; // e.g. "Question", "Main_Heading", "Background_Prompt"
  defaultValue: string;
  fallbackBehavior: 'default' | 'hide' | 'placeholder';
  
  // Transform & Geometry
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;

  // Text specific
  text?: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  textAnimation?: TextAnimationType;

  // Visual/Media specific
  src?: string;
  videoDuration?: number;
  shapeType?: 'rectangle' | 'rounded' | 'circle' | 'pill' | 'badge' | 'border-frame';
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  filter?: VideoFilterType;
  
  // Timeline specific
  trackId: string;
  startTime: number; // seconds
  duration: number; // seconds
  transitionIn?: VideoTransitionType;
  transitionOut?: VideoTransitionType;
  transitionDuration?: number;

  // Audio specific
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'voiceover' | 'text' | 'subtitles' | 'background';
  isMuted: boolean;
  isLocked: boolean;
  color: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'quiz' | 'motivational' | 'education' | 'facts' | 'marketing' | 'storytelling' | 'custom';
  dimensions: CanvasDimensions;
  duration: number; // total duration in seconds
  elements: TemplateElement[];
  tracks: TimelineTrack[];
  backgroundMode: 'color' | 'image' | 'video' | 'ai-prompt';
  backgroundColor?: string;
  defaultBackgroundUrl?: string;
  defaultBackgroundPrompt?: string;
}

export interface SpreadsheetColumn {
  name: string;
  sampleValues: string[];
  detectedType: 'text' | 'prompt' | 'url' | 'number';
}

export interface ColumnMapping {
  columnName: string;
  targetElementId: string;
  targetProperty: 'text' | 'src' | 'background' | 'subtitle' | 'audio';
  defaultValue: string;
}

export type UniqueBackgroundMode = 
  | 'per-row-prompt'      // From mapped column containing prompt
  | 'ai-random'           // AI prompts randomized from theme
  | 'sequential-video'    // Cycles through stock/uploaded motion videos
  | 'random-stock'        // Picks random high-res/video from library
  | 'custom-user-media';  // List of uploaded user backgrounds

export interface BulkJobConfig {
  templateId: string;
  records: Record<string, string>[];
  mappings: ColumnMapping[];
  uniqueBackgroundMode: UniqueBackgroundMode;
  backgroundPromptColumn?: string;
  fallbackBackgroundPrompt: string;
  backgroundCategory?: string;
  outputFormat: 'mp4' | 'webm';
  resolution: '720p' | '1080p' | '4k';
  fps: 30 | 60;
  workerCount: number;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'paused';

export interface BulkVideoItem {
  id: string;
  index: number;
  dataRow: Record<string, string>;
  title: string;
  backgroundPrompt: string;
  backgroundMediaUrl: string;
  status: JobStatus;
  progress: number;
  videoBlobUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  renderDurationMs?: number;
  outputSizeKb?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: 'active' | 'suspended' | 'trial' | 'expired';
  licenseKey: string;
  licenseTier: 'trial' | 'starter' | 'pro' | 'agency_unlimited';
  activatedDevices: number;
  maxDevices: number;
  createdDate: string;
  expiresDate: string; // ISO date string or 'lifetime'
  notes?: string;
}

export interface License {
  id: string;
  key: string;
  customerName: string;
  customerEmail: string;
  tier: 'trial' | 'starter' | 'pro' | 'agency_unlimited';
  type: 'monthly' | 'yearly' | 'lifetime' | 'trial';
  status: 'active' | 'revoked' | 'expired' | 'suspended';
  issuedAt: string;
  expiresAt: string;
  maxDevices: number;
  activatedDevicesList: {
    deviceId: string;
    deviceName: string;
    activatedAt: string;
    lastPing: string;
    ipAddress?: string;
  }[];
  features: {
    canvaEditor: boolean;
    capcutEditor: boolean;
    bulkAutomation: boolean;
    aiImageGeneration: boolean;
    aiVideoGeneration: boolean;
    export4K: boolean;
    whiteLabel: boolean;
    unlimitedTemplates: boolean;
  };
}

export interface WhiteLabelSettings {
  softwareName: string;
  tagline: string;
  logoUrl: string;
  brandPrimaryColor: string;
  supportEmail: string;
  companyName: string;
  websiteUrl: string;
  version: string;
  copyrightYear: string;
}

export * from './admin';

