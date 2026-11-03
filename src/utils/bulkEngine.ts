import * as XLSX from 'xlsx';
import { 
  ProjectTemplate, 
  TemplateElement, 
  SpreadsheetColumn, 
  ColumnMapping, 
  UniqueBackgroundMode,
  BulkVideoItem,
  AspectRatio,
  ASPECT_RATIOS
} from '../types';

/**
 * Universal Spreadsheet parser supporting XLSX, XLS, and CSV
 */
export function parseSpreadsheetBuffer(buffer: ArrayBuffer | Uint8Array): {
  sheets: string[];
  recordsBySheet: Record<string, Record<string, string>[]>;
  columnsBySheet: Record<string, SpreadsheetColumn[]>;
} {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheets = workbook.SheetNames;
  const recordsBySheet: Record<string, Record<string, string>[]> = {};
  const columnsBySheet: Record<string, SpreadsheetColumn[]> = {};

  for (const sheetName of sheets) {
    const worksheet = workbook.Sheets[sheetName];
    // Convert to array of objects, with header row
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    
    // Normalize keys and stringify values
    const records: Record<string, string>[] = rawData.map(row => {
      const cleanRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        const trimmedKey = key.trim();
        if (trimmedKey) {
          cleanRow[trimmedKey] = val !== null && val !== undefined ? String(val).trim() : '';
        }
      }
      return cleanRow;
    }).filter(row => Object.values(row).some(v => v !== '')); // Skip fully blank rows

    recordsBySheet[sheetName] = records;
    columnsBySheet[sheetName] = detectColumnsFromRecords(records);
  }

  return { sheets, recordsBySheet, columnsBySheet };
}

/**
 * Parse CSV text directly
 */
export function parseCSVText(csvText: string): {
  records: Record<string, string>[];
  columns: SpreadsheetColumn[];
} {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[firstSheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  const records: Record<string, string>[] = rawData.map(row => {
    const cleanRow: Record<string, string> = {};
    for (const [key, val] of Object.entries(row)) {
      const trimmedKey = key.trim();
      if (trimmedKey) {
        cleanRow[trimmedKey] = val !== null && val !== undefined ? String(val).trim() : '';
      }
    }
    return cleanRow;
  }).filter(row => Object.values(row).some(v => v !== ''));

  const columns = detectColumnsFromRecords(records);
  return { records, columns };
}

/**
 * Auto-detect columns, data types, and sample values
 */
export function detectColumnsFromRecords(records: Record<string, string>[]): SpreadsheetColumn[] {
  if (!records.length) return [];

  // Extract all unique column headers across all rows
  const columnKeySet = new Set<string>();
  records.forEach(row => {
    Object.keys(row).forEach(k => columnKeySet.add(k));
  });

  const columns: SpreadsheetColumn[] = [];

  for (const colName of columnKeySet) {
    const sampleValues: string[] = [];
    let isAllNumbers = true;
    let isAllUrls = true;
    let hasPromptKeywords = false;
    const lowerCol = colName.toLowerCase();

    if (
      lowerCol.includes('prompt') || 
      lowerCol.includes('background') || 
      lowerCol.includes('scene') ||
      lowerCol.includes('visual')
    ) {
      hasPromptKeywords = true;
    }

    for (const row of records) {
      const val = row[colName] || '';
      if (val && sampleValues.length < 5) {
        sampleValues.push(val);
      }
      if (val) {
        if (isNaN(Number(val))) {
          isAllNumbers = false;
        }
        if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('data:')) {
          isAllUrls = false;
        }
      }
    }

    let detectedType: SpreadsheetColumn['detectedType'] = 'text';
    if (hasPromptKeywords) {
      detectedType = 'prompt';
    } else if (isAllUrls && sampleValues.length > 0) {
      detectedType = 'url';
    } else if (isAllNumbers && sampleValues.length > 0) {
      detectedType = 'number';
    }

    columns.push({
      name: colName,
      sampleValues,
      detectedType,
    });
  }

  return columns;
}

/**
 * Intelligent automatic mapping between spreadsheet columns and dynamic template elements
 */
export function autoSuggestMappings(
  columns: SpreadsheetColumn[],
  template: ProjectTemplate
): ColumnMapping[] {
  const dynamicElements = template.elements.filter(el => el.isDynamic);
  const mappings: ColumnMapping[] = [];

  for (const el of dynamicElements) {
    const elName = (el.dynamicField || el.name || '').toLowerCase();

    // Look for exact match or substring match in column names
    const matchedCol = columns.find(col => {
      const cName = col.name.toLowerCase();
      return (
        cName === elName ||
        cName.replace(/[_\s-]/g, '') === elName.replace(/[_\s-]/g, '') ||
        cName.includes(elName) ||
        elName.includes(cName)
      );
    });

    if (matchedCol) {
      mappings.push({
        columnName: matchedCol.name,
        targetElementId: el.id,
        targetProperty: el.type === 'image' || el.type === 'video' ? 'src' : 'text',
        defaultValue: el.defaultValue || '',
      });
    }
  }

  return mappings;
}

/**
 * Applies dynamic values to a template copy for a specific data record
 * Crucial rule: Fixed elements are strictly preserved, dynamic elements receive mapped values.
 */
export function applyRecordToTemplate(
  baseTemplate: ProjectTemplate,
  record: Record<string, string>,
  mappings: ColumnMapping[],
  backgroundUrl?: string
): ProjectTemplate {
  // Deep clone elements to prevent mutating base template
  const clonedElements: TemplateElement[] = baseTemplate.elements.map(el => ({ ...el }));

  for (const mapping of mappings) {
    const element = clonedElements.find(e => e.id === mapping.targetElementId);
    if (!element || !element.isDynamic) continue;

    const rawValue = record[mapping.columnName];
    const value = rawValue !== undefined && rawValue !== '' ? rawValue : (mapping.defaultValue || element.defaultValue || '');

    if (mapping.targetProperty === 'text') {
      element.text = value;
    } else if (mapping.targetProperty === 'src') {
      element.src = value;
    } else if (mapping.targetProperty === 'subtitle') {
      element.text = value;
    }
  }

  // Handle fallback behavior for dynamic elements without value
  clonedElements.forEach(el => {
    if (el.isDynamic && (!el.text && !el.src)) {
      if (el.fallbackBehavior === 'hide') {
        el.isVisible = false;
      } else if (el.fallbackBehavior === 'default') {
        el.text = el.defaultValue;
      }
    }
  });

  return {
    ...baseTemplate,
    elements: clonedElements,
    defaultBackgroundUrl: backgroundUrl || baseTemplate.defaultBackgroundUrl,
  };
}

/**
 * Assign unique background per record according to selected mode
 */
export function assignBackgroundsToRecords(
  records: Record<string, string>[],
  mode: UniqueBackgroundMode,
  options: {
    backgroundPromptColumn?: string;
    fallbackPrompt: string;
    stockMediaUrls: string[];
    aiPromptList?: string[];
  }
): { prompt: string; mediaUrl: string }[] {
  const { backgroundPromptColumn, fallbackPrompt, stockMediaUrls, aiPromptList = [] } = options;
  const results: { prompt: string; mediaUrl: string }[] = [];

  records.forEach((row, idx) => {
    let prompt = fallbackPrompt;
    let mediaUrl = stockMediaUrls.length > 0 ? stockMediaUrls[idx % stockMediaUrls.length] : '';

    if (mode === 'per-row-prompt' && backgroundPromptColumn) {
      const rowPrompt = row[backgroundPromptColumn];
      if (rowPrompt && rowPrompt.trim()) {
        prompt = rowPrompt.trim();
      }
    } else if (mode === 'ai-random' && aiPromptList.length > 0) {
      prompt = aiPromptList[idx % aiPromptList.length];
    } else if (mode === 'sequential-video' && stockMediaUrls.length > 0) {
      mediaUrl = stockMediaUrls[idx % stockMediaUrls.length];
    } else if (mode === 'random-stock' && stockMediaUrls.length > 0) {
      const randomIdx = (idx * 7 + 3) % stockMediaUrls.length;
      mediaUrl = stockMediaUrls[randomIdx];
    }

    results.push({ prompt, mediaUrl });
  });

  return results;
}

/**
 * Initialize bulk video items queue from spreadsheet records
 */
export function createBulkQueueItems(
  records: Record<string, string>[],
  backgroundAssignments: { prompt: string; mediaUrl: string }[],
  titleColumnName?: string
): BulkVideoItem[] {
  return records.map((row, idx) => {
    let title = `Video #${idx + 1}`;
    if (titleColumnName && row[titleColumnName]) {
      title = String(row[titleColumnName]).slice(0, 40);
    } else {
      // Find first available text field
      const firstVal = Object.values(row).find(v => v && v.length > 2);
      if (firstVal) {
        title = firstVal.slice(0, 35);
      }
    }

    const bg = backgroundAssignments[idx] || { prompt: '', mediaUrl: '' };

    return {
      id: `bulk_item_${Date.now()}_${idx}`,
      index: idx + 1,
      dataRow: row,
      title,
      backgroundPrompt: bg.prompt,
      backgroundMediaUrl: bg.mediaUrl,
      status: 'pending',
      progress: 0,
    };
  });
}

export interface PlatformPreset {
  id: AspectRatio;
  name: string;
  platform: string;
  folderName: string;
  resolution: string;
  width: number;
  height: number;
  desc: string;
}

export const PLATFORM_ASPECT_RATIOS: PlatformPreset[] = [
  {
    id: '9:16',
    name: 'TikTok / Reels / Shorts',
    platform: 'Instagram Reels, TikTok & YouTube Shorts',
    folderName: 'Instagram_Reels_TikTok_9x16_Vertical',
    resolution: '1080x1920',
    width: 1080,
    height: 1920,
    desc: '9:16 full-screen smartphone vertical format for viral short-form algorithms',
  },
  {
    id: '16:9',
    name: 'YouTube Landscape / Desktop',
    platform: 'YouTube HD, Facebook Desktop & TV Screens',
    folderName: 'YouTube_16x9_Landscape',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    desc: '16:9 widescreen HD landscape with auto-expanded question canvas and side-by-side options',
  },
  {
    id: '1:1',
    name: 'Instagram & Facebook Feed Square',
    platform: 'Instagram Feed, Facebook Carousel & LinkedIn',
    folderName: 'Instagram_Feed_1x1_Square',
    resolution: '1080x1080',
    width: 1080,
    height: 1080,
    desc: '1:1 square canvas with auto-condensed vertical flow and balanced typography',
  },
  {
    id: '4:5',
    name: 'Facebook & Instagram Portrait',
    platform: 'Facebook Mobile Post & Instagram Portrait',
    folderName: 'Facebook_Feed_4x5_Portrait',
    resolution: '1080x1350',
    width: 1080,
    height: 1350,
    desc: '4:5 portrait format maximizing screen real estate on mobile newsfeeds',
  },
];

/**
 * Intelligently adapts template elements, fonts, and positions to any aspect ratio
 * with automatic responsive layout calculation and support for manual overrides.
 */
export function adaptTemplateToAspectRatio(
  baseTemplate: ProjectTemplate,
  targetRatio: AspectRatio,
  manualOverrides?: Partial<Record<string, Partial<TemplateElement>>>
): ProjectTemplate {
  const targetDims = ASPECT_RATIOS[targetRatio];
  const tW = targetDims.width;
  const tH = targetDims.height;
  const sW = baseTemplate.dimensions.width;
  const sH = baseTemplate.dimensions.height;

  const scaleX = tW / sW;
  const scaleY = tH / sH;

  const adaptedElements: TemplateElement[] = baseTemplate.elements.map(el => {
    let newX = el.x;
    let newY = el.y;
    let newW = el.width;
    let newH = el.height;
    let newFontSize = el.fontSize;

    const lowerId = el.id.toLowerCase();
    const lowerName = el.name.toLowerCase();
    const dynamicField = el.dynamicField || '';

    // Specialized auto-responsive layout rules for quiz & video templates
    if (targetRatio === '16:9') {
      // 1920 x 1080 Widescreen Landscape
      if (lowerId.includes('watermark') || el.type === 'badge' && lowerName.includes('watermark')) {
        newW = 360;
        newH = 46;
        newX = Math.round((tW - newW) / 2);
        newY = 35;
        newFontSize = 20;
      } else if (dynamicField === 'Title' || lowerId.includes('topic')) {
        newW = 1000;
        newH = 48;
        newX = Math.round((tW - newW) / 2);
        newY = 92;
        newFontSize = 24;
      } else if (dynamicField === 'Question' || lowerName.includes('question')) {
        newW = 1400;
        newH = 150;
        newX = Math.round((tW - newW) / 2);
        newY = 155;
        newFontSize = 38;
      } else if (dynamicField === 'Option_A' || lowerId.includes('opt_a')) {
        // Left column in 16:9
        newW = 680;
        newH = 92;
        newX = 260;
        newY = 330;
        newFontSize = 28;
      } else if (dynamicField === 'Option_B' || lowerId.includes('opt_b')) {
        // Right column in 16:9
        newW = 680;
        newH = 92;
        newX = 980;
        newY = 330;
        newFontSize = 28;
      } else if (dynamicField === 'Correct_Answer' || lowerId.includes('answer')) {
        newW = 1400;
        newH = 130;
        newX = Math.round((tW - newW) / 2);
        newY = 445;
        newFontSize = 32;
      } else if (dynamicField === 'Fact_Detail' || lowerId.includes('fact')) {
        newW = 1300;
        newH = 110;
        newX = Math.round((tW - newW) / 2);
        newY = 595;
        newFontSize = 24;
      } else {
        // General element scaling
        newW = Math.round(el.width * scaleX);
        newH = Math.round(el.height * scaleY);
        newX = Math.round(el.x * scaleX);
        newY = Math.round(el.y * scaleY);
        newFontSize = Math.round(el.fontSize * Math.min(scaleX, scaleY));
      }
    } else if (targetRatio === '1:1') {
      // 1080 x 1080 Square
      if (lowerId.includes('watermark') || lowerName.includes('watermark')) {
        newW = 340;
        newH = 44;
        newX = Math.round((tW - newW) / 2);
        newY = 30;
        newFontSize = 18;
      } else if (dynamicField === 'Title' || lowerId.includes('topic')) {
        newW = 800;
        newH = 46;
        newX = Math.round((tW - newW) / 2);
        newY = 84;
        newFontSize = 22;
      } else if (dynamicField === 'Question' || lowerName.includes('question')) {
        newW = 960;
        newH = 175;
        newX = Math.round((tW - newW) / 2);
        newY = 140;
        newFontSize = 36;
      } else if (dynamicField === 'Option_A' || lowerId.includes('opt_a')) {
        newW = 900;
        newH = 80;
        newX = Math.round((tW - newW) / 2);
        newY = 335;
        newFontSize = 28;
      } else if (dynamicField === 'Option_B' || lowerId.includes('opt_b')) {
        newW = 900;
        newH = 80;
        newX = Math.round((tW - newW) / 2);
        newY = 430;
        newFontSize = 28;
      } else if (dynamicField === 'Correct_Answer' || lowerId.includes('answer')) {
        newW = 960;
        newH = 135;
        newX = Math.round((tW - newW) / 2);
        newY = 530;
        newFontSize = 30;
      } else if (dynamicField === 'Fact_Detail' || lowerId.includes('fact')) {
        newW = 900;
        newH = 115;
        newX = Math.round((tW - newW) / 2);
        newY = 685;
        newFontSize = 22;
      } else {
        newW = Math.round(el.width * scaleX);
        newH = Math.round(el.height * scaleY);
        newX = Math.round(el.x * scaleX);
        newY = Math.round(el.y * scaleY);
        newFontSize = Math.round(el.fontSize * Math.min(scaleX, scaleY));
      }
    } else if (targetRatio === '4:5') {
      // 1080 x 1350 Portrait
      if (lowerId.includes('watermark') || lowerName.includes('watermark')) {
        newW = 360;
        newH = 48;
        newX = Math.round((tW - newW) / 2);
        newY = 45;
        newFontSize = 20;
      } else if (dynamicField === 'Title' || lowerId.includes('topic')) {
        newW = 800;
        newH = 50;
        newX = Math.round((tW - newW) / 2);
        newY = 105;
        newFontSize = 24;
      } else if (dynamicField === 'Question' || lowerName.includes('question')) {
        newW = 940;
        newH = 200;
        newX = Math.round((tW - newW) / 2);
        newY = 175;
        newFontSize = 38;
      } else if (dynamicField === 'Option_A' || lowerId.includes('opt_a')) {
        newW = 880;
        newH = 88;
        newX = Math.round((tW - newW) / 2);
        newY = 405;
        newFontSize = 30;
      } else if (dynamicField === 'Option_B' || lowerId.includes('opt_b')) {
        newW = 880;
        newH = 88;
        newX = Math.round((tW - newW) / 2);
        newY = 510;
        newFontSize = 30;
      } else if (dynamicField === 'Correct_Answer' || lowerId.includes('answer')) {
        newW = 940;
        newH = 150;
        newX = Math.round((tW - newW) / 2);
        newY = 620;
        newFontSize = 34;
      } else if (dynamicField === 'Fact_Detail' || lowerId.includes('fact')) {
        newW = 900;
        newH = 130;
        newX = Math.round((tW - newW) / 2);
        newY = 790;
        newFontSize = 24;
      } else {
        newW = Math.round(el.width * scaleX);
        newH = Math.round(el.height * scaleY);
        newX = Math.round(el.x * scaleX);
        newY = Math.round(el.y * scaleY);
        newFontSize = Math.round(el.fontSize * Math.min(scaleX, scaleY));
      }
    } else {
      // 9:16 Tall Vertical (1080 x 1920)
      if (sW !== 1080 || sH !== 1920) {
        newW = Math.round(el.width * scaleX);
        newH = Math.round(el.height * scaleY);
        newX = Math.round(el.x * scaleX);
        newY = Math.round(el.y * scaleY);
        newFontSize = Math.round(el.fontSize * Math.min(scaleX, scaleY));
      }
    }

    // Apply manual override if specified for this element
    const override = manualOverrides?.[el.id];
    return {
      ...el,
      x: override?.x !== undefined ? override.x : newX,
      y: override?.y !== undefined ? override.y : newY,
      width: override?.width !== undefined ? override.width : newW,
      height: override?.height !== undefined ? override.height : newH,
      fontSize: override?.fontSize !== undefined ? override.fontSize : newFontSize,
      ...(override || {}),
    };
  });

  return {
    ...baseTemplate,
    dimensions: targetDims,
    elements: adaptedElements,
  };
}
